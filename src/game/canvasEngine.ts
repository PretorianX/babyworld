import {
  backgroundForPalette,
  createKeyEffect,
  drawGlyph,
  stepGlyph,
  type Glyph,
} from './effects'
import {
  MAX_PARTICLES,
  drawParticle,
  stepParticle,
  type Particle,
} from './particles'

export type CanvasEngine = {
  width: number
  height: number
  glyphs: Glyph[]
  particles: Particle[]
  burstIndex: number
  activePalette: ReturnType<typeof backgroundForPalette> & { id: 'duck-night' | 'daydream' }
}

export function createCanvasEngine(width: number, height: number): CanvasEngine {
  return {
    width,
    height,
    glyphs: [],
    particles: [],
    burstIndex: 0,
    activePalette: { id: 'duck-night', ...backgroundForPalette('duck-night') },
  }
}

export function resizeEngine(engine: CanvasEngine, width: number, height: number): CanvasEngine {
  return { ...engine, width, height }
}

export function smashEngine(
  engine: CanvasEngine,
  x: number,
  y: number,
  key: string,
): CanvasEngine {
  const effect = createKeyEffect(x, y, key, engine.burstIndex)
  const particles = [...engine.particles, ...effect.particles].slice(-MAX_PARTICLES)
  return {
    ...engine,
    burstIndex: engine.burstIndex + 1,
    glyphs: [...engine.glyphs, effect.glyph],
    particles,
    activePalette: { id: effect.palette, ...backgroundForPalette(effect.palette) },
  }
}

export function tickEngine(engine: CanvasEngine, dt: number): CanvasEngine {
  return {
    ...engine,
    glyphs: engine.glyphs
      .map((glyph) => stepGlyph(glyph, dt))
      .filter((glyph): glyph is Glyph => glyph !== null),
    particles: engine.particles
      .map((particle) => stepParticle(particle, dt))
      .filter((particle): particle is Particle => particle !== null),
  }
}

export function drawEngine(ctx: CanvasRenderingContext2D, engine: CanvasEngine): void {
  const gradient = ctx.createLinearGradient(0, 0, engine.width, engine.height)
  gradient.addColorStop(0, engine.activePalette.background)
  gradient.addColorStop(1, engine.activePalette.backgroundAlt)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, engine.width, engine.height)

  for (const particle of engine.particles) {
    drawParticle(ctx, particle)
  }
  ctx.globalAlpha = 1

  for (const glyph of engine.glyphs) {
    drawGlyph(ctx, glyph)
  }
  ctx.globalAlpha = 1
}

export const MAX_DPR = 2
