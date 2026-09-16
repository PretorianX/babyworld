import { describe, expect, it } from 'vitest'
import { createLeaveGuard, feedLeaveGuard } from './leaveGuard'
import {
  KEY_TRAIL_MAX,
  KEY_TRAIL_TTL_MS,
  formatKeyLabel,
  keyTrailOpacity,
  pruneKeyTrail,
  pushKeyTrail,
  type KeyTrailEntry,
} from './keyTrail'

describe('keyTrail', () => {
  it('formats printable and named keys for the trail', () => {
    expect(formatKeyLabel('a')).toBe('a')
    expect(formatKeyLabel(' ')).toBe('␣')
    expect(formatKeyLabel('Escape')).toBe('esc')
    expect(formatKeyLabel('Enter')).toBe('↵')
    expect(formatKeyLabel('Meta')).toBe('⌘')
    expect(formatKeyLabel('Alt')).toBe('alt')
    expect(formatKeyLabel('ArrowUp')).toBe('up')
    expect(formatKeyLabel('Backspace')).toBe('⌫')
  })

  it('pushes newest entries and caps the trail length', () => {
    let entries: KeyTrailEntry[] = []
    let nextId = 1
    for (let i = 0; i < KEY_TRAIL_MAX + 3; i += 1) {
      const result = pushKeyTrail(entries, String.fromCharCode(97 + (i % 26)), 1000 + i, nextId)
      entries = result.entries
      nextId = result.nextId
    }
    expect(entries).toHaveLength(KEY_TRAIL_MAX)
    expect(entries[entries.length - 1]?.label).toBe(
      String.fromCharCode(97 + ((KEY_TRAIL_MAX + 2) % 26)),
    )
    expect(entries[0]?.id).toBe(4)
  })

  it('prunes expired entries and fades by age', () => {
    const entries: KeyTrailEntry[] = [
      { id: 1, label: 'a', createdAt: 0 },
      { id: 2, label: 'b', createdAt: 1000 },
    ]
    expect(pruneKeyTrail(entries, KEY_TRAIL_TTL_MS + 50)).toEqual([
      { id: 2, label: 'b', createdAt: 1000 },
    ])
    expect(keyTrailOpacity(entries[1]!, 1000)).toBe(1)
    expect(keyTrailOpacity(entries[1]!, 1000 + KEY_TRAIL_TTL_MS)).toBe(0)
    expect(keyTrailOpacity(entries[1]!, 1000 + KEY_TRAIL_TTL_MS / 2)).toBeCloseTo(0.5)
  })

  it('shows Escape in the trail without advancing the leave buffer', () => {
    let leave = createLeaveGuard()
    leave = feedLeaveGuard(leave, 'l', 10).state
    expect(leave.buffer).toBe('l')

    const ignored = feedLeaveGuard(leave, 'Escape', 20)
    expect(ignored.state.buffer).toBe('l')
    expect(ignored.matched).toBe(false)

    const trail = pushKeyTrail([], 'Escape', 20, 1)
    expect(trail.entries[0]?.label).toBe('esc')
  })
})
