import { createBurst, paletteColors, type PaletteId, type Particle } from './particles'

export type Glyph = {
  text: string
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  scale: number
  life: number
  maxLife: number
  color: string
}

const EMOJI = ['🦆', '⭐', '💥', '🎈', '🧸', '🌈', '🍌', '🐸', '💫', '🎪']
const SHAPES = ['●', '■', '▲', '◆', '★', '✚', '✦']

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function nextPalette(burstIndex: number): PaletteId {
  return burstIndex % 2 === 0 ? 'duck-night' : 'daydream'
}

export function glyphTextForKey(key: string): string {
  if (key.length === 1 && key.trim() !== '') return key.toUpperCase()
  if (Math.random() < 0.45) return pick(EMOJI)
  return pick(SHAPES)
}

export function createGlyph(
  x: number,
  y: number,
  text: string,
  palette: PaletteId,
): Glyph {
  return {
    text,
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: -2 - Math.random() * 4,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.22,
    scale: 0.85 + Math.random() * 1.35,
    life: 0,
    maxLife: 1.3 + Math.random() * 0.8,
    color: pick(paletteColors(palette)),
  }
}

export function createKeyEffect(
  x: number,
  y: number,
  key: string,
  burstIndex: number,
): { glyph: Glyph; particles: Particle[]; palette: PaletteId } {
  const palette = nextPalette(burstIndex)
  return {
    palette,
    glyph: createGlyph(x, y, glyphTextForKey(key), palette),
    particles: createBurst(x, y, palette),
  }
}

export function stepGlyph(glyph: Glyph, dt: number): Glyph | null {
  const life = glyph.life + dt
  if (life >= glyph.maxLife) return null
  return {
    ...glyph,
    x: glyph.x + glyph.vx,
    y: glyph.y + glyph.vy,
    vy: glyph.vy + 0.12,
    rotation: glyph.rotation + glyph.spin,
    life,
  }
}

export function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph): void {
  const progress = glyph.life / glyph.maxLife
  const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3
  const scale = glyph.scale * (0.85 + Math.sin(progress * Math.PI) * 0.25)
  ctx.save()
  ctx.globalAlpha = Math.max(0, alpha)
  ctx.translate(glyph.x, glyph.y)
  ctx.rotate(glyph.rotation)
  ctx.scale(scale, scale)
  ctx.fillStyle = glyph.color
  ctx.font = '700 48px Nunito, "Noto Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(glyph.text, 0, 0)
  ctx.restore()
}

export function backgroundForPalette(palette: PaletteId): {
  background: string
  backgroundAlt: string
} {
  if (palette === 'daydream') {
    return { background: '#fff8e7', backgroundAlt: '#ffe9b5' }
  }
  return { background: '#0d1b2a', backgroundAlt: '#1b263b' }
}
