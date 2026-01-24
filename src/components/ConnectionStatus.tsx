// src/components/ConnectionStatus.tsx (Enhanced)
import React from 'react'
import { useCollaboration, usePresence } from '../collaboration'
import { useCollaborationContext } from '../collaboration/providers/CollaborationProvider'

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useCollaboration()
  const { users } = usePresence()
  const { error, isReconnecting, reconnect } = useCollaborationContext()
  
  // Determine status color and icon
  const getStatusInfo = () => {
    if (error) {
      return { icon: '🔴', color: '#f44336', text: 'Error', bgColor: 'rgba(244, 67, 54, 0.1)' }
    }
    if (isReconnecting) {
      return { icon: '🟡', color: '#ff9800', text: 'Reconnecting...', bgColor: 'rgba(255, 152, 0, 0.1)' }
    }
    if (isConnected) {
      return { icon: '🟢', color: '#4CAF50', text: 'Connected', bgColor: 'rgba(76, 175, 80, 0.1)' }
    }
    return { icon: '🟡', color: '#ff9800', text: 'Connecting...', bgColor: 'rgba(255, 152, 0, 0.1)' }
  }

  const status = getStatusInfo()

  return (
    <div style={{ 
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: status.bgColor,
      border: `1px solid ${status.color}`,
      color: status.color,
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative',
    }}>
      <div>{status.icon}</div>
      <div style={{ fontWeight: 600 }}>{status.text}</div>
      
      {!error && (
        <>
          <div>•</div>
          <div>{users.length + 1} online</div>
        </>
      )}
      
      {/* User avatars */}
      {!error && users.length > 0 && (
        <div style={{ display: 'flex', marginLeft: '4px' }}>
          {users.slice(0, 3).map((user, index) => (
            <div
              key={user.userId}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: user.color,
                marginLeft: index > 0 ? '-6px' : '0',
                border: '2px solid white',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'white',
              }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 3 && (
            <div style={{ 
              fontSize: '10px', 
              marginLeft: '6px',
              fontWeight: 600,
            }}>
              +{users.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Error details and retry button */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{ 
            fontSize: '10px', 
            opacity: 0.8,
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {error.message}
          </div>
          <button
            onClick={reconnect}
            disabled={isReconnecting}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              background: status.color,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isReconnecting ? 'not-allowed' : 'pointer',
              opacity: isReconnecting ? 0.6 : 1,
              fontWeight: 600,
            }}
          >
            {isReconnecting ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  )
}