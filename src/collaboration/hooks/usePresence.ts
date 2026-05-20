import { usePresenceContext } from '../providers/PresenceProvider'

export const usePresence = () => {
  const context = usePresenceContext()
  
  return {
    users: Array.from(context.presenceState.users.values()),
    localUser: context.presenceState.localUser,
    updateCursor: context.updateCursor,
    awarenessManager: context.awarenessManager,
  }
}
