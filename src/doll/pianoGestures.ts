import { JOINT_KEYS, ROOT_KEYS, type JointPose } from './joints'
import type { NoteId } from './pianoNotes'

const ALL_KEYS = [...JOINT_KEYS, ...ROOT_KEYS] as const

/** Hard cap on vertical gesture bounce (px) — prevents runaway upward jumps. */
export const MAX_ROOT_Y_OFFSET = 6
/** Horizontal translation cap (px). */
export const MAX_ROOT_X_OFFSET = 10
/** Default joint-angle offset cap (deg). */
export const MAX_JOINT_OFFSET = 55

export type GestureTarget = Partial<JointPose>

/**
 * Dance-like partial offsets: limb swings + tiny bounce.
 * rootY stays within MAX_ROOT_Y_OFFSET so mash cannot launch the doll.
 */
export const NOTE_GESTURES: Record<NoteId, GestureTarget> = {
  C4: { upperArmL: -42, lowerArmL: -16, torso: -4, rootY: -3 },
  'C#4': { upperArmL: -48, lowerArmL: -22, head: -5, rootY: -2 },
  D4: { upperArmL: -34, lowerArmL: -12, upperLegL: 12, torso: -3 },
  'D#4': { upperArmL: -38, lowerArmL: -18, upperLegL: 8, head: -3 },
  E4: { upperArmL: -26, lowerArmL: -8, torso: -2, rootY: -3 },
  F4: { torso: 4, head: 5, upperArmL: -16, upperArmR: 16, rootY: -2 },
  'F#4': { torso: 5, head: 6, upperArmL: -12, upperArmR: 20 },
  G4: { torso: 3, head: -3, upperArmR: 30, lowerArmR: 12, rootY: -3 },
  'G#4': { upperArmR: 38, lowerArmR: 18, head: 4, torso: 2 },
  A4: { upperArmR: 44, lowerArmR: 16, upperLegR: -10, rootY: -2 },
  'A#4': { upperArmR: 50, lowerArmR: 22, head: 5 },
  B4: { upperArmR: 40, lowerArmR: 12, torso: 3, rootY: -3 },
  C5: { upperArmR: 42, lowerArmR: 14, torso: 4, rootY: -3 },
  'C#5': { upperArmR: 48, lowerArmR: 20, head: 5 },
  D5: { upperArmR: 34, lowerArmR: 10, upperLegR: -12, torso: 3 },
  'D#5': { upperArmR: 38, lowerArmR: 16, upperLegR: -8, head: 3 },
  E5: { upperArmR: 26, lowerArmR: 8, torso: 2, rootY: -3 },
  F5: { torso: -4, head: -5, upperArmR: 16, upperArmL: -16, rootY: -2 },
  'F#5': { torso: -5, head: -6, upperArmL: -20, upperArmR: 12 },
  G5: { upperArmL: -44, lowerArmL: -14, torso: -3, rootY: -3 },
}

export function gestureForNote(noteId: NoteId): GestureTarget {
  return NOTE_GESTURES[noteId]
}

function maxForKey(key: (typeof ALL_KEYS)[number], jointMax: number): number {
  if (key === 'rootY') return MAX_ROOT_Y_OFFSET
  if (key === 'rootX') return MAX_ROOT_X_OFFSET
  return jointMax
}

function clampKey(
  key: (typeof ALL_KEYS)[number],
  value: number,
  jointMax: number,
): number {
  return clampOffset(value, maxForKey(key, jointMax))
}

function clampOffset(value: number, max: number): number {
  if (value > max) return max
  if (value < -max) return -max
  return value
}

export function applyOffsets(
  base: JointPose,
  offsets: Partial<JointPose>,
): JointPose {
  const out: JointPose = { ...base }
  for (const key of ALL_KEYS) {
    const delta = offsets[key]
    if (delta === undefined || !Number.isFinite(delta)) continue
    out[key] = base[key] + clampKey(key, delta, MAX_JOINT_OFFSET)
  }
  return out
}

export type GestureBlenderOptions = {
  approachDegPerSec?: number
  decayDegPerSec?: number
  maxOffsetDeg?: number
  accentDeg?: number
  accentDecayDegPerSec?: number
}

