import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { MAX_DPR } from '../game/canvasEngine'

export type AuroraRef = {
  spawn: (hue: number, left: number) => void
}

type Pulse = {
  hue: number
  left: number
  spawnTime: number
}

export const AuroraCanvas = forwardRef<AuroraRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pulsesRef = useRef<Pulse[]>([])

  useImperativeHandle(ref, () => ({
    spawn: (hue, left) => {
      pulsesRef.current.push({ hue, left, spawnTime: performance.now() })
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let width = 0
    let height = 0
    let dpr = 1

    const fit = () => {
      const parent = canvas.parentElement
      if (!parent) return
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = parent.clientWidth || window.innerWidth
      height = parent.clientHeight || window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(canvas.parentElement ?? document.documentElement)

    const loop = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // We scale contexts by DPR so logical pixels work
      ctx.scale(dpr, dpr)
      ctx.globalCompositeOperation = 'screen'

      const DURATION = 4000
      pulsesRef.current = pulsesRef.current.filter(
        (p) => now - p.spawnTime < DURATION,
      )

      for (const p of pulsesRef.current) {
        const elapsed = now - p.spawnTime
        const progress = elapsed / DURATION

        let opacity = 0
        let yOffset = 0
        let scale = 1

        if (progress < 0.15) {
          const t = progress / 0.15
          opacity = t * 0.6
          yOffset = height * 0.15 * (1 - t)
          scale = 0.9 + 0.2 * t
        } else {
          const t = (progress - 0.15) / 0.85
          opacity = 0.6 * (1 - t)
          yOffset = -height * 0.2 * t
          scale = 1.1 + 0.2 * t
        }

        const cx = (p.left / 100) * width
        const cy = height * 0.5 + yOffset
        const rx = width * 0.4 * scale
        const ry = height * 0.3 * scale

        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(1, ry / rx)

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${opacity})`)
        grad.addColorStop(0.6, `hsla(${p.hue}, 100%, 65%, ${opacity * 0.1})`)
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 65%, 0)`)

        ctx.fillStyle = grad
        ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
        ctx.restore()
      }

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
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  )
})
