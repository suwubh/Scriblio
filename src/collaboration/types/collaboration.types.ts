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

export interface DrawingStroke {
  id: string
  points: { x: number; y: number }[]
  color: string
  width: number
  timestamp: number
  userId: string
}

export interface CanvasElement {
  id: string
  type: 'stroke' | 'shape' | 'text' | 'image'
  data: any
  position: { x: number; y: number }
  userId: string
  timestamp: number
}
