export type GlyphMode = 'letters' | 'emoji' | 'mixed'

export const GLYPH_MODE_ORDER: readonly GlyphMode[] = ['letters', 'emoji', 'mixed']

export const DEFAULT_GLYPH_MODE: GlyphMode = 'mixed'

const EMOJI = ['🦆', '⭐', '💥', '🎈', '🧸', '🌈', '🍌', '🐸', '💫', '🎪'] as const
const SHAPES = ['●', '■', '▲', '◆', '★', '✚', '✦'] as const
const FALLBACK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')

export type RandomFn = () => number

function pickFrom<T>(items: readonly T[], random: RandomFn): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length))
  return items[index]
}

export function cycleGlyphMode(mode: GlyphMode): GlyphMode {
  const index = GLYPH_MODE_ORDER.indexOf(mode)
  const next = index < 0 ? 0 : (index + 1) % GLYPH_MODE_ORDER.length
  return GLYPH_MODE_ORDER[next]
}

export function glyphModeLabel(mode: GlyphMode): string {
  switch (mode) {
    case 'letters':
      return 'Letters & symbols'
    case 'emoji':
      return 'Emoji'
    case 'mixed':
      return 'Mixed (emoji-friendly)'
  }
}

function printableGlyph(key: string): string | null {
  if (key.length === 1 && key.trim() !== '') return key.toUpperCase()
  return null
}

function pickLetterOrShape(random: RandomFn): string {
  if (random() < 0.65) return pickFrom(FALLBACK_LETTERS, random)
  return pickFrom(SHAPES, random)
}

/**
 * Pure glyph picker. `random` must return values in [0, 1).
 * Mixed buckets for printable keys: letter ~0–0.34, emoji ~0.34–0.72, shape ~0.72–1.
 */
export function pickGlyphText(mode: GlyphMode, key: string, random: RandomFn = Math.random): string {
  const printable = printableGlyph(key)

  if (mode === 'emoji') {
    return pickFrom(EMOJI, random)
  }

  if (mode === 'letters') {
    if (printable) return printable
    return pickLetterOrShape(random)
  }

  // mixed — emoji-friendly default mix
  if (printable) {
    const roll = random()
    if (roll < 0.34) return printable
    if (roll < 0.72) return pickFrom(EMOJI, random)
    return pickFrom(SHAPES, random)
  }

  const roll = random()
  if (roll < 0.55) return pickFrom(EMOJI, random)
  if (roll < 0.8) return pickFrom(SHAPES, random)
  return pickFrom(FALLBACK_LETTERS, random)
}

export { EMOJI as GLYPH_EMOJI, SHAPES as GLYPH_SHAPES }
