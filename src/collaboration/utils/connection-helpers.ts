/** Stable per-browser-session id used to identify this client in a room. */
export const generateUserId = (): string => {
  return `user-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
}

/** Random pastel-ish colour for cursors and avatars. */
export const generateUserColor = (): string => {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 50%)`
}
