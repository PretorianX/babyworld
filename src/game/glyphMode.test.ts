import { describe, expect, it } from 'vitest'
import {
  GLYPH_MODE_ORDER,
  cycleGlyphMode,
  glyphModeLabel,
  pickGlyphText,
  type GlyphMode,
} from './glyphMode'

const LETTERS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''))
const EMOJI = new Set(['🦆', '⭐', '💥', '🎈', '🧸', '🌈', '🍌', '🐸', '💫', '🎪'])
const SHAPES = new Set(['●', '■', '▲', '◆', '★', '✚', '✦'])

describe('cycleGlyphMode', () => {
  it('cycles letters → emoji → mixed → letters', () => {
    expect(cycleGlyphMode('letters')).toBe('emoji')
    expect(cycleGlyphMode('emoji')).toBe('mixed')
    expect(cycleGlyphMode('mixed')).toBe('letters')
  })

  it('covers every mode in GLYPH_MODE_ORDER exactly once per full cycle', () => {
    let mode: GlyphMode = GLYPH_MODE_ORDER[0]
    const seen = new Set<GlyphMode>()
    for (let i = 0; i < GLYPH_MODE_ORDER.length; i += 1) {
      seen.add(mode)
      mode = cycleGlyphMode(mode)
    }
    expect(seen.size).toBe(GLYPH_MODE_ORDER.length)
    expect(mode).toBe(GLYPH_MODE_ORDER[0])
  })
})

describe('glyphModeLabel', () => {
  it('returns parent-facing labels for each mode', () => {
    expect(glyphModeLabel('letters')).toMatch(/letter/i)
    expect(glyphModeLabel('emoji')).toMatch(/emoji/i)
    expect(glyphModeLabel('mixed')).toMatch(/mix/i)
  })
})

describe('pickGlyphText', () => {
  it('letters mode prefers the pressed printable character', () => {
    expect(pickGlyphText('letters', 'q', () => 0)).toBe('Q')
    expect(pickGlyphText('letters', '7', () => 0)).toBe('7')
  })

  it('letters mode falls back to a letter or shape for non-printables', () => {
    const text = pickGlyphText('letters', 'Enter', () => 0)
    expect(LETTERS.has(text) || SHAPES.has(text)).toBe(true)
  })

  it('emoji mode always returns an emoji', () => {
    for (const key of ['a', 'Enter', ' ', 'Shift', 'tap']) {
      expect(EMOJI.has(pickGlyphText('emoji', key, () => 0.2))).toBe(true)
      expect(EMOJI.has(pickGlyphText('emoji', key, () => 0.9))).toBe(true)
    }
  })

  it('mixed mode can yield letter, emoji, or shape for printable keys', () => {
    expect(LETTERS.has(pickGlyphText('mixed', 'b', () => 0.05)) || pickGlyphText('mixed', 'b', () => 0.05) === 'B').toBe(
      true,
    )
    expect(pickGlyphText('mixed', 'b', () => 0.05)).toBe('B')
    expect(EMOJI.has(pickGlyphText('mixed', 'b', () => 0.4))).toBe(true)
    expect(SHAPES.has(pickGlyphText('mixed', 'b', () => 0.85))).toBe(true)
  })

  it('mixed mode never returns empty text', () => {
    for (const mode of GLYPH_MODE_ORDER) {
      expect(pickGlyphText(mode, 'tap', () => 0.1).length).toBeGreaterThan(0)
      expect(pickGlyphText(mode, 'Meta', () => 0.7).length).toBeGreaterThan(0)
    }
  })
})
