import { describe, expect, it } from 'vitest'
import {
  onSmashFullscreenChange,
  shouldReclaimOnGesture,
} from './fullscreenGuard'

describe('onSmashFullscreenChange', () => {
  it('re-locks the keyboard whenever fullscreen is (re)entered', () => {
    expect(
      onSmashFullscreenChange({ isFullscreen: true, leaving: false }),
    ).toBe('relock')
  })

  it('reclaims fullscreen on an unexpected exit (Esc without Keyboard Lock)', () => {
    expect(
      onSmashFullscreenChange({ isFullscreen: false, leaving: false }),
    ).toBe('reclaim')
  })

  it('ignores the fullscreen exit triggered by typing leave', () => {
    expect(
      onSmashFullscreenChange({ isFullscreen: false, leaving: true }),
    ).toBe('ignore')
    expect(
      onSmashFullscreenChange({ isFullscreen: true, leaving: true }),
    ).toBe('ignore')
  })
})

describe('shouldReclaimOnGesture', () => {
  it('reclaims when smash is active but fullscreen was lost', () => {
    expect(shouldReclaimOnGesture({ isFullscreen: false, leaving: false })).toBe(
      true,
    )
  })

  it('does nothing while already fullscreen', () => {
    expect(shouldReclaimOnGesture({ isFullscreen: true, leaving: false })).toBe(
      false,
    )
  })

  it('does nothing while leaving smash mode', () => {
    expect(shouldReclaimOnGesture({ isFullscreen: false, leaving: true })).toBe(
      false,
    )
  })
})
