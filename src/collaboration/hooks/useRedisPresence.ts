import { useEffect, useState } from 'react'
import { useCollaborationContext } from '../providers/CollaborationProvider'
import { RedisPresenceMessage } from '../managers/RedisManager'

interface RedisPresenceState {
  onlineUsers: Map<string, any>
  isConnected: boolean
}

export const useRedisPresence = () => {
  const { redisManager, config } = useCollaborationContext()
  const [presenceState, setPresenceState] = useState<RedisPresenceState>({
    onlineUsers: new Map(),
    isConnected: false
  })

  useEffect(() => {
    if (!redisManager) return

    redisManager.onPresence((message: RedisPresenceMessage) => {
      setPresenceState(prev => {
        const newUsers = new Map(prev.onlineUsers)
        
        switch (message.type) {
          case 'join':
          case 'update':
            newUsers.set(message.userId, {
              ...message.presence,
              userId: message.userId,
              lastSeen: message.timestamp
            })
            break
          case 'leave':
            newUsers.delete(message.userId)
            break
        }
        
        return {
          ...prev,
          onlineUsers: newUsers
        }
      })
    })

    redisManager.onConnection((connected) => {
      setPresenceState(prev => ({ ...prev, isConnected: connected }))
    })

  }, [redisManager])

  const updateMyPresence = (presence: any) => {
    if (redisManager && config.roomId && config.userId) {
      redisManager.updatePresence(config.roomId, config.userId, presence)
    }
  }

  return {
    onlineUsers: Array.from(presenceState.onlineUsers.values()),
    isConnected: presenceState.isConnected,
    updateMyPresence
  }
}
