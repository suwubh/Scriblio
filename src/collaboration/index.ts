// Providers
export { CollaborationProvider, useCollaborationContext } from './providers/CollaborationProvider'
export { PresenceProvider, usePresenceContext } from './providers/PresenceProvider'

// Hooks
export { useCollaboration } from './hooks/useCollaboration'
export { usePresence } from './hooks/usePresence'
export { useCanvasSync } from './hooks/useCanvasSync'
export { useYjsHistory } from './hooks/useYjsHistory'

// Managers
export { YjsDocumentManager, LOCAL_ORIGIN } from './managers/YjsDocumentManager'
export { AwarenessManager } from './managers/AwarenessManager'

// Types
export * from './types/collaboration.types'
export * from './types/presence.types'

// Utils
export { generateUserId, generateUserColor } from './utils/connection-helpers'
