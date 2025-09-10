export interface UserPresence {
  userId: string
  name: string
  color: string
  cursor?: { x: number; y: number }
  selection?: string[]
  viewport?: { x: number; y: number; zoom: number }
  timestamp: number
  isActive: boolean
}

export interface CursorPosition {
  x: number
  y: number
  userId: string
}

export interface PresenceState {
  users: Map<string, UserPresence>
  localUser: UserPresence | null
}
