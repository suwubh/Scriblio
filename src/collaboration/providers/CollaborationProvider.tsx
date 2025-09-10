import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'
import { YjsDocumentManager } from '../managers/YjsDocumentManager'
import { WebRTCManager } from '../managers/WebRTCManager'
import { RedisManager } from '../managers/RedisManager'
import { CollaborationConfig, ConnectionStatus } from '../types/collaboration.types'

interface CollaborationContextType {
  documentManager: YjsDocumentManager
  webrtcProvider: WebrtcProvider | null
  websocketProvider: WebsocketProvider | null
  webrtcManager: WebRTCManager
  redisManager: RedisManager | null
  connectionStatus: ConnectionStatus
  config: CollaborationConfig
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

interface CollaborationProviderProps {
  children: React.ReactNode
  config: CollaborationConfig & {
    redisWsUrl?: string
    userId: string
  }
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ 
  children, 
  config 
}) => {
  const documentManagerRef = useRef<YjsDocumentManager | null>(null)
  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const redisManagerRef = useRef<RedisManager | null>(null)
  
  const [webrtcProvider, setWebrtcProvider] = useState<WebrtcProvider | null>(null)
  const [websocketProvider, setWebsocketProvider] = useState<WebsocketProvider | null>(null)
  const [redisManager, setRedisManager] = useState<RedisManager | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    webrtc: 'disconnected',
    websocket: 'disconnected',
    synced: false,
  })

  // Initialize managers
  if (!documentManagerRef.current) {
    documentManagerRef.current = new YjsDocumentManager(config.roomId)
  }
  
  if (!webrtcManagerRef.current) {
    webrtcManagerRef.current = new WebRTCManager()
  }

  if (!redisManagerRef.current && config.redisWsUrl) {
    redisManagerRef.current = new RedisManager(config.redisWsUrl)
  }

  const documentManager = documentManagerRef.current
  const webrtcManager = webrtcManagerRef.current

  useEffect(() => {
    // Setup Redis Manager
    if (config.redisWsUrl) {
      const redis = new RedisManager(config.redisWsUrl)
      
      // Subscribe to room channels
      redis.subscribeToPresence(config.roomId)
      redis.subscribeToSignaling(config.roomId)
      
      // Join room
      redis.joinRoom(config.roomId, config.userId, {
        name: config.userName || 'Anonymous',
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        timestamp: Date.now()
      })

      // Handle signaling for WebRTC
      redis.onSignaling((message) => {
        if (message.to === config.userId) {
          // Handle WebRTC signaling through Redis
          console.log('Received signaling:', message)
        }
      })

      redis.onConnection((connected) => {
        setConnectionStatus(prev => ({ ...prev, synced: connected }))
      })

      setRedisManager(redis)
      redisManagerRef.current = redis
    }

    // Setup WebRTC Provider with custom signaling
    const webrtcProvider = new WebrtcProvider(config.roomId, documentManager.doc, {
      signaling: config.signaling || ['wss://signaling.yjs.dev'],
      password: undefined,
      maxConns: 20,
      filterBcConns: true,
    })

    // Setup WebSocket Provider (fallback)
    const websocketProvider = new WebsocketProvider(
      config.websocketUrl || 'wss://demos.yjs.dev/ws',
      config.roomId,
      documentManager.doc,
      { connect: true }
    )

    // Connection status tracking
    webrtcProvider.on('status', (event: any) => {
      setConnectionStatus(prev => ({
        ...prev,
        webrtc: event.status,
      }))
    })

    websocketProvider.on('status', (event: any) => {
      setConnectionStatus(prev => ({
        ...prev,
        websocket: event.status,
      }))
    })

    setWebrtcProvider(webrtcProvider)
    setWebsocketProvider(websocketProvider)

    // Cleanup
    return () => {
      // Leave room in Redis
      if (redisManagerRef.current) {
        redisManagerRef.current.leaveRoom(config.roomId, config.userId)
        redisManagerRef.current.destroy()
      }
      
      webrtcProvider.destroy()
      websocketProvider.destroy()
    }
  }, [config.roomId, config.userId, config.redisWsUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      documentManager.destroy()
      webrtcManager.destroy()
      redisManagerRef.current?.destroy()
    }
  }, [])

  const contextValue: CollaborationContextType = {
    documentManager,
    webrtcProvider,
    websocketProvider,
    webrtcManager,
    redisManager,
    connectionStatus,
    config,
  }

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  )
}

export const useCollaborationContext = (): CollaborationContextType => {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error('useCollaborationContext must be used within CollaborationProvider')
  }
  return context
}
