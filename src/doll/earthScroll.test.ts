import { describe, expect, it } from 'vitest'
import {
  EARTH_DECORATIONS,
  SCROLL_DEG_PER_SEC,
  createEarthScroll,
} from './earthScroll'

describe('createEarthScroll', () => {
  it('starts at rotation 0', () => {
    const scroll = createEarthScroll()
    expect(scroll.getRotationDeg()).toBe(0)
  })

  it('drifts slowly while idle', () => {
    const scroll = createEarthScroll()
    scroll.tick(1000, 'idle')
    expect(scroll.getRotationDeg()).toBeCloseTo(SCROLL_DEG_PER_SEC.idle, 5)
  })

  it('rolls faster during jump than idle over the same dt', () => {
    const idle = createEarthScroll()
    const jump = createEarthScroll()
    idle.tick(500, 'idle')
    jump.tick(500, 'jump')
    expect(jump.getRotationDeg()).toBeGreaterThan(idle.getRotationDeg())
    expect(jump.getRotationDeg()).toBeCloseTo(SCROLL_DEG_PER_SEC.jump * 0.5, 5)
  })

  it('maps locomotor moves to stronger rates than wave', () => {
    expect(SCROLL_DEG_PER_SEC.somersault).toBeGreaterThan(SCROLL_DEG_PER_SEC.wave)
    expect(SCROLL_DEG_PER_SEC.jump).toBeGreaterThan(SCROLL_DEG_PER_SEC.wave)
    expect(SCROLL_DEG_PER_SEC.star).toBeGreaterThan(SCROLL_DEG_PER_SEC.wave)
    expect(SCROLL_DEG_PER_SEC.wave).toBeGreaterThan(SCROLL_DEG_PER_SEC.idle)
  })

  it('accumulates rotation across ticks', () => {
    const scroll = createEarthScroll()
    scroll.tick(200, 'jump')
    scroll.tick(300, 'jump')
    expect(scroll.getRotationDeg()).toBeCloseTo(SCROLL_DEG_PER_SEC.jump * 0.5, 5)
  })

  it('ignores non-positive dt', () => {
    const scroll = createEarthScroll()
    scroll.tick(0, 'jump')
    scroll.tick(-10, 'jump')
    expect(scroll.getRotationDeg()).toBe(0)
  })

  it('releases a nudge gradually instead of jumping instantly', () => {
    const scroll = createEarthScroll()
    scroll.nudge(4.5)
    // No rotation until the next tick — nudges are smoothed, not instant.
    expect(scroll.getRotationDeg()).toBe(0)

    scroll.tick(16, 'idle')
    const afterOneFrame = scroll.getRotationDeg()
    const idleDrift = (SCROLL_DEG_PER_SEC.idle * 16) / 1000
    expect(afterOneFrame).toBeGreaterThan(idleDrift)
    // A single 16ms frame must apply only part of the boost.
    expect(afterOneFrame - idleDrift).toBeLessThan(4.5 * 0.5)
  })

  it('applies the whole nudge over time', () => {
    const boosted = createEarthScroll()
    const plain = createEarthScroll()
    boosted.nudge(4.5)
    for (let i = 0; i < 200; i++) {
      boosted.tick(16, 'idle')
      plain.tick(16, 'idle')
    }
    expect(boosted.getRotationDeg() - plain.getRotationDeg()).toBeCloseTo(
      4.5,
      1,
    )
  })

  it('ignores non-positive nudge amounts', () => {
    const scroll = createEarthScroll()
    scroll.nudge(0)
    scroll.nudge(-3)
    expect(scroll.getRotationDeg()).toBe(0)
  })
})

describe('EARTH_DECORATIONS', () => {
  it('places several scenery kinds around the ring', () => {
    const kinds = new Set(EARTH_DECORATIONS.map((d) => d.kind))
    expect(kinds.has('tree')).toBe(true)
    expect(kinds.has('house')).toBe(true)
    expect(kinds.has('animal')).toBe(true)
    expect(EARTH_DECORATIONS.length).toBeGreaterThanOrEqual(6)
  })

  it('uses unique ids and angles spanning the circle', () => {
    const ids = EARTH_DECORATIONS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    const angles = EARTH_DECORATIONS.map((d) => d.angleDeg)
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(180)
  })
})
