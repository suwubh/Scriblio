import { useCollaborationContext } from '../providers/CollaborationProvider'

export const useCollaboration = () => {
  const context = useCollaborationContext()
  const hasRedisSync = context.redisManager !== null
  const transportConnected =
    context.connectionStatus.webrtc === 'connected' ||
    context.connectionStatus.websocket === 'connected'
  // Drawings sync over the Yjs transports (WebRTC / WebSocket). Treat the room
  // as connected when either transport is up, or when Redis presence is synced.
  const isConnected = transportConnected || (hasRedisSync && context.connectionStatus.synced)
  
  return {
    documentManager: context.documentManager,
    webrtcProvider: context.webrtcProvider,
    websocketProvider: context.websocketProvider,
    webrtcManager: context.webrtcManager,
    connectionStatus: context.connectionStatus,
    isConnected,
    config: context.config,
  }
}
