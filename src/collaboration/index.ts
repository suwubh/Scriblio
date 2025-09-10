// Providers
export { CollaborationProvider, useCollaborationContext } from './providers/CollaborationProvider'
export { PresenceProvider, usePresenceContext } from './providers/PresenceProvider'

// Hooks
export { useCollaboration } from './hooks/useCollaboration'
export { usePresence } from './hooks/usePresence'
export { useSharedCanvas } from './hooks/useSharedCanvas'

// Managers
export { YjsDocumentManager } from './managers/YjsDocumentManager'
export { WebRTCManager } from './managers/WebRTCManager'
export { AwarenessManager } from './managers/AwarenessManager'

// Types
export * from './types/collaboration.types'
export * from './types/presence.types'

// Utils
export * from './utils/crdt-helpers'
export * from './utils/connection-helpers'
