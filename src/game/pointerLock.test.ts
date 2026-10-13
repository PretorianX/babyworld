import { describe, expect, it } from 'vitest'
import { pointerCoordinatesFrozen, shouldUsePointerLock } from './pointerLock'

const env = (fine: boolean) => ({
  matchMedia: (query: string) => ({ matches: query === '(pointer: fine)' && fine }),
})

describe('pointerLock', () => {
  it('locks for a mouse/trackpad primary pointer', () => {
    expect(shouldUsePointerLock(env(true))).toBe(true)
  })

  it('never locks on touch devices (Android taps would freeze at 0,0)', () => {
    expect(shouldUsePointerLock(env(false))).toBe(false)
  })

  it('does not lock when matchMedia is unavailable', () => {
    expect(shouldUsePointerLock({})).toBe(false)
  })

  it('reports frozen coordinates only while a lock element exists', () => {
    expect(pointerCoordinatesFrozen({ pointerLockElement: null })).toBe(false)
    expect(
      pointerCoordinatesFrozen({ pointerLockElement: {} as Element }),
    ).toBe(true)
  })
})
