import { useCollaborationContext } from '../providers/CollaborationProvider'

export const useCollaboration = () => {
  const context = useCollaborationContext()
  
  return {
    documentManager: context.documentManager,
    webrtcProvider: context.webrtcProvider,
    websocketProvider: context.websocketProvider,
    webrtcManager: context.webrtcManager,
    connectionStatus: context.connectionStatus,
    isConnected: context.connectionStatus.synced,
    config: context.config,
  }
}
