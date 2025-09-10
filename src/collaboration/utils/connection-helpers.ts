export const generateUserId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const generateUserColor = (): string => {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 50%)`
}

export const isWebRTCSupported = (): boolean => {
  return typeof RTCPeerConnection !== 'undefined'
}

export const isWebSocketSupported = (): boolean => {
  return typeof WebSocket !== 'undefined'
}

export const getConnectionQuality = (rtt: number): 'excellent' | 'good' | 'poor' | 'bad' => {
  if (rtt < 50) return 'excellent'
  if (rtt < 150) return 'good'
  if (rtt < 300) return 'poor'
  return 'bad'
}

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }) as T
}
