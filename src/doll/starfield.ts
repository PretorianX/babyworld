export type RandomFn = () => number

export type Star = {
  x: number
  y: number
  brightness: number
  twinklePhase: number
}

export type Comet = {
  x: number
  y: number
  vx: number
  vy: number
  /** Remaining life in seconds. */
  life: number
}

export type SatelliteType = 'box' | 'circle'

export type Satellite = {
  angle: number
  radius: number
  speed: number
  type: SatelliteType
  /** Vertical center offset from mid-height (keeps arcs in sky, not on Earth). */
  cyOffset: number
}

export type StarfieldState = {
  width: number
  height: number
  stars: Star[]
  comets: Comet[]
  satellites: Satellite[]
  /** Seconds until next comet spawn attempt. */
  cometCooldown: number
}

export type StarfieldOptions = {
  starCount?: number
  satelliteCount?: number
}

export const DEFAULT_STAR_COUNT = 90
export const DEFAULT_SATELLITE_COUNT = 3
export const COMET_MIN_COOLDOWN = 4
export const COMET_MAX_COOLDOWN = 11
/** Soft cull margin so trails can exit cleanly. */
export const COMET_BOUNDS_PAD = 40

export const SPACE_DEPTH = '#05080f'
export const SPACE_NAVY = '#0d1b2a'
export const SPACE_HORIZON = '#152536'
export const STAR_RGB = '227, 242, 253'
export const COMET_RGB = '255, 222, 89'
export const SAT_BODY = '#c5d4e3'
export const SAT_PANEL = '#f7941d'

const TWINKLE_SPEED = 0.0022
const COMET_SPEED_MIN = 180
const COMET_SPEED_MAX = 320
const COMET_LIFE_MIN = 1.4
const COMET_LIFE_MAX = 2.8

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function pickSatelliteType(random: RandomFn): SatelliteType {
  return random() < 0.5 ? 'box' : 'circle'
}

export function createStarfield(
  width: number,
  height: number,
  options: StarfieldOptions = {},
  random: RandomFn = Math.random,
): StarfieldState {
  const starCount = options.starCount ?? DEFAULT_STAR_COUNT
  const satelliteCount = options.satelliteCount ?? DEFAULT_SATELLITE_COUNT

  const stars: Star[] = []
  for (let i = 0; i < starCount; i += 1) {
    stars.push({
      x: random() * width,
      y: random() * height,
      brightness: 0.35 + random() * 0.65,
      twinklePhase: random() * Math.PI * 2,
    })
  }

  const satellites: Satellite[] = []
  const minRadius = Math.min(width, height) * 0.35
  const maxRadius = Math.max(width, height) * 0.55
  for (let i = 0; i < satelliteCount; i += 1) {
    const direction = random() < 0.5 ? 1 : -1
    satellites.push({
      angle: random() * Math.PI * 2,
      radius: minRadius + random() * (maxRadius - minRadius),
      speed: direction * (0.08 + random() * 0.12),
      type: pickSatelliteType(random),
      cyOffset: -height * (0.12 + random() * 0.2),
    })
  }

  return {
    width,
    height,
    stars,
    comets: [],
    satellites,
    cometCooldown: COMET_MIN_COOLDOWN + random() * (COMET_MAX_COOLDOWN - COMET_MIN_COOLDOWN),
  }
}

export function resizeStarfield(
  state: StarfieldState,
  width: number,
  height: number,
): StarfieldState {
  const scaleX = state.width === 0 ? 1 : width / state.width
  const scaleY = state.height === 0 ? 1 : height / state.height
  return {
    ...state,
    width,
    height,
    stars: state.stars.map((star) => ({
      ...star,
      x: clamp(star.x * scaleX, 0, width),
      y: clamp(star.y * scaleY, 0, height),
    })),
    comets: state.comets.map((comet) => ({
      ...comet,
      x: comet.x * scaleX,
      y: comet.y * scaleY,
      vx: comet.vx * scaleX,
      vy: comet.vy * scaleY,
    })),
    satellites: state.satellites.map((sat) => ({
      ...sat,
      radius: sat.radius * Math.max(scaleX, scaleY),
      cyOffset: sat.cyOffset * scaleY,
    })),
  }
}

export function spawnComet(
  state: StarfieldState,
  random: RandomFn = Math.random,
): StarfieldState {
  const fromLeft = random() < 0.5
  const y = random() * state.height * 0.55
  const speed = COMET_SPEED_MIN + random() * (COMET_SPEED_MAX - COMET_SPEED_MIN)
  const angle = fromLeft
    ? -0.35 + random() * 0.45
    : Math.PI + 0.35 - random() * 0.45
  const comet: Comet = {
    x: fromLeft ? -COMET_BOUNDS_PAD : state.width + COMET_BOUNDS_PAD,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: COMET_LIFE_MIN + random() * (COMET_LIFE_MAX - COMET_LIFE_MIN),
  }
  return {
    ...state,
    comets: [...state.comets, comet],
  }
}

