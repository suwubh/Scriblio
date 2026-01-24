// src/collaboration/providers/CollaborationProvider.tsx (Enhanced)
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'
import { YjsDocumentManager } from '../managers/YjsDocumentManager'
import { WebRTCManager } from '../managers/WebRTCManager'
import { RedisManager } from '../managers/RedisManager'
import { CollaborationConfig, ConnectionStatus } from '../types/collaboration.types'
import { withRetry, ConnectionError } from '../utils/retry-helper'

interface CollaborationContextType {
  documentManager: YjsDocumentManager
  webrtcProvider: WebrtcProvider | null
  websocketProvider: WebsocketProvider | null
  webrtcManager: WebRTCManager
  redisManager: RedisManager | null
  connectionStatus: ConnectionStatus
  config: CollaborationConfig
  error: Error | null
  isReconnecting: boolean
  reconnect: () => Promise<void>
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

interface CollaborationProviderProps {
  children: React.ReactNode
  config: CollaborationConfig & {
    redisWsUrl?: string
    userId: string
  }
  onError?: (error: Error) => void
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ 
  children, 
  config,
  onError
}) => {
  const documentManagerRef = useRef<YjsDocumentManager | null>(null)
  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const redisManagerRef = useRef<RedisManager | null>(null)
  
  const [webrtcProvider, setWebrtcProvider] = useState<WebrtcProvider | null>(null)
  const [websocketProvider, setWebsocketProvider] = useState<WebsocketProvider | null>(null)
  const [redisManager, setRedisManager] = useState<RedisManager | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    webrtc: 'disconnected',
    websocket: 'disconnected',
    synced: false,
  })

  // Initialize managers with error handling
  if (!documentManagerRef.current) {
    try {
      documentManagerRef.current = new YjsDocumentManager(config.roomId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize document manager')
      console.error('Document manager initialization failed:', error)
      setError(error)
      onError?.(error)
    }
  }
  
  if (!webrtcManagerRef.current) {
    try {
      webrtcManagerRef.current = new WebRTCManager()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize WebRTC manager')
      console.error('WebRTC manager initialization failed:', error)
      setError(error)
      onError?.(error)
    }
  }

  const documentManager = documentManagerRef.current!
  const webrtcManager = webrtcManagerRef.current!

  // Setup providers with retry logic
  const setupProviders = useCallback(async () => {
    if (!documentManager) return

    setIsReconnecting(true)
    setError(null)

    try {
      // Setup Redis with retry
      if (config.redisWsUrl) {
        const redis = await withRetry(
          async () => {
            const manager = new RedisManager(config.redisWsUrl!)
            
            // Wait for connection with timeout
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new ConnectionError('Redis connection timeout'))
              }, 10000)

              manager.onConnection((connected) => {
                if (connected) {
                  clearTimeout(timeout)
                  resolve()
                }
              })
            })

            return manager
          },
          {
            maxAttempts: 3,
            delayMs: 2000,
            onRetry: (attempt, err) => {
              console.log(`Redis retry attempt ${attempt}:`, err.message)
            }
          }
        )

        // Subscribe to channels
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
      }

      // Setup WebRTC Provider
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

      // Error handling via status events
      webrtcProvider.on('status', (event: any) => {
        if (event.status === 'disconnected') {
          const error = new ConnectionError('WebRTC connection failed')
          console.error('WebRTC disconnected:', event)
          setError(error)
          onError?.(error)
        }
      })

      websocketProvider.on('status', (event: any) => {
        if (event.status === 'disconnected') {
          const error = new ConnectionError('WebSocket connection failed')
          console.error('WebSocket disconnected:', event)
          setError(error)
          onError?.(error)
        }
      })

      setWebrtcProvider(webrtcProvider)
      setWebsocketProvider(websocketProvider)

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Provider setup failed')
      console.error('Provider setup error:', error)
      setError(error)
      onError?.(error)
    } finally {
      setIsReconnecting(false)
    }
  }, [config, documentManager, onError])

  // Reconnect function
  const reconnect = useCallback(async () => {
    console.log('Attempting to reconnect...')
    
    // Cleanup existing connections
    if (redisManagerRef.current) {
      redisManagerRef.current.destroy()
      redisManagerRef.current = null
      setRedisManager(null)
    }
    
    webrtcProvider?.destroy()
    websocketProvider?.destroy()
    setWebrtcProvider(null)
    setWebsocketProvider(null)

    // Reinitialize
    await setupProviders()
  }, [setupProviders, webrtcProvider, websocketProvider])

  // Initial setup
  useEffect(() => {
    setupProviders()

    return () => {
      if (redisManagerRef.current) {
        redisManagerRef.current.leaveRoom(config.roomId, config.userId)
        redisManagerRef.current.destroy()
      }
      
      webrtcProvider?.destroy()
      websocketProvider?.destroy()
    }
  }, [config.roomId, config.userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      documentManager?.destroy()
      webrtcManager?.destroy()
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
    error,
    isReconnecting,
    reconnect,
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