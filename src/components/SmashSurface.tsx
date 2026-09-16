import { useEffect, useRef, useState } from 'react'
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
import {
  KEY_TRAIL_TTL_MS,
  pruneKeyTrail,
  pushKeyTrail,
  type KeyTrailEntry,
} from '../game/keyTrail'
import { createLeaveGuard, feedLeaveGuard, type LeaveGuardState } from '../game/leaveGuard'
import { playKeySound, playPointerSound } from '../game/soundEngine'

type SmashSurfaceProps = {
  onLeave: () => void
  glyphMode: GlyphMode
}

function cancelEscapeEvent(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

export function SmashSurface({ onLeave, glyphMode }: SmashSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<CanvasEngine>(createCanvasEngine(1, 1, glyphMode))
  const leaveRef = useRef<LeaveGuardState>(createLeaveGuard())
  const onLeaveRef = useRef(onLeave)
  const trailIdRef = useRef(1)
  const [trail, setTrail] = useState<KeyTrailEntry[]>([])

  useEffect(() => {
    onLeaveRef.current = onLeave
  }, [onLeave])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    leaveRef.current = createLeaveGuard()
    trailIdRef.current = 1
    setTrail([])
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

    const pruneTimer = window.setInterval(() => {
      const now = performance.now()
      setTrail((current) => pruneKeyTrail(current, now))
    }, 200)

    const randomStagePoint = () => {
      const { width, height } = engineRef.current
      return {
        x: width * (0.18 + Math.random() * 0.64),
        y: height * (0.18 + Math.random() * 0.64),
      }
    }

    const recordTrail = (key: string) => {
      const now = performance.now()
      setTrail((current) => {
        const pushed = pushKeyTrail(
          pruneKeyTrail(current, now),
          key,
          now,
          trailIdRef.current,
        )
        trailIdRef.current = pushed.nextId
        return pushed.entries
      })
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelEscapeEvent(event)
        if (!event.repeat) recordTrail(event.key)
        return
      }

      event.preventDefault()

      const point = randomStagePoint()
      engineRef.current = smashEngine(engineRef.current, point.x, point.y, event.key)
      playKeySound(event.key)
      if (!event.repeat) recordTrail(event.key)

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

    const onKeyUp = (event: KeyboardEvent) => {
      cancelEscapeEvent(event)
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
    window.addEventListener('keyup', onKeyUp, true)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('contextmenu', blockContext)

    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(pruneTimer)
      observer.disconnect()
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('contextmenu', blockContext)
    }
  }, [glyphMode])

  return (
    <>
      <canvas
        ref={canvasRef}
        id="stage"
        className="smash-surface"
        aria-label="BabyWorld smash stage"
      />
      <div className="key-trail" aria-hidden="true">
        {trail.map((entry) => (
          <span
            key={entry.id}
            className="key-trail__item"
            style={{ animationDuration: `${KEY_TRAIL_TTL_MS}ms` }}
          >
            {entry.label}
          </span>
        ))}
      </div>
      <p className="leave-hint">type leave to exit</p>
    </>
  )
}
