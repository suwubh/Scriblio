export interface WebRTCMessage {
  type: 'cursor' | 'selection' | 'viewport' | 'custom'
  data: any
  userId: string
  timestamp: number
}

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private dataChannels: Map<string, RTCDataChannel> = new Map()
  private onMessageCallback?: (message: WebRTCMessage, fromUserId: string) => void
  private onConnectionChangeCallback?: (userId: string, connected: boolean) => void

  constructor() {
    this.setupPeerConnection = this.setupPeerConnection.bind(this)
  }

  private setupPeerConnection(userId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    })

    // Create data channel
    const dataChannel = pc.createDataChannel(`scriblio-${userId}`, {
      ordered: true,
      maxRetransmits: 3,
    })

    this.setupDataChannel(dataChannel, userId)
    this.dataChannels.set(userId, dataChannel)

    // Handle incoming data channels
    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, userId)
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const connected = pc.connectionState === 'connected'
      this.onConnectionChangeCallback?.(userId, connected)
    }

    this.peerConnections.set(userId, pc)
    return pc
  }

  private setupDataChannel(dataChannel: RTCDataChannel, userId: string) {
    dataChannel.onopen = () => {
      console.log(`Data channel opened for user: ${userId}`)
      this.onConnectionChangeCallback?.(userId, true)
    }

    dataChannel.onmessage = (event) => {
      try {
        const message: WebRTCMessage = JSON.parse(event.data)
        this.onMessageCallback?.(message, userId)
      } catch (error) {
        console.error('Failed to parse WebRTC message:', error)
      }
    }

    dataChannel.onclose = () => {
      console.log(`Data channel closed for user: ${userId}`)
      this.onConnectionChangeCallback?.(userId, false)
    }

    dataChannel.onerror = (error) => {
      console.error(`Data channel error for user ${userId}:`, error)
    }
  }

  sendMessage(message: WebRTCMessage, targetUserId?: string): void {
    const messageStr = JSON.stringify(message)

    if (targetUserId) {
      // Send to specific user
      const dataChannel = this.dataChannels.get(targetUserId)
      if (dataChannel?.readyState === 'open') {
        dataChannel.send(messageStr)
      }
    } else {
      // Broadcast to all connected users
      this.dataChannels.forEach((dataChannel, _userId) => {
        if (dataChannel.readyState === 'open') {
          dataChannel.send(messageStr)
        }
      })
    }
  }

  onMessage(callback: (message: WebRTCMessage, fromUserId: string) => void): void {
    this.onMessageCallback = callback
  }

  onConnectionChange(callback: (userId: string, connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback
  }

  addPeer(userId: string): RTCPeerConnection {
    return this.setupPeerConnection(userId)
  }

  removePeer(userId: string): void {
    const pc = this.peerConnections.get(userId)
    const dc = this.dataChannels.get(userId)

    if (dc) {
      dc.close()
      this.dataChannels.delete(userId)
    }

    if (pc) {
      pc.close()
      this.peerConnections.delete(userId)
    }
  }

  destroy(): void {
    this.dataChannels.forEach(dc => dc.close())
    this.peerConnections.forEach(pc => pc.close())
    this.dataChannels.clear()
    this.peerConnections.clear()
  }
}
