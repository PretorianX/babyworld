export type AmbientColors = {
  background: string
  backgroundAlt: string
}

/** Stable duck2 navy wash — never daydream cream that would strobe against night. */
const BASE: AmbientColors = {
  background: '#050505',
  backgroundAlt: '#0d1b2a',
}

const ACCENT: AmbientColors = {
  background: '#0d1b2a',
  backgroundAlt: '#1b263b',
}

function clamp01(t: number): number {
  if (t < 0) return 0
  if (t > 1) return 1
  return t
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function mixChannel(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function softPaletteBlend(from: AmbientColors, to: AmbientColors, t: number): AmbientColors {
  const u = clamp01(t)
  const [fr, fg, fb] = hexToRgb(from.background)
  const [tr, tg, tb] = hexToRgb(to.background)
  const [far, fag, fab] = hexToRgb(from.backgroundAlt)
  const [tar, tag, tab] = hexToRgb(to.backgroundAlt)
  return {
    background: rgbToHex(mixChannel(fr, tr, u), mixChannel(fg, tg, u), mixChannel(fb, tb, u)),
    backgroundAlt: rgbToHex(mixChannel(far, tar, u), mixChannel(fag, tag, u), mixChannel(fab, tab, u)),
  }
}

/**
 * Slow, low-contrast ambient wash. `phase` is 0..1 over a long cycle.
 * Kept within duck2 navy family so smash bursts never invert the whole screen.
 */
export function ambientBackground(phase: number, reducedMotion: boolean): AmbientColors {
  if (reducedMotion) {
    return softPaletteBlend(BASE, ACCENT, 0.35)
  }
  const wave = 0.5 - 0.5 * Math.cos(clamp01(phase) * Math.PI * 2)
  return softPaletteBlend(BASE, ACCENT, 0.2 + wave * 0.35)
}

export function prefersReducedMotion(
  matchMedia: (query: string) => { matches: boolean } = globalThis.matchMedia?.bind(globalThis) ??
    (() => ({ matches: false })),
): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Seconds for one full ambient gradient cycle — intentionally slow. */
export const AMBIENT_CYCLE_SECONDS = 18
