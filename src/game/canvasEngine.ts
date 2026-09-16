import {
  AMBIENT_CYCLE_SECONDS,
  ambientBackground,
  prefersReducedMotion,
} from './ambientBackground'
import {
  createConstellation,
  drawConstellation,
  paintFieldBase,
  resizeConstellation,
  stepConstellation,
  type ConstellationState,
} from './constellation'
import { createKeyEffect, drawGlyph, stepGlyph, type Glyph } from './effects'
import type { GlyphMode } from './glyphMode'
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
  elapsed: number
  reducedMotion: boolean
  constellation: ConstellationState
  glyphMode: GlyphMode
}

export function createCanvasEngine(
  width: number,
  height: number,
  glyphMode: GlyphMode = 'mixed',
): CanvasEngine {
  return {
    width,
    height,
    glyphs: [],
    particles: [],
    burstIndex: 0,
    elapsed: 0,
    reducedMotion: prefersReducedMotion(),
    constellation: createConstellation(width, height),
    glyphMode,
  }
}

export function resizeEngine(engine: CanvasEngine, width: number, height: number): CanvasEngine {
  return {
    ...engine,
    width,
    height,
    constellation: resizeConstellation(engine.constellation, width, height),
  }
}

export function smashEngine(
  engine: CanvasEngine,
  x: number,
  y: number,
  key: string,
): CanvasEngine {
  const effect = createKeyEffect(x, y, key, engine.burstIndex, engine.glyphMode)
  const particles = [...engine.particles, ...effect.particles].slice(-MAX_PARTICLES)
  return {
    ...engine,
    burstIndex: engine.burstIndex + 1,
    glyphs: [...engine.glyphs, effect.glyph],
    particles,
  }
}

export function tickEngine(engine: CanvasEngine, dt: number): CanvasEngine {
  const elapsed = engine.elapsed + dt
  return {
    ...engine,
    elapsed,
    constellation: stepConstellation(engine.constellation, 1, engine.reducedMotion),
    glyphs: engine.glyphs
      .map((glyph) => stepGlyph(glyph, dt))
      .filter((glyph): glyph is Glyph => glyph !== null),
    particles: engine.particles
      .map((particle) => stepParticle(particle, dt))
      .filter((particle): particle is Particle => particle !== null),
  }
}

export function drawEngine(ctx: CanvasRenderingContext2D, engine: CanvasEngine): void {
  // Stable navy field + soft constellation — no night/day full-screen swap.
  paintFieldBase(ctx, engine.width, engine.height)

  const phase = (engine.elapsed % AMBIENT_CYCLE_SECONDS) / AMBIENT_CYCLE_SECONDS
  const wash = ambientBackground(phase, engine.reducedMotion)
  const veil = ctx.createLinearGradient(0, 0, engine.width, engine.height)
  veil.addColorStop(0, wash.background)
  veil.addColorStop(1, wash.backgroundAlt)
  ctx.globalAlpha = 0.35
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, engine.width, engine.height)
  ctx.globalAlpha = 1

  drawConstellation(ctx, engine.constellation)

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
