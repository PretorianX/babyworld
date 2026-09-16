import { describe, expect, it } from 'vitest'
import {
  LEAVE_GAP_MS,
  LEAVE_SEQUENCE,
  createLeaveGuard,
  feedLeaveGuard,
  longestLeavePrefixSuffix,
} from './leaveGuard'

describe('leaveGuard', () => {
  it('matches leave case-insensitively in order', () => {
    let state = createLeaveGuard()
    let matched = false
    const t0 = 1000
    for (const [i, char] of [...'LeAvE'].entries()) {
      const result = feedLeaveGuard(state, char, t0 + i * 50)
      state = result.state
      matched = result.matched
    }
    expect(matched).toBe(true)
    expect(state.buffer).toBe('')
  })

  it('retains a usable suffix after an irrelevant letter', () => {
    let state = createLeaveGuard()
    state = feedLeaveGuard(state, 'x', 10).state
    state = feedLeaveGuard(state, 'l', 20).state
    expect(state.buffer).toBe('l')
    expect(longestLeavePrefixSuffix('xl')).toBe('l')
  })

  it('resets when the gap between letters exceeds the window', () => {
    let state = createLeaveGuard()
    state = feedLeaveGuard(state, 'l', 0).state
    state = feedLeaveGuard(state, 'e', 10).state
    const late = feedLeaveGuard(state, 'l', LEAVE_GAP_MS + 20)
    expect(late.matched).toBe(false)
    expect(late.state.buffer).toBe('l')
  })

  it('excludes modifier and non-letter keys from the buffer', () => {
    let state = createLeaveGuard()
    state = feedLeaveGuard(state, 'l', 1).state
    const ignored = feedLeaveGuard(state, 'Shift', 2)
    expect(ignored.state.buffer).toBe('l')
    expect(ignored.matched).toBe(false)
    const control = feedLeaveGuard(ignored.state, 'Control', 3)
    expect(control.state.buffer).toBe('l')
  })

  it('does not unlock early on a partial prefix', () => {
    let state = createLeaveGuard()
    for (const [i, char] of [...LEAVE_SEQUENCE.slice(0, -1)].entries()) {
      const result = feedLeaveGuard(state, char, 100 + i)
      state = result.state
      expect(result.matched).toBe(false)
    }
    expect(state.buffer).toBe('leav')
  })

  it('matches leave after retaining the l suffix', () => {
    let state = createLeaveGuard()
    state = feedLeaveGuard(state, 'q', 1).state
    state = feedLeaveGuard(state, 'l', 2).state
    let matched = false
    for (const [i, char] of [...'eave'].entries()) {
      const result = feedLeaveGuard(state, char, 10 + i)
      state = result.state
      matched = result.matched
    }
    expect(matched).toBe(true)
  })
})
