import { Awareness } from 'y-protocols/awareness'
import { UserPresence } from '../types/presence.types'

export class AwarenessManager {
  private awareness: Awareness
  private localUserId: string
  private onChangeCallback?: (users: Map<string, UserPresence>) => void

  constructor(awareness: Awareness, localUserId: string) {
    this.awareness = awareness
    this.localUserId = localUserId
    this.setupAwarenessListeners()
  }

  private setupAwarenessListeners(): void {
    this.awareness.on('change', () => {
      this.handleAwarenessChange()
    })
  }

  private handleAwarenessChange(): void {
    const states = this.awareness.getStates()
    const users = new Map<string, UserPresence>()

    states.forEach((state, clientId) => {
      if (state.user && clientId !== this.awareness.clientID) {
        users.set(clientId.toString(), state.user)
      }
    })

    this.onChangeCallback?.(users)
  }

  setLocalPresence(presence: Partial<UserPresence>): void {
    const currentState = this.awareness.getLocalState()
    const currentUser = currentState?.user || {}

    this.awareness.setLocalStateField('user', {
      ...currentUser,
      ...presence,
      userId: this.localUserId,
      timestamp: Date.now(),
      isActive: true,
    })
  }

  updateCursor(x: number, y: number): void {
    this.setLocalPresence({ cursor: { x, y } })
  }

  updateSelection(elementIds: string[]): void {
    this.setLocalPresence({ selection: elementIds })
  }

  updateViewport(x: number, y: number, zoom: number): void {
    this.setLocalPresence({ viewport: { x, y, zoom } })
  }

  setUserActive(active: boolean): void {
    this.setLocalPresence({ isActive: active })
  }

  getRemoteUsers(): Map<string, UserPresence> {
    const states = this.awareness.getStates()
    const users = new Map<string, UserPresence>()

    states.forEach((state, clientId) => {
      if (state.user && clientId !== this.awareness.clientID) {
        users.set(clientId.toString(), state.user)
      }
    })

    return users
  }

  onChange(callback: (users: Map<string, UserPresence>) => void): void {
    this.onChangeCallback = callback
  }

  destroy(): void {
    this.awareness.off('change', this.handleAwarenessChange)
  }
}
