export interface CollaborationConfig {
  roomId: string
  userId?: string
  userName?: string
  signaling?: string[]
  websocketUrl?: string
}

export interface ConnectionStatus {
  webrtc: 'connecting' | 'connected' | 'disconnected' | 'failed'
  websocket: 'connecting' | 'connected' | 'disconnected' | 'failed'
  synced: boolean
}
