/**
 * In-page denylist for smash mode. Browsers cannot swallow every OS shortcut
 * (notably Win/Cmd alone and Cmd+Tab / Alt+Tab at the compositor). Everything
 * listed here is still cancelled with preventDefault when the page receives it.
 */

export type SmashKeyEvent = {
  key: string
  code: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

const TRAPPED_KEYS = new Set([
  'Escape',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'Meta',
  'OS',
  'Super',
  'Alt',
  'ContextMenu',
  'Help',
  'BrowserBack',
  'BrowserForward',
  'BrowserHome',
  'BrowserRefresh',
  'BrowserSearch',
  'BrowserFavorites',
  'BrowserStop',
])

const TRAPPED_CODES = new Set([
  'MetaLeft',
  'MetaRight',
  'OSLeft',
  'OSRight',
  'AltLeft',
  'AltRight',
])

const CTRL_META_TRAP_LETTERS = new Set(['w', 't', 'n', 'l', 'r', 'q'])
const DEVTOOLS_LETTERS = new Set(['i', 'j', 'c'])

function isBrowserNavKey(key: string): boolean {
  return key.startsWith('Browser')
}

function isFunctionKey(key: string): boolean {
  return /^F\d{1,2}$/.test(key)
}

/** True when smash should cancel the event and skip leave / visual smash. */
export function shouldTrapSmashKey(event: SmashKeyEvent): boolean {
  const { key, code, altKey, ctrlKey, metaKey, shiftKey } = event

  if (TRAPPED_KEYS.has(key) || TRAPPED_CODES.has(code) || isBrowserNavKey(key)) {
    return true
  }

  if (isFunctionKey(key)) {
    return true
  }

  // Any Alt chord (Alt+Tab, Alt+F4, Alt+Space, menu mnemonics).
  if (altKey) {
    return true
  }

  const letter = key.length === 1 ? key.toLowerCase() : ''

  if ((ctrlKey || metaKey) && letter && CTRL_META_TRAP_LETTERS.has(letter)) {
    return true
  }

  if ((ctrlKey || metaKey) && shiftKey && letter && DEVTOOLS_LETTERS.has(letter)) {
    return true
  }

  // Ctrl+Esc → Start menu on Windows when the OS still sees it.
  if (ctrlKey && key === 'Escape') {
    return true
  }

  return false
}

export function cancelTrappedKeyEvent(event: {
  preventDefault: () => void
  stopPropagation: () => void
  stopImmediatePropagation: () => void
}): void {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}
