export const KEY_TRAIL_TTL_MS = 2200
export const KEY_TRAIL_MAX = 8

export type KeyTrailEntry = {
  id: number
  label: string
  createdAt: number
}

export function formatKeyLabel(key: string): string {
  if (key === ' ') return '␣'
  if (key === 'Escape') return 'esc'
  if (key === 'Enter') return '↵'
  if (key === 'Tab') return '⇥'
  if (key === 'Backspace') return '⌫'
  if (key === 'Meta' || key === 'OS' || key === 'Super') return '⌘'
  if (key === 'Alt') return 'alt'
  if (key === 'Control') return 'ctrl'
  if (key === 'ArrowUp') return 'up'
  if (key === 'ArrowDown') return 'down'
  if (key === 'ArrowLeft') return 'left'
  if (key === 'ArrowRight') return 'right'
  if (key.startsWith('Browser')) return key.slice(7).toLowerCase() || 'nav'
  if (key.length === 1) return key
  return key.length > 10 ? key.slice(0, 10) : key
}

export function pushKeyTrail(
  entries: KeyTrailEntry[],
  key: string,
  now: number,
  nextId: number,
): { entries: KeyTrailEntry[]; nextId: number } {
  const entry: KeyTrailEntry = {
    id: nextId,
    label: formatKeyLabel(key),
    createdAt: now,
  }
  return {
    entries: [...entries, entry].slice(-KEY_TRAIL_MAX),
    nextId: nextId + 1,
  }
}

export function pruneKeyTrail(
  entries: KeyTrailEntry[],
  now: number,
  ttlMs: number = KEY_TRAIL_TTL_MS,
): KeyTrailEntry[] {
  return entries.filter((entry) => now - entry.createdAt < ttlMs)
}

export function keyTrailOpacity(
  entry: KeyTrailEntry,
  now: number,
  ttlMs: number = KEY_TRAIL_TTL_MS,
): number {
  const age = now - entry.createdAt
  if (age <= 0) return 1
  if (age >= ttlMs) return 0
  return 1 - age / ttlMs
}
