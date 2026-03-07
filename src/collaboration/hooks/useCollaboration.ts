import { useCollaborationContext } from '../providers/CollaborationProvider'

export const useCollaboration = () => {
  const context = useCollaborationContext()
  const hasRedisSync = context.redisManager !== null
  const transportConnected =
    context.connectionStatus.webrtc === 'connected' ||
    context.connectionStatus.websocket === 'connected'
  const isConnected = hasRedisSync ? context.connectionStatus.synced : transportConnected
  
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