export type GestureBlender = {
  strike: (noteId: NoteId) => void
  tick: (dtMs: number) => Partial<JointPose>
  getOffsets: () => Partial<JointPose>
}

function emptyOffsets(): Partial<JointPose> {
  return {}
}

function moveToward(current: number, target: number, maxStep: number): number {
  const delta = target - current
  if (Math.abs(delta) <= maxStep) return target
  return current + Math.sign(delta) * maxStep
}

function decayTowardZero(value: number, maxStep: number): number {
  if (Math.abs(value) <= maxStep) return 0
  return value - Math.sign(value) * maxStep
}

function composeDisplay(
  current: Partial<JointPose>,
  accent: Partial<JointPose>,
  jointMax: number,
): Partial<JointPose> {
  const out: Partial<JointPose> = {}
  for (const key of ALL_KEYS) {
    const c = current[key] ?? 0
    const a = accent[key] ?? 0
    const sum = c + a
    if (sum !== 0) out[key] = clampKey(key, sum, jointMax)
  }
  return out
}

export function createGestureBlender(
  options: GestureBlenderOptions = {},
): GestureBlender {
  const approachDegPerSec = options.approachDegPerSec ?? 160
  const decayDegPerSec = options.decayDegPerSec ?? 95
  const maxOffsetDeg = options.maxOffsetDeg ?? MAX_JOINT_OFFSET
  const accentDeg = options.accentDeg ?? 6
  const accentDecayDegPerSec = options.accentDecayDegPerSec ?? 80

  let current: Partial<JointPose> = emptyOffsets()
  let target: Partial<JointPose> = emptyOffsets()
  let accent: Partial<JointPose> = emptyOffsets()
  let display: Partial<JointPose> = emptyOffsets()

  const strike = (noteId: NoteId) => {
    const gesture = gestureForNote(noteId)
    const nextTarget: Partial<JointPose> = {}
    for (const key of ALL_KEYS) {
      const g = gesture[key]
      if (g === undefined || !Number.isFinite(g)) continue
      nextTarget[key] = clampKey(key, g, maxOffsetDeg)
    }
    target = nextTarget

    const nextAccent: Partial<JointPose> = { ...accent }
    for (const key of ALL_KEYS) {
      const g = nextTarget[key]
      if (g === undefined) continue
      // No accent stacking on rootY — that caused infinite upward hops.
      if (key === 'rootY' || key === 'rootX') continue
      const bump = Math.sign(g) * accentDeg
      nextAccent[key] = clampKey(
        key,
        moveToward(nextAccent[key] ?? 0, bump, accentDeg),
        maxOffsetDeg,
      )
    }
    accent = nextAccent
    display = composeDisplay(current, accent, maxOffsetDeg)
  }

  const tick = (dtMs: number): Partial<JointPose> => {
    if (!Number.isFinite(dtMs) || dtMs <= 0) return display

    const dt = dtMs / 1000
    const approachStep = approachDegPerSec * dt
    const decayStep = decayDegPerSec * dt
    const accentStep = accentDecayDegPerSec * dt

    const nextCurrent: Partial<JointPose> = {}
    const nextTarget: Partial<JointPose> = {}
    const nextAccent: Partial<JointPose> = {}

    for (const key of ALL_KEYS) {
      const cur = current[key] ?? 0
      const tgt = target[key] ?? 0
      const acc = accent[key] ?? 0

      const approached = moveToward(cur, tgt, approachStep)
      const decayedTarget = decayTowardZero(tgt, decayStep)
      const decayedAccent = decayTowardZero(acc, accentStep)

      if (approached !== 0) {
        nextCurrent[key] = clampKey(key, approached, maxOffsetDeg)
      }
      if (decayedTarget !== 0) {
        nextTarget[key] = clampKey(key, decayedTarget, maxOffsetDeg)
      }
      if (decayedAccent !== 0) {
        nextAccent[key] = clampKey(key, decayedAccent, maxOffsetDeg)
      }
    }

    current = nextCurrent
    target = nextTarget
    accent = nextAccent
    display = composeDisplay(current, accent, maxOffsetDeg)
    return display
  }

  return {
    strike,
    tick,
    getOffsets: () => display,
  }
}
