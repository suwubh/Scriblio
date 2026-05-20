import React, { useState } from 'react'

interface RoomLandingProps {
  defaultName: string
  onEnter: (roomId: string, name: string) => void
}

/** Readable code alphabet — no easily-confused characters (0/O, 1/I/L). */
const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateRoomId(): string {
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]
  }
  return id
}

const BRAND: { ch: string; color: string }[] = [
  { ch: 'S', color: '#ff5252' },
  { ch: 'c', color: '#ffca28' },
  { ch: 'r', color: '#4caf50' },
  { ch: 'i', color: '#29b6f6' },
  { ch: 'b', color: '#ab47bc' },
  { ch: 'l', color: '#ff9800' },
  { ch: 'i', color: '#ec407a' },
  { ch: 'o', color: '#66bb6a' },
]

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const UsersGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.4" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 19.5a5.5 5.5 0 0 0-3-4.9" />
  </svg>
)

export const RoomLanding: React.FC<RoomLandingProps> = ({ defaultName, onEnter }) => {
  const [name, setName] = useState(defaultName)
  const [joinCode, setJoinCode] = useState('')

  const handleCreate = () => onEnter(generateRoomId(), name)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    onEnter(joinCode, name)
  }

  return (
    <div className="room-landing">
      <div className="room-landing-glow" aria-hidden="true" />

      <div className="room-landing-card">
        <header className="room-landing-head">
          <div className="room-landing-logo" aria-label="Scriblio">
            {BRAND.map((b, i) => (
              <span key={i} style={{ color: b.color }} aria-hidden="true">
                {b.ch}
              </span>
            ))}
          </div>
          <p className="room-landing-tagline">
            <span className="room-landing-live" aria-hidden="true">
              <UsersGlyph />
            </span>
            A collaborative whiteboard — draw together, in real time.
          </p>
        </header>

        <label className="room-field">
          <span className="room-field-label">Your name</span>
          <input
            className="room-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={32}
            aria-label="Your display name"
          />
        </label>

        <div className="room-actions">
          <section className="room-action">
            <div className="room-action-text">
              <h2>Create a room</h2>
              <p>Start a fresh canvas, then share the code to invite others.</p>
            </div>
            <button
              type="button"
              className="room-btn room-btn-primary"
              onClick={handleCreate}
            >
              <span className="room-btn-icon"><PlusIcon /></span>
              Create a room
            </button>
          </section>

          <div className="room-or" aria-hidden="true">
            <span>or</span>
          </div>

          <form className="room-action" onSubmit={handleJoin}>
            <div className="room-action-text">
              <h2>Join a room</h2>
              <p>Enter a room code someone shared with you.</p>
            </div>
            <div className="room-join-row">
              <input
                className="room-input room-code-input"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                spellCheck={false}
                autoCapitalize="characters"
                autoCorrect="off"
                maxLength={16}
                aria-label="Room code"
              />
              <button type="submit" className="room-btn" disabled={!joinCode.trim()}>
                Join
                <span className="room-btn-icon"><ArrowIcon /></span>
              </button>
            </div>
          </form>
        </div>

        <p className="room-landing-foot">
          Anyone with the room code can draw on the same canvas with you.
        </p>
      </div>
    </div>
  )
}
