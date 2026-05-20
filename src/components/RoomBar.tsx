import React, { useState } from 'react'
import { useCollaboration, usePresence } from '../collaboration'
import { useCollaborationContext } from '../collaboration/providers/CollaborationProvider'

interface RoomBarProps {
  roomId: string
  onLeave: () => void
}

type CopyKind = 'code' | 'link' | null

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="11" height="11" rx="2.4" />
    <path d="M5 15.5A2.5 2.5 0 0 1 3.5 13V5A2.5 2.5 0 0 1 6 2.5h7A2.5 2.5 0 0 1 15 4" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 10 17.5 19.5 6.5" />
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" />
    <path d="M16 5.1a3.2 3.2 0 0 1 0 6.2M17.4 19a5.2 5.2 0 0 0-2.7-4.6" />
  </svg>
)

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="5.5" r="2.6" />
    <circle cx="18" cy="18.5" r="2.6" />
    <path d="M8.3 10.7 15.7 6.8M8.3 13.3l7.4 3.9" />
  </svg>
)

const LeaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2H14" />
    <path d="M10 12h10M16.5 7.5 21 12l-4.5 4.5" />
  </svg>
)

export const RoomBar: React.FC<RoomBarProps> = ({ roomId, onLeave }) => {
  const { isConnected } = useCollaboration()
  const { users } = usePresence()
  const { error, isReconnecting, reconnect } = useCollaborationContext()
  const [copied, setCopied] = useState<CopyKind>(null)

  const status: 'connected' | 'connecting' | 'error' = error
    ? 'error'
    : isReconnecting || !isConnected
      ? 'connecting'
      : 'connected'

  const statusText =
    status === 'error'
      ? `Connection problem: ${error?.message ?? 'unknown error'}`
      : status === 'connecting'
        ? 'Connecting to the room…'
        : 'Connected — changes sync live'

  const onlineCount = users.length + 1

  const writeClipboard = async (text: string, kind: Exclude<CopyKind, null>) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const shareLink = `${window.location.origin}${window.location.pathname}#${roomId}`

  return (
    <div className="room-bar">
      <span
        className={`room-bar-status room-bar-status-${status}`}
        title={statusText}
        role="img"
        aria-label={statusText}
      />

      <button
        type="button"
        className="room-bar-code"
        onClick={() => writeClipboard(roomId, 'code')}
        title="Copy room code"
      >
        <span className="room-bar-code-key">Room</span>
        <span className="room-bar-code-val">{roomId}</span>
        <span className="room-bar-code-icon">
          {copied === 'code' ? <CheckIcon /> : <CopyIcon />}
        </span>
      </button>

      <span className="room-bar-online" title={`${onlineCount} ${onlineCount === 1 ? 'person' : 'people'} in this room`}>
        <UsersIcon />
        <span className="room-bar-online-count">{onlineCount}</span>
      </span>

      {status === 'error' ? (
        <button
          type="button"
          className="room-bar-btn"
          onClick={reconnect}
          disabled={isReconnecting}
        >
          {isReconnecting ? 'Retrying…' : 'Retry'}
        </button>
      ) : (
        <button
          type="button"
          className="room-bar-btn"
          onClick={() => writeClipboard(shareLink, 'link')}
          title="Copy a shareable invite link"
        >
          <span className="room-bar-btn-icon">
            {copied === 'link' ? <CheckIcon /> : <ShareIcon />}
          </span>
          {copied === 'link' ? 'Copied!' : 'Share'}
        </button>
      )}

      <button
        type="button"
        className="room-bar-btn room-bar-btn-leave"
        onClick={onLeave}
        title="Leave this room"
      >
        <span className="room-bar-btn-icon"><LeaveIcon /></span>
        Leave
      </button>
    </div>
  )
}
