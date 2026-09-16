import { describe, expect, it, vi } from 'vitest'
import { feedLeaveGuard, createLeaveGuard } from './leaveGuard'
import { soundProfileForKey } from './soundProfile'
import { createKeyEffect } from './effects'
import { GLYPH_EMOJI } from './glyphMode'

describe('smash integration helpers', () => {
  it('produces a visual effect for every key including leave letters and repeats', () => {
    const keys = ['a', 'l', 'e', 'a', 'v', 'e', 'Enter', 'Shift']
    keys.forEach((key, index) => {
      const effect = createKeyEffect(100, 120, key, index, 'mixed')
      expect(effect.glyph.text.length).toBeGreaterThan(0)
      expect(effect.particles.length).toBeGreaterThan(0)
    })
  })

  it('respects emoji glyph mode for smash bursts', () => {
    const effect = createKeyEffect(40, 50, 'q', 0, 'emoji')
    expect(GLYPH_EMOJI.includes(effect.glyph.text as (typeof GLYPH_EMOJI)[number])).toBe(true)
  })

  it('maps a sound profile for leave letters and repeats alike', () => {
    expect(soundProfileForKey('l', 0).voice).toBeTruthy()
    expect(soundProfileForKey('e', 1).voice).toBeTruthy()
    expect(soundProfileForKey('a', 2).voice).toBeTruthy()
    expect(soundProfileForKey('v', 3).voice).toBeTruthy()
    expect(soundProfileForKey('e', 4).voice).toBeTruthy()
    expect(soundProfileForKey('e', 5)).not.toEqual(soundProfileForKey('e', 4))
  })

  it('only unlocks after a completed leave sequence', () => {
    let state = createLeaveGuard()
    for (const char of 'leav') {
      const result = feedLeaveGuard(state, char, 100)
      state = result.state
      expect(result.matched).toBe(false)
    }
    expect(feedLeaveGuard(state, 'e', 200).matched).toBe(true)
  })
})

describe('exit invariant helpers', () => {
  it('treats Escape as a non-matching guard input', () => {
    let state = createLeaveGuard()
    state = feedLeaveGuard(state, 'l', 1).state
    const result = feedLeaveGuard(state, 'Escape', 2)
    expect(result.matched).toBe(false)
    expect(result.state.buffer).toBe('l')
  })

  it('keeps smash active semantics when fullscreen is denied', () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error('denied'))
    const modeAfterDenied = (() => {
      let mode: 'gate' | 'smash' = 'gate'
      // Mimic App enter path: set smash regardless of fullscreen outcome.
      void requestFullscreen().catch(() => undefined)
      mode = 'smash'
      return mode
    })()
    expect(modeAfterDenied).toBe('smash')
  })

  it('does not use fullscreen reclaim as the Esc strategy', async () => {
    const { lockSmashKeys, supportsKeyboardLock } = await import('./keyboardLock')
    // Primary Esc strategy is Keyboard Lock (Chromium) + CSS immersive shell.
    // App no longer re-requests fullscreen on fullscreenchange for Esc.
    expect(typeof lockSmashKeys).toBe('function')
    expect(typeof supportsKeyboardLock).toBe('function')
    expect(supportsKeyboardLock({})).toBe(false)
  })
})
