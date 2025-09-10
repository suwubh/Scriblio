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
  private onPresenceCallback?: (message: RedisPresenceMessage) => void
  private onSignalingCallback?: (message: RedisSignalingMessage) => void
  private onConnectionCallback?: (connected: boolean) => void

  constructor(private redisWsUrl: string) {
    this.connect()
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.redisWsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to connect to Redis WebSocket:', error)
      this.handleReconnect()
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('Connected to Redis WebSocket')
      this.reconnectAttempts = 0
      this.onConnectionCallback?.(true)
    }

    this.ws.onclose = () => {
      console.log('Redis WebSocket connection closed')
      this.onConnectionCallback?.(false)
      this.handleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('Redis WebSocket error:', error)
      this.onConnectionCallback?.(false)
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      
      if (message.channel?.startsWith('presence:')) {
        this.onPresenceCallback?.(message.data)
      } else if (message.channel?.startsWith('signaling:')) {
        this.onSignalingCallback?.(message.data)
      }
    } catch (error) {
      console.error('Failed to parse Redis message:', error)
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect()
    }, this.reconnectInterval)
  }

  // Subscribe to presence updates for a room
  subscribeToPresence(roomId: string): void {
    this.send({
      type: 'subscribe',
      channel: `presence:${roomId}`
    })
  }

  // Subscribe to signaling for WebRTC coordination
  subscribeToSignaling(roomId: string): void {
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
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not ready, message not sent:', message)
    }
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
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
