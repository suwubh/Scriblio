
export interface RedisPresenceMessage {
  type: 'join' | 'leave' | 'update'
  userId: string
  roomId: string
  presence?: any
  timestamp: number
}

export interface RedisSignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left'
  from: string
  to: string
  roomId: string
  data: any
  timestamp: number
}

export class RedisManager {
  private ws: WebSocket | null = null
  private reconnectInterval: number = 3000
  private maxReconnectAttempts: number = 5
  private reconnectAttempts: number = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isIntentionallyClosed: boolean = false
  private isConnecting: boolean = false
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastHeartbeat: number = Date.now()
  
  private onPresenceCallback?: (message: RedisPresenceMessage) => void
  private onSignalingCallback?: (message: RedisSignalingMessage) => void
  private onConnectionCallback?: (connected: boolean) => void

  constructor(private redisWsUrl: string) {
    this.connect()
  }

  private connect(): void {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('⏭️ Already connecting, skipping...')
      return
    }

    // Don't reconnect if intentionally closed
    if (this.isIntentionallyClosed) {
      console.log('⏭️ Connection intentionally closed, not reconnecting')
      return
    }

    this.isConnecting = true

    try {
      console.log('🔌 Connecting to Redis WebSocket:', this.redisWsUrl)
      this.ws = new WebSocket(this.redisWsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error)
      this.isConnecting = false
      this.handleReconnect()
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('✅ Connected to Redis WebSocket')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.onConnectionCallback?.(true)
      
      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      // Start heartbeat
      this.startHeartbeat()
    }

    this.ws.onclose = (event) => {
      console.log('🔌 Redis WebSocket connection closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      
      this.isConnecting = false
      this.stopHeartbeat()
      this.onConnectionCallback?.(false)

      // Only reconnect if not intentionally closed
      if (!this.isIntentionallyClosed) {
        this.handleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('❌ Redis WebSocket error:', error)
      this.isConnecting = false
      this.onConnectionCallback?.(false)
    }

    this.ws.onmessage = (event) => {
      this.lastHeartbeat = Date.now()
      this.handleMessage(event.data)
    }
  }

  private startHeartbeat(): void {
    // Clear any existing heartbeat
    this.stopHeartbeat()

    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }))
        } catch (error) {
          console.error('❌ Failed to send heartbeat:', error)
        }
      }

      // Check if we've received a message recently
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat
      if (timeSinceLastHeartbeat > 45000) { // 45 seconds
        console.warn('⚠️ No heartbeat received, connection may be dead')
        this.reconnect()
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      
      // Handle pong responses
      if (message.type === 'pong') {
        this.lastHeartbeat = Date.now()
        return
      }
      
      if (message.channel?.startsWith('presence:')) {
        this.onPresenceCallback?.(message.data)
      } else if (message.channel?.startsWith('signaling:')) {
        this.onSignalingCallback?.(message.data)
      }
    } catch (error) {
      console.error('❌ Failed to parse Redis message:', error, data)
    }
  }

  private handleReconnect(): void {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // Don't reconnect if intentionally closed
    if (this.isIntentionallyClosed) {
      return
    }

    // Check max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      this.onConnectionCallback?.(false)
      return
    }

    this.reconnectAttempts++
    
    // Calculate exponential backoff
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    )

    console.log(`⏱️ Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.reconnectTimeout = null
      this.connect()
    }, delay)
  }

  private reconnect(): void {
    console.log('🔄 Forcing reconnection...')
    
    // Close existing connection
    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        console.error('Error closing WebSocket:', error)
      }
      this.ws = null
    }

    this.isConnecting = false
    this.reconnectAttempts = 0
    this.connect()
  }

  // Subscribe to presence updates for a room
  subscribeToPresence(roomId: string): void {
    if (!this.isConnected()) {
      console.warn('⚠️ Cannot subscribe - not connected')
      return
    }

    this.send({
      type: 'subscribe',
      channel: `presence:${roomId}`
    })
  }

  // Subscribe to signaling for WebRTC coordination
  subscribeToSignaling(roomId: string): void {
    if (!this.isConnected()) {
      console.warn('⚠️ Cannot subscribe - not connected')
      return
    }

    this.send({
      type: 'subscribe',
      channel: `signaling:${roomId}`
    })
  }

  // Publish presence update
  publishPresence(message: RedisPresenceMessage): void {
    this.send({
      type: 'publish',
      channel: `presence:${message.roomId}`,
      data: message
    })
  }

  // Publish signaling message
  publishSignaling(message: RedisSignalingMessage): void {
    this.send({
      type: 'publish',
      channel: `signaling:${message.roomId}`,
      data: message
    })
  }

  // Join room and announce presence
  joinRoom(roomId: string, userId: string, userPresence: any): void {
    const message: RedisPresenceMessage = {
      type: 'join',
      userId,
      roomId,
      presence: userPresence,
      timestamp: Date.now()
    }
    this.publishPresence(message)
  }

  // Leave room
  leaveRoom(roomId: string, userId: string): void {
    const message: RedisPresenceMessage = {
      type: 'leave',
      userId,
      roomId,
      timestamp: Date.now()
    }
    this.publishPresence(message)
  }

  // Update presence in room
  updatePresence(roomId: string, userId: string, presence: any): void {
    const message: RedisPresenceMessage = {
      type: 'update',
      userId,
      roomId,
      presence,
      timestamp: Date.now()
    }
    this.publishPresence(message)
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('❌ Failed to send message:', error)
      }
    } else {
      console.warn('⚠️ WebSocket not ready, message not sent:', {
        readyState: this.ws?.readyState,
        message
      })
    }
  }

  private isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  onPresence(callback: (message: RedisPresenceMessage) => void): void {
    this.onPresenceCallback = callback
  }

  onSignaling(callback: (message: RedisSignalingMessage) => void): void {
    this.onSignalingCallback = callback
  }

  onConnection(callback: (connected: boolean) => void): void {
    this.onConnectionCallback = callback
  }

  destroy(): void {
    console.log('🧹 Destroying RedisManager...')
    
    // Mark as intentionally closed to prevent reconnection
    this.isIntentionallyClosed = true

    // Stop heartbeat
    this.stopHeartbeat()

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // Close WebSocket
    if (this.ws) {
      try {
        // Remove event listeners to prevent callbacks
        this.ws.onopen = null
        this.ws.onclose = null
        this.ws.onerror = null
        this.ws.onmessage = null
        
        this.ws.close(1000, 'Client disconnecting')
      } catch (error) {
        console.error('Error closing WebSocket:', error)
      }
      this.ws = null
    }

    // Clear callbacks
    this.onPresenceCallback = undefined
    this.onSignalingCallback = undefined
    this.onConnectionCallback = undefined

    console.log('✅ RedisManager destroyed')
  }
}