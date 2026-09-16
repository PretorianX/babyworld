/**
 * Decisions for keeping smash mode fullscreen.
 *
 * Chromium: Keyboard Lock holds Esc, but press-and-hold Esc is a browser
 * escape hatch that always exits fullscreen. Safari/Firefox: no Keyboard Lock
 * at all, so any Esc exits fullscreen. In both cases smash mode must reclaim
 * fullscreen — immediately when the browser grants it inside the
 * fullscreenchange handler, otherwise on the next key/pointer gesture
 * (instant with a smashing kid).
 */

export type FullscreenChangeAction = 'relock' | 'reclaim' | 'ignore'

/** React to a fullscreenchange event while smash mode is mounted. */
export function onSmashFullscreenChange(input: {
  isFullscreen: boolean
  leaving: boolean
}): FullscreenChangeAction {
  if (input.leaving) return 'ignore'
  return input.isFullscreen ? 'relock' : 'reclaim'
}

/** True when a user gesture (keydown/pointerdown) should re-enter fullscreen. */
export function shouldReclaimOnGesture(input: {
  isFullscreen: boolean
  leaving: boolean
}): boolean {
  return !input.leaving && !input.isFullscreen
}
