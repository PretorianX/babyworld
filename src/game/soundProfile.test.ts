import { describe, expect, it } from 'vitest'
import { soundProfileForKey, soundProfileForPointer } from './soundProfile'

describe('soundProfile', () => {
  it('maps every keydown sample to a valid voice', () => {
    for (const key of ['a', 'Z', '1', ' ', 'Enter', 'Shift', 'l', 'e', 'a', 'v', 'e']) {
      const profile = soundProfileForKey(key)
      expect(['boing', 'chirp', 'slide']).toContain(profile.voice)
      expect(profile.durationMs).toBeGreaterThan(0)
      expect(profile.gain).toBeGreaterThan(0)
      expect(profile.startHz).toBeGreaterThan(0)
      expect(profile.endHz).toBeGreaterThan(0)
    }
  })

  it('varies repeated calls within bounded values', () => {
    const first = soundProfileForKey('a', 0)
    const second = soundProfileForKey('a', 1)
    expect(first).not.toEqual(second)
    expect(second.startHz).toBeGreaterThanOrEqual(200)
    expect(second.startHz).toBeLessThanOrEqual(680)
  })

  it('builds pointer profiles', () => {
    const profile = soundProfileForPointer(40, 80)
    expect(profile.durationMs).toBeGreaterThan(0)
  })
})
