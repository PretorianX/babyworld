import { describe, expect, it, vi } from 'vitest'
import {
  SMASH_KEYBOARD_LOCK_CODES,
  lockSmashKeys,
  supportsKeyboardLock,
  unlockSmashKeys,
  type KeyboardLockNavigator,
} from './keyboardLock'

describe('keyboardLock', () => {
  it('lists Escape so Chromium will not exit fullscreen on Esc', () => {
    expect(SMASH_KEYBOARD_LOCK_CODES).toContain('Escape')
    expect(SMASH_KEYBOARD_LOCK_CODES).toContain('F11')
  })

  it('contains only valid UI Events codes (invalid ones poison the whole lock call)', () => {
    // Chrome rejects the ENTIRE lock() with InvalidAccessError if any code is
    // not in the UI Events code registry. Legacy 'OSLeft'/'OSRight' did exactly
    // that and silently disabled the Esc lock (the "Esc minimizes window" bug).
    const validCodes = new Set([
      'Escape',
      'F11',
      'F12',
      'MetaLeft',
      'MetaRight',
      'ContextMenu',
      'BrowserBack',
      'BrowserForward',
      'BrowserHome',
      'BrowserRefresh',
    ])
    for (const code of SMASH_KEYBOARD_LOCK_CODES) {
      expect(validCodes.has(code), `invalid Keyboard Lock code: ${code}`).toBe(true)
    }
    expect(SMASH_KEYBOARD_LOCK_CODES).not.toContain('OSLeft')
    expect(SMASH_KEYBOARD_LOCK_CODES).not.toContain('OSRight')
  })

  it('detects missing Keyboard Lock API as unsupported', () => {
    expect(supportsKeyboardLock({})).toBe(false)
    expect(supportsKeyboardLock({ keyboard: undefined })).toBe(false)
  })

  it('detects a lock function as supported', () => {
    const nav: KeyboardLockNavigator = {
      keyboard: {
        lock: vi.fn().mockResolvedValue(undefined),
        unlock: vi.fn(),
      },
    }
    expect(supportsKeyboardLock(nav)).toBe(true)
  })

  it('locks the smash key set and reports locked', async () => {
    const lock = vi.fn().mockResolvedValue(undefined)
    const nav: KeyboardLockNavigator = {
      keyboard: { lock, unlock: vi.fn() },
    }
    await expect(lockSmashKeys(nav)).resolves.toBe('locked')
    expect(lock).toHaveBeenCalledWith([...SMASH_KEYBOARD_LOCK_CODES])
  })

  it('returns unsupported when lock is absent', async () => {
    await expect(lockSmashKeys({})).resolves.toBe('unsupported')
  })

  it('returns failed when lock rejects', async () => {
    const nav: KeyboardLockNavigator = {
      keyboard: {
        lock: vi.fn().mockRejectedValue(new Error('not fullscreen')),
        unlock: vi.fn(),
      },
    }
    await expect(lockSmashKeys(nav)).resolves.toBe('failed')
  })

  it('unlocks when the API is present and no-ops otherwise', () => {
    const unlock = vi.fn()
    unlockSmashKeys({ keyboard: { lock: vi.fn(), unlock } })
    expect(unlock).toHaveBeenCalledTimes(1)
    expect(() => unlockSmashKeys({})).not.toThrow()
  })
})
