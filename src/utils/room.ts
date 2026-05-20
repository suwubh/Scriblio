/** Readable code alphabet — no easily-confused characters (0/O, 1/I/L). */
export const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Generates a fresh 6-character room code. */
export function generateRoomId(): string {
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]
  }
  return id
}

/** Cleans a raw room id (handles pasted URLs, casing, stray characters). */
export function normalizeRoomId(raw: string): string {
  let value = raw.trim()
  if (value.includes('#')) value = value.split('#').pop() ?? ''
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}
