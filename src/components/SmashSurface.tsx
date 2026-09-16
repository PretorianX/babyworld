import { useEffect, useRef } from 'react'
import {
  MAX_DPR,
  createCanvasEngine,
  drawEngine,
  resizeEngine,
  smashEngine,
  tickEngine,
  type CanvasEngine,
} from '../game/canvasEngine'
import type { GlyphMode } from '../game/glyphMode'
import { createLeaveGuard, feedLeaveGuard, type LeaveGuardState } from '../game/leaveGuard'
import { playKeySound, playPointerSound } from '../game/soundEngine'

type SmashSurfaceProps = {
  onLeave: () => void
  glyphMode: GlyphMode
}

export function SmashSurface({ onLeave, glyphMode }: SmashSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<CanvasEngine>(createCanvasEngine(1, 1, glyphMode))
  const leaveRef = useRef<LeaveGuardState>(createLeaveGuard())
  const onLeaveRef = useRef(onLeave)

  useEffect(() => {
    onLeaveRef.current = onLeave
  }, [onLeave])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    leaveRef.current = createLeaveGuard()
    engineRef.current = createCanvasEngine(window.innerWidth, window.innerHeight, glyphMode)

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      engineRef.current = resizeEngine(engineRef.current, width, height)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(document.documentElement)

    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      engineRef.current = tickEngine(engineRef.current, dt)
      drawEngine(ctx, engineRef.current)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    const randomStagePoint = () => {
      const { width, height } = engineRef.current
      return {
        x: width * (0.18 + Math.random() * 0.64),
        y: height * (0.18 + Math.random() * 0.64),
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Native fullscreen may end; app state stays in smash until leave.
        return
      }

      event.preventDefault()

      const point = randomStagePoint()
      engineRef.current = smashEngine(engineRef.current, point.x, point.y, event.key)
      playKeySound(event.key)

      const isUnmodifiedLetter =
        !event.repeat &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.length === 1 &&
        /[a-z]/i.test(event.key)

      if (isUnmodifiedLetter) {
        const result = feedLeaveGuard(leaveRef.current, event.key, performance.now())
        leaveRef.current = result.state
        if (result.matched) {
          onLeaveRef.current()
        }
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      engineRef.current = smashEngine(engineRef.current, x, y, 'tap')
      playPointerSound(x, y)
    }

    const blockContext = (event: Event) => event.preventDefault()

    window.addEventListener('keydown', onKeyDown, true)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('contextmenu', blockContext)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('keydown', onKeyDown, true)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('contextmenu', blockContext)
    }
  }, [glyphMode])

  return (
    <canvas
      ref={canvasRef}
      id="stage"
      className="smash-surface"
      aria-label="BabyWorld smash stage"
    />
  )
}
