import {
  DEFAULT_POSE,
  JOINT_KEYS,
  ROOT_KEYS,
  type JointPose,
} from './joints'
import { MOVES, type MoveId } from './moves'
import { POSES } from './poses'

function clamp01(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t
}

export function lerpPose(from: JointPose, to: JointPose, t: number): JointPose {
  const u = clamp01(t)
  const out = { ...DEFAULT_POSE }
  for (const key of JOINT_KEYS) {
    out[key] = from[key] + (to[key] - from[key]) * u
  }
  for (const key of ROOT_KEYS) {
    out[key] = from[key] + (to[key] - from[key]) * u
  }
  return out
}

function sampleMove(moveId: MoveId, progress: number): JointPose {
  const move = MOVES[moveId]
  const p = clamp01(progress)
  const frames = move.keyframes
  if (frames.length === 0) return DEFAULT_POSE
  if (p <= frames[0].at) return { ...POSES[frames[0].pose] }
  const last = frames[frames.length - 1]
  if (p >= last.at) return { ...POSES[last.pose] }

  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    if (p >= a.at && p <= b.at) {
      const span = b.at - a.at
      const local = span === 0 ? 1 : (p - a.at) / span
      return lerpPose(POSES[a.pose], POSES[b.pose], local)
    }
  }
  return { ...POSES[last.pose] }
}

/** Crossfade window when a new move starts from an arbitrary pose. */
export const PLAY_BLEND_MS = 140

export type DollAnimator = {
  /** Interrupt immediately (crossfaded from the current pose). */
  play: (moveId: MoveId) => void
  /**
   * Dance-friendly trigger: start now when idle, otherwise queue (latest
   * wins) so mash input chains complete moves instead of restarting them.
   */
  requestMove: (moveId: MoveId) => void
  tick: (dtMs: number) => JointPose
  getPose: () => JointPose
  getMoveId: () => MoveId
}

export function createAnimator(): DollAnimator {
  let moveId: MoveId = 'idle'
  let elapsedMs = 0
  let pose: JointPose = sampleMove('idle', 0)
  let entryPose: JointPose | null = null
  let blendElapsedMs = 0
  let pending: MoveId | null = null

  const play = (next: MoveId) => {
    entryPose = pose
    blendElapsedMs = 0
    moveId = next
    elapsedMs = 0
  }

  const requestMove = (next: MoveId) => {
    if (moveId === 'idle') {
      play(next)
      return
    }
    pending = next
  }

  const applyBlend = (sampled: JointPose, dtMs: number): JointPose => {
    if (entryPose === null) return sampled
    blendElapsedMs += dtMs
    if (blendElapsedMs >= PLAY_BLEND_MS) {
      entryPose = null
      return sampled
    }
    return lerpPose(entryPose, sampled, blendElapsedMs / PLAY_BLEND_MS)
  }

  const tick = (dtMs: number): JointPose => {
    const dt = Math.max(0, dtMs)
    const move = MOVES[moveId]
    elapsedMs += dt

    if (move.loop) {
      const cycle = elapsedMs % move.durationMs
      pose = applyBlend(sampleMove(moveId, cycle / move.durationMs), dt)
      return pose
    }

    if (elapsedMs >= move.durationMs) {
      const next = pending ?? 'idle'
      pending = null
      play(next)
      return pose
    }

    pose = applyBlend(sampleMove(moveId, elapsedMs / move.durationMs), dt)
    return pose
  }

  return {
    play,
    requestMove,
    tick,
    getPose: () => pose,
    getMoveId: () => moveId,
  }
}
