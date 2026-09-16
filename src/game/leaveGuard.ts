export const LEAVE_SEQUENCE = 'leave'
export const LEAVE_GAP_MS = 4000

export type LeaveGuardState = {
  buffer: string
  lastAt: number | null
}

export function createLeaveGuard(): LeaveGuardState {
  return { buffer: '', lastAt: null }
}

function isLetterKey(key: string): boolean {
  return key.length === 1 && key.toLowerCase() >= 'a' && key.toLowerCase() <= 'z'
}

/** Longest suffix of `value` that is a prefix of `LEAVE_SEQUENCE`. */
export function longestLeavePrefixSuffix(value: string): string {
  for (let i = 0; i < value.length; i += 1) {
    const suffix = value.slice(i)
    if (LEAVE_SEQUENCE.startsWith(suffix)) return suffix
  }
  return ''
}

export function feedLeaveGuard(
  state: LeaveGuardState,
  key: string,
  now: number,
  gapMs: number = LEAVE_GAP_MS,
): { state: LeaveGuardState; matched: boolean } {
  if (!isLetterKey(key)) {
    return { state, matched: false }
  }

  const char = key.toLowerCase()
  const timedOut = state.lastAt !== null && now - state.lastAt > gapMs
  const base = timedOut ? '' : state.buffer
  const next = longestLeavePrefixSuffix(base + char)
  const matched = next === LEAVE_SEQUENCE

  return {
    state: matched
      ? { buffer: '', lastAt: null }
      : { buffer: next, lastAt: now },
    matched,
  }
}
