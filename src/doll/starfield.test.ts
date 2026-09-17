import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SATELLITE_COUNT,
  DEFAULT_STAR_COUNT,
  createStarfield,
  resizeStarfield,
  spawnComet,
  tickStarfield,
  type StarfieldState,
} from './starfield'

describe('createStarfield', () => {
  it('creates stars within bounds with brightness and twinkle phase', () => {
    const state = createStarfield(400, 300, { starCount: 20 }, () => 0.5)
    expect(state.width).toBe(400)
    expect(state.height).toBe(300)
    expect(state.stars).toHaveLength(20)
    for (const star of state.stars) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThanOrEqual(400)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThanOrEqual(300)
      expect(star.brightness).toBeGreaterThan(0)
      expect(star.brightness).toBeLessThanOrEqual(1)
      expect(star.twinklePhase).toBeGreaterThanOrEqual(0)
    }
  })

  it('seeds satellites on slow sky arcs with type and speed', () => {
    const state = createStarfield(800, 600, { satelliteCount: 3 }, () => 0.25)
    expect(state.satellites).toHaveLength(3)
    for (const sat of state.satellites) {
      expect(sat.radius).toBeGreaterThan(0)
      expect(Number.isFinite(sat.angle)).toBe(true)
      expect(sat.speed).not.toBe(0)
      expect(['box', 'circle']).toContain(sat.type)
    }
  })

  it('uses default star and satellite counts', () => {
    expect(DEFAULT_STAR_COUNT).toBeGreaterThanOrEqual(60)
    expect(DEFAULT_SATELLITE_COUNT).toBeGreaterThanOrEqual(2)
    const state = createStarfield(100, 100)
    expect(state.stars).toHaveLength(DEFAULT_STAR_COUNT)
    expect(state.satellites).toHaveLength(DEFAULT_SATELLITE_COUNT)
    expect(state.comets).toHaveLength(0)
  })
})

describe('resizeStarfield', () => {
  it('scales stars into the new viewport without dropping count', () => {
    const state = createStarfield(100, 100, { starCount: 12, satelliteCount: 2 }, () => 0.1)
    const resized = resizeStarfield(state, 400, 200)
    expect(resized.stars).toHaveLength(12)
    expect(resized.satellites).toHaveLength(2)
    expect(resized.width).toBe(400)
    expect(resized.height).toBe(200)
    for (const star of resized.stars) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThanOrEqual(400)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThanOrEqual(200)
    }
  })
})

describe('spawnComet', () => {
  it('adds a comet with velocity and positive life inside/near the field', () => {
    const base = createStarfield(200, 200, { starCount: 1, satelliteCount: 0 }, () => 0.5)
    const next = spawnComet(base, () => 0.5)
    expect(next.comets).toHaveLength(1)
    const comet = next.comets[0]
    expect(comet.life).toBeGreaterThan(0)
    expect(Math.hypot(comet.vx, comet.vy)).toBeGreaterThan(0)
  })
})

describe('tickStarfield', () => {
  it('advances star twinkle phase over time', () => {
    const state = createStarfield(100, 100, { starCount: 1, satelliteCount: 0 }, () => 0)
    const phaseBefore = state.stars[0].twinklePhase
    const next = tickStarfield(state, 16, false)
    expect(next.stars[0].twinklePhase).not.toBe(phaseBefore)
  })

  it('moves comets and removes them when life expires or they leave bounds', () => {
    const state: StarfieldState = {
      ...createStarfield(100, 100, { starCount: 0, satelliteCount: 0 }, () => 0),
      comets: [
        { x: 50, y: 50, vx: 10, vy: 0, life: 0.02 },
        { x: 50, y: 50, vx: 500, vy: 0, life: 5 },
      ],
      cometCooldown: 10,
    }
    const next = tickStarfield(state, 100, false)
    expect(next.comets.every((c) => c.life > 0)).toBe(true)
    expect(next.comets.every((c) => c.x >= -40 && c.x <= 140 && c.y >= -40 && c.y <= 140)).toBe(
      true,
    )
    expect(next.comets.length).toBeLessThan(2)
  })

  it('advances satellite orbit angles', () => {
    const state = createStarfield(200, 200, { starCount: 0, satelliteCount: 1 }, () => 0.5)
    const before = state.satellites[0].angle
    const next = tickStarfield(state, 1000, false)
    expect(next.satellites[0].angle).not.toBe(before)
  })

  it('freezes twinkle, comets, and satellites when reduced motion is set', () => {
    const state: StarfieldState = {
      ...createStarfield(200, 200, { starCount: 4, satelliteCount: 2 }, () => 0.3),
      comets: [{ x: 10, y: 10, vx: 40, vy: 20, life: 2 }],
      cometCooldown: 0,
    }
    const frozen = tickStarfield(state, 100, true)
    expect(frozen.stars.map((s) => s.twinklePhase)).toEqual(
      state.stars.map((s) => s.twinklePhase),
    )
    expect(frozen.comets).toEqual(state.comets)
    expect(frozen.satellites.map((s) => s.angle)).toEqual(state.satellites.map((s) => s.angle))
    expect(frozen.cometCooldown).toBe(state.cometCooldown)
  })

  it('spawns a comet when cooldown elapses', () => {
    const state: StarfieldState = {
      ...createStarfield(300, 300, { starCount: 0, satelliteCount: 0 }, () => 0.5),
      cometCooldown: 0,
    }
    const next = tickStarfield(state, 16, false, () => 0.5)
    expect(next.comets.length).toBeGreaterThanOrEqual(1)
    expect(next.cometCooldown).toBeGreaterThan(0)
  })
})
