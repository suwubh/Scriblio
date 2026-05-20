import { describe, it, expect } from 'vitest'
import { generateRoomId, normalizeRoomId, ROOM_ALPHABET } from './room'

describe('normalizeRoomId', () => {
  it('uppercases and trims a plain code', () => {
    expect(normalizeRoomId('  abc123  ')).toBe('ABC123')
  })

  it('extracts the code from a pasted share URL', () => {
    expect(normalizeRoomId('http://localhost:5173/#ROOM42')).toBe('ROOM42')
  })

  it('strips characters that are not letters, digits or dashes', () => {
    expect(normalizeRoomId('ab c!@-12')).toBe('ABC-12')
  })

  it('returns an empty string when nothing valid remains', () => {
    expect(normalizeRoomId('   !!!   ')).toBe('')
  })
})

describe('generateRoomId', () => {
  it('produces a 6-character code', () => {
    expect(generateRoomId()).toHaveLength(6)
  })

  it('only uses characters from the readable alphabet', () => {
    for (let i = 0; i < 50; i++) {
      for (const ch of generateRoomId()) {
        expect(ROOM_ALPHABET).toContain(ch)
      }
    }
  })

  it('avoids easily-confused characters (0/O, 1/I/L)', () => {
    expect(ROOM_ALPHABET).not.toMatch(/[0O1IL]/)
  })
})
