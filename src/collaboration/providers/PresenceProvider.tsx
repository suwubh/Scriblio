import React, { createContext, useContext, useEffect, useState } from 'react'
import { AwarenessManager } from '../managers/AwarenessManager'
import { UserPresence, PresenceState } from '../types/presence.types'
import { useCollaborationContext } from './CollaborationProvider'

interface PresenceContextType {
  presenceState: PresenceState
  awarenessManager: AwarenessManager | null
  updateCursor: (x: number, y: number) => void
  updateSelection: (elementIds: string[]) => void
  updateViewport: (x: number, y: number, zoom: number) => void
  setUserActive: (active: boolean) => void
}

const PresenceContext = createContext<PresenceContextType | null>(null)

interface PresenceProviderProps {
  children: React.ReactNode
  userId: string
  userName: string
  userColor?: string
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({
  children,
  userId,
  userName,
  userColor,
}) => {
  const { webrtcProvider } = useCollaborationContext()
  const [awarenessManager, setAwarenessManager] = useState<AwarenessManager | null>(null)
  const [presenceState, setPresenceState] = useState<PresenceState>({
    users: new Map(),
    localUser: null,
  })

  useEffect(() => {
    if (!webrtcProvider?.awareness) return

    const manager = new AwarenessManager(webrtcProvider.awareness, userId)
    
    // Set initial local presence
    const localUser: UserPresence = {
      userId,
      name: userName,
      color: userColor || `hsl(${Math.random() * 360}, 70%, 50%)`,
      timestamp: Date.now(),
      isActive: true,
    }

    manager.setLocalPresence(localUser)
    
    setPresenceState(prev => ({ ...prev, localUser }))
    setAwarenessManager(manager)

    // Listen for remote user changes
    manager.onChange((remoteUsers) => {
      setPresenceState(prev => ({
        ...prev,
        users: remoteUsers,
      }))
    })

    return () => {
      manager.destroy()
    }
  }, [webrtcProvider, userId, userName, userColor])

  const updateCursor = (x: number, y: number) => {
    awarenessManager?.updateCursor(x, y)
  }

  const updateSelection = (elementIds: string[]) => {
    awarenessManager?.updateSelection(elementIds)
  }

  const updateViewport = (x: number, y: number, zoom: number) => {
    awarenessManager?.updateViewport(x, y, zoom)
  }

  const setUserActive = (active: boolean) => {
    awarenessManager?.setUserActive(active)
  }

  const contextValue: PresenceContextType = {
    presenceState,
    awarenessManager,
    updateCursor,
    updateSelection,
    updateViewport,
    setUserActive,
  }

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  )
}

export const usePresenceContext = (): PresenceContextType => {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresenceContext must be used within PresenceProvider')
  }
  return context
}
