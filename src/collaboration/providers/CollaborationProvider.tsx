import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  isReconnecting: boolean
  reconnect: () => void
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
  onError,
}) => {
  const documentManagerRef = useRef<YjsDocumentManager | null>(null)
  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const redisManagerRef = useRef<RedisManager | null>(null)

  const [webrtcProvider, setWebrtcProvider] = useState<WebrtcProvider | null>(null)
  const [websocketProvider, setWebsocketProvider] = useState<WebsocketProvider | null>(null)
  const [redisManager, setRedisManager] = useState<RedisManager | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    webrtc: 'disconnected',
    websocket: 'disconnected',
    synced: false,
  })

  const isInitializing = useRef(false)
  const hasInitialized = useRef(false)

  if (!documentManagerRef.current) {
    documentManagerRef.current = new YjsDocumentManager(config.roomId)
  }

  if (!webrtcManagerRef.current) {
    webrtcManagerRef.current = new WebRTCManager()
  }

  const documentManager = documentManagerRef.current
  const webrtcManager = webrtcManagerRef.current

  const reconnect = () => {
    setError(null)
    setIsReconnecting(true)
    hasInitialized.current = false
    isInitializing.current = false
    setRetryVersion((prev) => prev + 1)
  }

  useEffect(() => {
    if (hasInitialized.current || isInitializing.current) {
      return
    }

    isInitializing.current = true
    setIsReconnecting(true)
    setError(null)
    setWebrtcProvider(null)
    setWebsocketProvider(null)
    setRedisManager(null)
    setConnectionStatus({
      webrtc: 'connecting',
      websocket: 'connecting',
      synced: false,
    })

    let redisCleanup: (() => void) | undefined
    let webrtcCleanup: (() => void) | undefined
    let wsCleanup: (() => void) | undefined

    try {
      if (config.redisWsUrl) {
        const redis = new RedisManager(config.redisWsUrl)

        redis.subscribeToPresence(config.roomId)
        redis.subscribeToSignaling(config.roomId)

        redis.joinRoom(config.roomId, config.userId, {
          name: config.userName || 'Anonymous',
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          timestamp: Date.now(),
        })

        redis.onSignaling((message) => {
          if (message.to === config.userId) {
            console.log('Received signaling:', message)
          }
        })

        redis.onConnection((connected) => {
          setConnectionStatus((prev) => ({ ...prev, synced: connected }))
        })

        setRedisManager(redis)
        redisManagerRef.current = redis

        redisCleanup = () => {
          redis.leaveRoom(config.roomId, config.userId)
          redis.destroy()
        }
      }

      const webrtc = new WebrtcProvider(config.roomId, documentManager.doc, {
        signaling: config.signaling || ['wss://signaling.yjs.dev'],
        password: undefined,
        maxConns: 20,
        filterBcConns: true,
      })

      webrtc.on('status', (event: { connected: boolean }) => {
        setConnectionStatus((prev) => ({
          ...prev,
          webrtc: event.connected ? 'connected' : 'disconnected',
        }))
      })

      setWebrtcProvider(webrtc)
      webrtcCleanup = () => webrtc.destroy()

      const ws = new WebsocketProvider(
        config.websocketUrl || 'wss://demos.yjs.dev/ws',
        config.roomId,
        documentManager.doc,
        { connect: true }
      )

      ws.on('status', (event: { status: ConnectionStatus['websocket'] }) => {
        setConnectionStatus((prev) => ({
          ...prev,
          websocket: event.status,
        }))
      })

      setWebsocketProvider(ws)
      wsCleanup = () => ws.destroy()

      hasInitialized.current = true
      isInitializing.current = false
      setIsReconnecting(false)
    } catch (err) {
      const initError = err as Error
      setError(initError)
      onError?.(initError)
      isInitializing.current = false
      setIsReconnecting(false)
    }

    return () => {
      if (wsCleanup) wsCleanup()
      if (webrtcCleanup) webrtcCleanup()
      if (redisCleanup) redisCleanup()

      hasInitialized.current = false
      isInitializing.current = false
    }
  }, [config.roomId, config.userId, retryVersion])

  useEffect(() => {
    return () => {
      documentManager.destroy()
      webrtcManager.destroy()
      redisManagerRef.current?.destroy()
    }
  }, [documentManager, webrtcManager])

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

  return <CollaborationContext.Provider value={contextValue}>{children}</CollaborationContext.Provider>
}

export const useCollaborationContext = (): CollaborationContextType => {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error('useCollaborationContext must be used within CollaborationProvider')
  }
  return context
}