function nextCometCooldown(random: RandomFn): number {
  return COMET_MIN_COOLDOWN + random() * (COMET_MAX_COOLDOWN - COMET_MIN_COOLDOWN)
}

export function tickStarfield(
  state: StarfieldState,
  dtMs: number,
  reducedMotion: boolean = false,
  random: RandomFn = Math.random,
): StarfieldState {
  if (reducedMotion) return state

  const dt = dtMs / 1000

  const stars = state.stars.map((star) => ({
    ...star,
    twinklePhase: star.twinklePhase + dtMs * TWINKLE_SPEED,
  }))

  const pad = COMET_BOUNDS_PAD
  const comets = state.comets
    .map((comet) => ({
      ...comet,
      x: comet.x + comet.vx * dt,
      y: comet.y + comet.vy * dt,
      life: comet.life - dt,
    }))
    .filter(
      (comet) =>
        comet.life > 0 &&
        comet.x >= -pad &&
        comet.x <= state.width + pad &&
        comet.y >= -pad &&
        comet.y <= state.height + pad,
    )

  const satellites = state.satellites.map((sat) => ({
    ...sat,
    angle: sat.angle + sat.speed * dt,
  }))

  let next: StarfieldState = {
    ...state,
    stars,
    comets,
    satellites,
    cometCooldown: state.cometCooldown - dt,
  }

  if (next.cometCooldown <= 0) {
    next = spawnComet(next, random)
    next = { ...next, cometCooldown: nextCometCooldown(random) }
  }

  return next
}

export function paintSpaceBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, SPACE_DEPTH)
  gradient.addColorStop(0.55, SPACE_NAVY)
  gradient.addColorStop(1, SPACE_HORIZON)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function starAlpha(star: Star, reducedMotion: boolean): number {
  if (reducedMotion) return star.brightness * 0.85
  const twinkle = 0.65 + 0.35 * Math.sin(star.twinklePhase)
  return star.brightness * twinkle
}

export function satellitePosition(
  sat: Satellite,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: width * 0.5 + Math.cos(sat.angle) * sat.radius,
    y: height * 0.5 + sat.cyOffset + Math.sin(sat.angle) * sat.radius * 0.35,
  }
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  state: StarfieldState,
  reducedMotion: boolean = false,
): void {
  for (const star of state.stars) {
    const alpha = starAlpha(star, reducedMotion)
    const radius = 0.6 + star.brightness * 1.4
    ctx.beginPath()
    ctx.arc(star.x, star.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${STAR_RGB}, ${alpha})`
    ctx.fill()
  }

  for (const comet of state.comets) {
    const speed = Math.hypot(comet.vx, comet.vy) || 1
    const trail = 28 * (comet.life / COMET_LIFE_MAX)
    const tx = comet.x - (comet.vx / speed) * trail
    const ty = comet.y - (comet.vy / speed) * trail
    const fade = clamp(comet.life / COMET_LIFE_MIN, 0.15, 1)
    const gradient = ctx.createLinearGradient(tx, ty, comet.x, comet.y)
    gradient.addColorStop(0, `rgba(${COMET_RGB}, 0)`)
    gradient.addColorStop(1, `rgba(${COMET_RGB}, ${0.85 * fade})`)
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(comet.x, comet.y)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(comet.x, comet.y, 1.8, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${STAR_RGB}, ${fade})`
    ctx.fill()
  }

  for (const sat of state.satellites) {
    const { x, y } = satellitePosition(sat, state.width, state.height)
    if (x < -20 || x > state.width + 20 || y < -20 || y > state.height + 20) continue
    drawSatellite(ctx, x, y, sat.type, sat.angle)
  }
}

function drawSatellite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: SatelliteType,
  angle: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle * 0.35)

  if (type === 'box') {
    ctx.fillStyle = SAT_PANEL
    ctx.fillRect(-10, -2, 6, 4)
    ctx.fillRect(4, -2, 6, 4)
    ctx.fillStyle = SAT_BODY
    ctx.fillRect(-3.5, -3.5, 7, 7)
  } else {
    ctx.fillStyle = SAT_PANEL
    ctx.fillRect(-9, -1.5, 5, 3)
    ctx.fillRect(4, -1.5, 5, 3)
    ctx.beginPath()
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = SAT_BODY
    ctx.fill()
  }

  ctx.restore()
}
