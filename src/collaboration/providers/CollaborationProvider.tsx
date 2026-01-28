// src/collaboration/providers/CollaborationProvider.tsx
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
  error: Error | null
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

interface CollaborationProviderProps {
  children: React.ReactNode
  config: CollaborationConfig & {
    redisWsUrl?: string
    userId: string
  };
  onError?: (error: Error) => void
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
  const [error, setError] = useState<Error | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    webrtc: 'disconnected',
    websocket: 'disconnected',
    synced: false,
  })

  // 🔒 FIX: Track initialization state
  const isInitializing = useRef(false)
  const hasInitialized = useRef(false)

  // Initialize managers once
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

  // 🔒 FIX: Single initialization with race condition prevention
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current || isInitializing.current) {
      console.log('⏭️ Skipping initialization - already running or complete')
      return
    }

    isInitializing.current = true
    console.log('🔌 Initializing collaboration providers...')

    // Track cleanup functions
    let redisCleanup: (() => void) | undefined
    let webrtcCleanup: (() => void) | undefined
    let wsCleanup: (() => void) | undefined

    try {
      // Setup Redis Manager
      if (config.redisWsUrl) {
        const redis = new RedisManager(config.redisWsUrl)
        
        redis.subscribeToPresence(config.roomId)
        redis.subscribeToSignaling(config.roomId)
        
        redis.joinRoom(config.roomId, config.userId, {
          name: config.userName || 'Anonymous',
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          timestamp: Date.now()
        })

        redis.onSignaling((message) => {
          if (message.to === config.userId) {
            console.log('Received signaling:', message)
          }
        })

        redis.onConnection((connected) => {
          setConnectionStatus(prev => ({ ...prev, synced: connected }))
        })

        setRedisManager(redis)
        redisManagerRef.current = redis

        redisCleanup = () => {
          redis.leaveRoom(config.roomId, config.userId)
          redis.destroy()
        }
      }

      // Setup WebRTC Provider
      const webrtc = new WebrtcProvider(config.roomId, documentManager.doc, {
        signaling: config.signaling || ['wss://signaling.yjs.dev'],
        password: undefined,
        maxConns: 20,
        filterBcConns: true,
      })

      webrtc.on('status', (event: any) => {
        setConnectionStatus(prev => ({
          ...prev,
          webrtc: event.status,
        }))
      })

      setWebrtcProvider(webrtc)
      webrtcCleanup = () => webrtc.destroy()

      // Setup WebSocket Provider (fallback)
      const ws = new WebsocketProvider(
        config.websocketUrl || 'wss://demos.yjs.dev/ws',
        config.roomId,
        documentManager.doc,
        { connect: true }
      )

      ws.on('status', (event: any) => {
        setConnectionStatus(prev => ({
          ...prev,
          websocket: event.status,
        }))
      })

      setWebsocketProvider(ws)
      wsCleanup = () => ws.destroy()

      hasInitialized.current = true
      isInitializing.current = false
      console.log('✅ Collaboration providers initialized')

    } catch (err) {
      console.error('❌ Failed to initialize collaboration:', err)
      setError(err as Error)
      isInitializing.current = false
    }

    // 🔒 FIX: Comprehensive cleanup
    return () => {
      console.log('🧹 Cleaning up collaboration providers...')
      
      // Clean up in reverse order of initialization
      if (wsCleanup) wsCleanup()
      if (webrtcCleanup) webrtcCleanup()
      if (redisCleanup) redisCleanup()

      hasInitialized.current = false
      isInitializing.current = false
    }
  }, [config.roomId, config.userId]) // 🔒 FIX: Only reinitialize if room or user changes

  // 🔒 FIX: Separate cleanup for managers on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Final cleanup of managers...')
      documentManager.destroy()
      webrtcManager.destroy()
      redisManagerRef.current?.destroy()
    }
  }, []) // 🔒 Only on unmount

  // 🔒 FIX: Error state UI
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2>Collaboration Connection Failed</h2>
        <p style={{ color: '#666', maxWidth: '500px' }}>
          {error.message || 'Failed to connect to collaboration server'}
        </p>
        <button 
          onClick={() => {
            setError(null)
            hasInitialized.current = false
            isInitializing.current = false
          }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #646cff',
            background: '#646cff',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Retry Connection
        </button>
      </div>
    )
  }

  const contextValue: CollaborationContextType = {
    documentManager,
    webrtcProvider,
    websocketProvider,
    webrtcManager,
    redisManager,
    connectionStatus,
    config,
    error,
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