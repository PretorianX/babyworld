import { describe, expect, it } from 'vitest'
import {
  ambientBackground,
  prefersReducedMotion,
  softPaletteBlend,
  type AmbientColors,
} from './ambientBackground'

describe('softPaletteBlend', () => {
  it('returns the from colors at t=0 and to colors at t=1', () => {
    const from: AmbientColors = { background: '#000000', backgroundAlt: '#111111' }
    const to: AmbientColors = { background: '#ffffff', backgroundAlt: '#eeeeee' }
    expect(softPaletteBlend(from, to, 0)).toEqual(from)
    expect(softPaletteBlend(from, to, 1)).toEqual(to)
  })

  it('blends midpoints without jumping to extremes', () => {
    const from: AmbientColors = { background: '#000000', backgroundAlt: '#000000' }
    const to: AmbientColors = { background: '#ffffff', backgroundAlt: '#ffffff' }
    const mid = softPaletteBlend(from, to, 0.5)
    expect(mid.background).toBe('#808080')
    expect(mid.backgroundAlt).toBe('#808080')
  })

  it('clamps t into 0..1', () => {
    const from: AmbientColors = { background: '#102030', backgroundAlt: '#203040' }
    const to: AmbientColors = { background: '#a0b0c0', backgroundAlt: '#b0c0d0' }
    expect(softPaletteBlend(from, to, -1)).toEqual(from)
    expect(softPaletteBlend(from, to, 2)).toEqual(to)
  })
})

describe('ambientBackground', () => {
  it('keeps contrast low across a full pulse cycle', () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map((t) => ambientBackground(t, false))
    for (const sample of samples) {
      const a = luminance(sample.background)
      const b = luminance(sample.backgroundAlt)
      expect(Math.abs(a - b)).toBeLessThan(0.35)
    }
  })

  it('freezes motion when reduced motion is requested', () => {
    const a = ambientBackground(0.1, true)
    const b = ambientBackground(0.9, true)
    expect(a).toEqual(b)
  })

  it('drifts gently when motion is allowed', () => {
    const a = ambientBackground(0, false)
    const b = ambientBackground(0.5, false)
    expect(a.background).not.toBe(b.background)
  })
})

describe('prefersReducedMotion', () => {
  it('reads the media query flag when available', () => {
    expect(typeof prefersReducedMotion()).toBe('boolean')
  })
})

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
