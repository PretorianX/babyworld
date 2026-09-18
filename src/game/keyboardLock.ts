/**
 * Keyboard Lock helpers for smash mode.
 *
 * Chromium: navigator.keyboard.lock(['Escape', ...]) while fullscreen so Esc
 * is delivered to the page and does NOT exit native fullscreen (no reclaim gap).
 * Other browsers: unsupported — rely on CSS immersive smash shell instead.
 */

export type KeyboardLockApi = {
  lock: (keyCodes?: readonly string[] | string[]) => Promise<void>
  unlock: () => void
}

export type KeyboardLockNavigator = {
  keyboard?: KeyboardLockApi
}

/**
 * Codes passed to Keyboard.lock — Escape is the fullscreen-exit key.
 *
 * Every entry MUST be a valid UI Events `code` value: Chromium rejects the
 * entire lock() call with InvalidAccessError when ANY entry is invalid
 * (legacy 'OSLeft'/'OSRight' did that and silently disabled the Esc lock).
 */
export const SMASH_KEYBOARD_LOCK_CODES = [
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
] as const

export type KeyboardLockResult = 'locked' | 'unsupported' | 'failed'

function defaultNavigator(): KeyboardLockNavigator {
  if (typeof navigator === 'undefined') return {}
  return navigator as unknown as KeyboardLockNavigator
}

export function supportsKeyboardLock(
  nav: KeyboardLockNavigator = defaultNavigator(),
): boolean {
  return typeof nav.keyboard?.lock === 'function'
}

export async function lockSmashKeys(
  nav: KeyboardLockNavigator = defaultNavigator(),
): Promise<KeyboardLockResult> {
  if (!supportsKeyboardLock(nav)) return 'unsupported'
  try {
    await nav.keyboard!.lock([]) // Empty array requests lock for ALL keys
    return 'locked'
  } catch {
    return 'failed'
  }
}

export function unlockSmashKeys(
  nav: KeyboardLockNavigator = defaultNavigator(),
): void {
  if (typeof nav.keyboard?.unlock !== 'function') return
  nav.keyboard.unlock()
}
