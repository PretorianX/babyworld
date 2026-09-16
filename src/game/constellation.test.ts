import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LINK_DISTANCE,
  DEFAULT_NODE_COUNT,
  VELOCITY_SPREAD,
  createConstellation,
  drawConstellation,
  paintFieldBase,
  resizeConstellation,
  stepConstellation,
  type ConstellationState,
} from './constellation'

describe('constellation ambient', () => {
  it('defaults to ~80 nodes and ~120px link distance', () => {
    expect(DEFAULT_NODE_COUNT).toBe(80)
    expect(DEFAULT_LINK_DISTANCE).toBe(120)
  })

  it('creates a bounded node field with slow drift', () => {
    const state = createConstellation(800, 600, 40, () => 0.5)
    expect(state.nodes).toHaveLength(40)
    for (const node of state.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0)
      expect(node.x).toBeLessThanOrEqual(800)
      expect(Math.abs(node.vx)).toBeLessThanOrEqual(VELOCITY_SPREAD / 2 + 1e-9)
      expect(Math.abs(node.vy)).toBeLessThanOrEqual(VELOCITY_SPREAD / 2 + 1e-9)
    }
  })

  it('drifts slowly and bounces at edges', () => {
    const state: ConstellationState = {
      width: 100,
      height: 100,
      linkDistance: 80,
      nodes: [{ x: 0.1, y: 50, vx: -0.4, vy: 0 }],
    }
    const next = stepConstellation(state, 1)
    expect(next.nodes[0].vx).toBeGreaterThan(0)
    expect(next.nodes[0].x).toBeGreaterThanOrEqual(0)
  })

  it('freezes when reduced motion is set', () => {
    const state = createConstellation(200, 200, 8, () => 0.25)
    const frozen = stepConstellation(state, 1, true)
    expect(frozen.nodes).toEqual(state.nodes)
  })

  it('resizes without dropping node count', () => {
    const state = createConstellation(100, 100, 12, () => 0.1)
    const resized = resizeConstellation(state, 400, 300)
    expect(resized.nodes).toHaveLength(12)
    expect(resized.width).toBe(400)
    expect(resized.height).toBe(300)
  })

  it('paints a navy field and draws dots/links without bright solid flashes', () => {
    const fills: string[] = []
    const strokes: string[] = []
    const calls: string[] = []
    const ctx = {
      beginPath: () => calls.push('beginPath'),
      arc: () => calls.push('arc'),
      fill: () => calls.push('fill'),
      fillRect: () => calls.push('fillRect'),
      moveTo: () => calls.push('moveTo'),
      lineTo: () => calls.push('lineTo'),
      stroke: () => calls.push('stroke'),
      createLinearGradient: () => ({
        addColorStop: () => undefined,
      }),
      set fillStyle(value: string | CanvasGradient) {
        fills.push(typeof value === 'string' ? value : 'gradient')
      },
      get fillStyle() {
        return fills[fills.length - 1] ?? ''
      },
      set strokeStyle(value: string) {
        strokes.push(value)
      },
      get strokeStyle() {
        return strokes[strokes.length - 1] ?? ''
      },
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D

    paintFieldBase(ctx, 200, 200)
    expect(calls).toContain('fillRect')
    expect(fills).toContain('gradient')

    const state = createConstellation(120, 120, 6, () => 0.4)
    drawConstellation(ctx, state)
    expect(calls).toContain('arc')
    expect(calls).toContain('stroke')
    expect(fills.some((value) => value === '#ffde59')).toBe(true)
    expect(strokes.some((value) => value.startsWith('rgba(247, 148, 29'))).toBe(true)
  })
})
