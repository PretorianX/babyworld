import { useEffect, useRef } from 'react'
import {
  createStarfield,
  drawStarfield,
  paintSpaceBase,
  resizeStarfield,
  tickStarfield,
  type StarfieldState,
} from '../doll/starfield'
import { prefersReducedMotion } from '../game/ambientBackground'
import { MAX_DPR } from '../game/canvasEngine'

export function StarfieldBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let field: StarfieldState = createStarfield(1, 1)
    const reducedMotion = prefersReducedMotion()
    let last = performance.now()
    let frame = 0

    const fit = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = parent.clientWidth || window.innerWidth
      const height = parent.clientHeight || window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      field =
        field.width <= 1
          ? createStarfield(width, height)
          : resizeStarfield(field, width, height)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(canvas.parentElement ?? document.documentElement)

    const loop = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      field = tickStarfield(field, dt, reducedMotion)
      paintSpaceBase(ctx, field.width, field.height)
      drawStarfield(ctx, field, reducedMotion)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="starfield-backdrop"
      aria-hidden="true"
    />
  )
}
