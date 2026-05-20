
export interface RedisPresenceMessage {
  type: 'join' | 'leave' | 'update'
  userId: string
  roomId: string
  presence?: unknown
  timestamp: number
}

interface RoomPresenceState {
  roomId: string
  userId: string
  presence: unknown
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
  private activeSubscriptions: Set<string> = new Set()
  private currentRoomPresence: RoomPresenceState | null = null
  
  private onPresenceCallback?: (message: RedisPresenceMessage) => void
  private onConnectionCallback?: (connected: boolean) => void

  constructor(private redisWsUrl: string) {
    this.connect()
  }

  private connect(): void {
    if (this.isConnecting || this.isIntentionallyClosed) return

    this.isConnecting = true

    try {
      this.ws = new WebSocket(this.redisWsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.isConnecting = false
      this.handleReconnect()
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.onConnectionCallback?.(true)

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      this.startHeartbeat()
      this.restoreSessionState()
    }

    this.ws.onclose = () => {
      this.isConnecting = false
      this.stopHeartbeat()
      this.onConnectionCallback?.(false)

      if (!this.isIntentionallyClosed) {
        this.handleReconnect()
      }
    }

    this.ws.onerror = () => {
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

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }))
        } catch {
          // ignore failed heartbeat, onclose will trigger reconnect
        }
      }

      if (Date.now() - this.lastHeartbeat > 45000) {
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

      if (message.type === 'pong') {
        this.lastHeartbeat = Date.now()
        return
      }

      if (message.channel?.startsWith('presence:')) {
        this.onPresenceCallback?.(message.data)
      }
    } catch {
      // malformed message — ignore
    }
  }

  private handleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.isIntentionallyClosed) return

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onConnectionCallback?.(false)
      return
    }

    this.reconnectAttempts++

    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    )

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect()
    }, delay)
  }

  private reconnect(): void {
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore
      }
      this.ws = null
    }

    this.isConnecting = false
    this.reconnectAttempts = 0
    this.connect()
  }

  private restoreSessionState(): void {
    if (!this.isConnected()) return

    this.activeSubscriptions.forEach((channel) => {
      this.send(
        {
          type: 'subscribe',
          channel,
        },
        true
      )
    })

    if (this.currentRoomPresence) {
      this.publishPresence({
        type: 'join',
        userId: this.currentRoomPresence.userId,
        roomId: this.currentRoomPresence.roomId,
        presence: this.currentRoomPresence.presence,
        timestamp: Date.now(),
      })
    }
  }

  subscribeToPresence(roomId: string): void {
    const channel = `presence:${roomId}`
    this.activeSubscriptions.add(channel)

    this.send({
      type: 'subscribe',
      channel
    }, true)
  }

  publishPresence(message: RedisPresenceMessage): void {
    this.send({
      type: 'publish',
      channel: `presence:${message.roomId}`,
      data: message
    })
  }

  joinRoom(roomId: string, userId: string, userPresence: unknown): void {
    this.currentRoomPresence = {
      roomId,
      userId,
      presence: userPresence
    }

    if (!this.isConnected()) {
      return
    }

    const message: RedisPresenceMessage = {
      type: 'join',
      userId,
      roomId,
      presence: userPresence,
      timestamp: Date.now()
    }
    this.publishPresence(message)
  }

  leaveRoom(roomId: string, userId: string): void {
    if (
      this.currentRoomPresence &&
      this.currentRoomPresence.roomId === roomId &&
      this.currentRoomPresence.userId === userId
    ) {
      this.currentRoomPresence = null
    }

    this.activeSubscriptions.delete(`presence:${roomId}`)
    this.activeSubscriptions.delete(`signaling:${roomId}`)

    if (!this.isConnected()) {
      return
    }

    const message: RedisPresenceMessage = {
      type: 'leave',
      userId,
      roomId,
      timestamp: Date.now()
    }
    this.publishPresence(message)
  }

  updatePresence(roomId: string, userId: string, presence: unknown): void {
    if (
      this.currentRoomPresence &&
      this.currentRoomPresence.roomId === roomId &&
      this.currentRoomPresence.userId === userId
    ) {
      this.currentRoomPresence = {
        ...this.currentRoomPresence,
        presence,
      }
    }

    if (!this.isConnected()) {
      return
    }

    const message: RedisPresenceMessage = {
      type: 'update',
      userId,
      roomId,
      presence,
      timestamp: Date.now()
    }
    this.publishPresence(message)
  }

  private send(message: unknown, silent: boolean = false): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch {
        // ignore send failures — connection drop will trigger reconnect
      }
    } else if (!silent) {
      console.warn('WebSocket not ready, message dropped')
    }
  }

  private isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  onPresence(callback: (message: RedisPresenceMessage) => void): void {
    this.onPresenceCallback = callback
  }

  onConnection(callback: (connected: boolean) => void): void {
    this.onConnectionCallback = callback
  }

  destroy(): void {
    this.isIntentionallyClosed = true
    this.stopHeartbeat()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      try {
        this.ws.onopen = null
        this.ws.onclose = null
        this.ws.onerror = null
        this.ws.onmessage = null
        this.ws.close(1000, 'Client disconnecting')
      } catch {
        // ignore
      }
      this.ws = null
    }

    this.onPresenceCallback = undefined
    this.onConnectionCallback = undefined
    this.activeSubscriptions.clear()
    this.currentRoomPresence = null
  }
}
