import { useEffect, useRef } from 'react'
import {
  MAX_DPR,
} from '../game/canvasEngine'
import {
  createConstellation,
  drawConstellation,
  paintFieldBase,
  resizeConstellation,
  stepConstellation,
  type ConstellationState,
} from '../game/constellation'
import { prefersReducedMotion } from '../game/ambientBackground'
import {
  glyphModeLabel,
  type GlyphMode,
} from '../game/glyphMode'

type StartGateProps = {
  onEnter: () => void
  glyphMode: GlyphMode
  onCycleGlyphMode: () => void
}

export function StartGate({ onEnter, glyphMode, onCycleGlyphMode }: StartGateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let field: ConstellationState = createConstellation(1, 1)
    const reducedMotion = prefersReducedMotion()

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      field = resizeConstellation(
        field.width <= 1 ? createConstellation(width, height) : field,
        width,
        height,
      )
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(document.documentElement)

    let frame = 0
    const loop = () => {
      field = stepConstellation(field, 1, reducedMotion)
      paintFieldBase(ctx, field.width, field.height)
      drawConstellation(ctx, field)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <main className="start-gate">
      <canvas
        ref={canvasRef}
        className="start-gate__field"
        aria-hidden="true"
      />
      <div className="start-gate__glow" aria-hidden="true" />
      <div className="start-gate__content">
        <p className="start-gate__eyebrow">MailDuck playground</p>
        <h1 className="start-gate__brand">
          Baby<span className="start-gate__brand-accent">World</span>
        </h1>
        <p className="start-gate__tagline">
          Fullscreen keyboard smash for tiny fingers. Funny sounds on every
          key. Grown-ups type <strong>leave</strong> to get out.
        </p>
        <div className="start-gate__actions">
          <button
            type="button"
            className="start-gate__mode"
            onClick={onCycleGlyphMode}
            aria-label={`Glyph mode: ${glyphModeLabel(glyphMode)}. Activate to cycle.`}
          >
            Glyphs: {glyphModeLabel(glyphMode)}
          </button>
          <button type="button" className="start-gate__cta" onClick={onEnter}>
            Enter smash
          </button>
        </div>
      </div>
    </main>
  )
}
