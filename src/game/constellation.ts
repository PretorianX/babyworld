export type ConstellationNode = {
  x: number
  y: number
  vx: number
  vy: number
}

export type ConstellationState = {
  width: number
  height: number
  linkDistance: number
  nodes: ConstellationNode[]
}

export type RandomFn = () => number

/**
 * Soft particle-network ambient inspired by atata.cloud's canvas field,
 * rewritten for BabyWorld / MailDuck tokens (not a copy of their source).
 *
 * Reference: navy wash + duck orange/yellow links — never a bright full-screen flash.
 */
export const FIELD_BASE = '#0d1b2a'
export const FIELD_DEPTH = '#050505'
export const NODE_FILL = '#ffde59'
export const LINK_RGB = '247, 148, 29'
export const TEAL_LINK_RGB = '144, 224, 239'
export const DEFAULT_NODE_COUNT = 80
export const DEFAULT_LINK_DISTANCE = 120
/** Matches atata-style drift: (random - 0.5) * VELOCITY_SPREAD */
export const VELOCITY_SPREAD = 0.4

export function createConstellation(
  width: number,
  height: number,
  count: number = DEFAULT_NODE_COUNT,
  random: RandomFn = Math.random,
  linkDistance: number = DEFAULT_LINK_DISTANCE,
): ConstellationState {
  const nodes: ConstellationNode[] = []
  for (let i = 0; i < count; i += 1) {
    nodes.push({
      x: random() * width,
      y: random() * height,
      vx: (random() - 0.5) * VELOCITY_SPREAD,
      vy: (random() - 0.5) * VELOCITY_SPREAD,
    })
  }
  return { width, height, linkDistance, nodes }
}

export function resizeConstellation(
  state: ConstellationState,
  width: number,
  height: number,
): ConstellationState {
  const scaleX = state.width === 0 ? 1 : width / state.width
  const scaleY = state.height === 0 ? 1 : height / state.height
  return {
    ...state,
    width,
    height,
    nodes: state.nodes.map((node) => ({
      ...node,
      x: Math.min(width, Math.max(0, node.x * scaleX)),
      y: Math.min(height, Math.max(0, node.y * scaleY)),
    })),
  }
}

export function stepConstellation(
  state: ConstellationState,
  dtScale: number = 1,
  reducedMotion: boolean = false,
): ConstellationState {
  if (reducedMotion) return state

  const nodes = state.nodes.map((node) => {
    let { x, y, vx, vy } = node
    x += vx * dtScale
    y += vy * dtScale
    if (x < 0 || x > state.width) {
      vx *= -1
      x = Math.min(state.width, Math.max(0, x))
    }
    if (y < 0 || y > state.height) {
      vy *= -1
      y = Math.min(state.height, Math.max(0, y))
    }
    return { x, y, vx, vy }
  })

  return { ...state, nodes }
}

/** Fill stable navy depth — never a bright solid clear that reads as a strobe. */
export function paintFieldBase(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, FIELD_DEPTH)
  gradient.addColorStop(0.45, FIELD_BASE)
  gradient.addColorStop(1, '#1b263b')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  state: ConstellationState,
): void {
  const { nodes, linkDistance } = state

  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i]
    for (let j = i + 1; j < nodes.length; j += 1) {
      const m = nodes[j]
      const dx = n.x - m.x
      const dy = n.y - m.y
      const dist = Math.hypot(dx, dy)
      if (dist >= linkDistance) continue
      const fade = 1 - dist / linkDistance
      // Mostly duck-orange links; every third pair gets a softer teal for depth.
      const rgb = (i + j) % 3 === 0 ? TEAL_LINK_RGB : LINK_RGB
      const alpha = fade * 0.55
      ctx.beginPath()
      ctx.moveTo(n.x, n.y)
      ctx.lineTo(m.x, m.y)
      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  for (const node of nodes) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = NODE_FILL
    ctx.fill()
  }
}
