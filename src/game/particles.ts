export type PaletteId = 'duck-night' | 'daydream'

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  kind: 'dot' | 'ring' | 'star'
}

export const MAX_PARTICLES = 180

const NIGHT = ['#f7941d', '#ffde59', '#ffcc00', '#e3f2fd', '#90e0ef', '#ff6b6b']
const DAY = ['#f7941d', '#1b263b', '#ffde59', '#00b4d8', '#ef476f', '#06d6a0']

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function paletteColors(palette: PaletteId): string[] {
  return palette === 'duck-night' ? NIGHT : DAY
}

export function createBurst(
  x: number,
  y: number,
  palette: PaletteId,
  count: number = 12,
): Particle[] {
  const colors = paletteColors(palette)
  const particles: Particle[] = []
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35
    const speed = 1.4 + Math.random() * 4.2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.55,
      size: 3 + Math.random() * 7,
      color: pick(colors),
      kind: pick(['dot', 'ring', 'star']),
    })
  }
  return particles
}

export function stepParticle(particle: Particle, dt: number): Particle | null {
  const life = particle.life + dt
  if (life >= particle.maxLife) return null
  return {
    ...particle,
    x: particle.x + particle.vx,
    y: particle.y + particle.vy,
    vy: particle.vy + 0.09,
    life,
  }
}

export function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const alpha = 1 - particle.life / particle.maxLife
  ctx.globalAlpha = Math.max(0, alpha)
  ctx.fillStyle = particle.color
  ctx.strokeStyle = particle.color

  if (particle.kind === 'ring') {
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.stroke()
    return
  }

  if (particle.kind === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 5
      const px = particle.x + Math.cos(angle) * particle.size
      const py = particle.y + Math.sin(angle) * particle.size
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
  ctx.fill()
}
