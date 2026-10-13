/**
 * Pointer Lock helpers for immersive modes.
 *
 * Pointer Lock only makes sense for a mouse: it hides the cursor and keeps it
 * from reaching browser chrome. On touch devices (Android Chrome) locking
 * freezes pointer coordinates — every tap then reports clientX/clientY as the
 * lock-time position (often 0,0), so effects all spawn in the top-left corner.
 */

export type PointerLockEnv = {
  matchMedia?: (query: string) => { matches: boolean }
}

function defaultEnv(): PointerLockEnv {
  if (typeof window === 'undefined') return {}
  return window
}

/** True only when the primary input is a fine pointer (mouse/trackpad). */
export function shouldUsePointerLock(env: PointerLockEnv = defaultEnv()): boolean {
  if (typeof env.matchMedia !== 'function') return false
  return env.matchMedia('(pointer: fine)').matches
}

export function lockPointer(env: PointerLockEnv = defaultEnv()): void {
  if (!shouldUsePointerLock(env)) return
  try {
    const result = document.body.requestPointerLock() as unknown
    // Newer browsers return a promise that rejects when the lock is refused.
    if (result instanceof Promise) result.catch(() => {})
  } catch {
    // Pointer Lock unsupported or refused — CSS shell still covers the screen.
  }
}

export function unlockPointer(): void {
  if (!document.pointerLockElement) return
  try {
    document.exitPointerLock()
  } catch {
    // Already released.
  }
}

/**
 * Pointer coordinates are meaningless while locked (they stay frozen), so
 * callers should pick their own spawn point instead of trusting clientX/Y.
 */
export function pointerCoordinatesFrozen(doc: Pick<Document, 'pointerLockElement'> = document): boolean {
  return Boolean(doc.pointerLockElement)
}
