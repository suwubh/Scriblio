import React from 'react'
import { useCollaboration, usePresence } from '../collaboration'

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useCollaboration()
  const { users } = usePresence()
  
  return (
    <div style={{ 
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: isConnected ? '#4CAF50' : '#f44336',
      color: 'white',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div>{isConnected ? '🟢' : '🔴'}</div>
      <div>{isConnected ? 'Connected' : 'Connecting...'}</div>
      <div>•</div>
      <div>{users.length + 1} online</div>
      {users.length > 0 && (
        <div style={{ display: 'flex', marginLeft: '4px' }}>
          {users.slice(0, 3).map((user, index) => (
            <div
              key={user.userId}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: user.color,
                marginLeft: index > 0 ? '-4px' : '0',
                border: '1px solid white',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={user.name}
            />
          ))}
          {users.length > 3 && (
            <div style={{ fontSize: '10px', marginLeft: '4px' }}>
              +{users.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
