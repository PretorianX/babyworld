import type { MoveId } from './moves'

export type DecorationKind = 'tree' | 'house' | 'animal' | 'hill' | 'cloud'

export type EarthDecoration = {
  id: string
  kind: DecorationKind
  angleDeg: number
}

/** Degrees per second while a move is active. */
export const SCROLL_DEG_PER_SEC: Record<MoveId, number> = {
  idle: 6,
  wave: 28,
  star: 48,
  split: 55,
  jump: 72,
  moonwalk: 85,
  somersault: 96,
  backflip: 96,
}

export const EARTH_DECORATIONS: EarthDecoration[] = [
  { id: 'tree-a', kind: 'tree', angleDeg: -12 },
  { id: 'house-a', kind: 'house', angleDeg: 28 },
  { id: 'animal-cow', kind: 'animal', angleDeg: 58 },
  { id: 'hill-a', kind: 'hill', angleDeg: 95 },
  { id: 'tree-b', kind: 'tree', angleDeg: 130 },
  { id: 'cloud-a', kind: 'cloud', angleDeg: 165 },
  { id: 'house-b', kind: 'house', angleDeg: 205 },
  { id: 'animal-sheep', kind: 'animal', angleDeg: 245 },
  { id: 'tree-c', kind: 'tree', angleDeg: 285 },
  { id: 'hill-b', kind: 'hill', angleDeg: 325 },
]

/** Degrees added to earth rotation per piano note strike. */
export const PIANO_NUDGE_DEG = 3.5

/** Fraction of the pending nudge released per second (smooth, no jumps). */
export const NUDGE_RELEASE_PER_SEC = 5

export type EarthScroll = {
  tick: (dtMs: number, moveId: MoveId) => void
  /**
   * Queue a scroll boost (e.g. piano strike). Released gradually by tick so
   * the planet accelerates smoothly instead of jerking per note.
   */
  nudge: (deg: number) => void
  getRotationDeg: () => number
}

export function createEarthScroll(): EarthScroll {
  let rotationDeg = 0
  let pendingDeg = 0

  return {
    tick(dtMs, moveId) {
      const dt = Math.max(0, dtMs)
      if (dt === 0) return
      rotationDeg += (SCROLL_DEG_PER_SEC[moveId] * dt) / 1000

      if (pendingDeg > 0) {
        const released =
          pendingDeg * Math.min(1, (dt / 1000) * NUDGE_RELEASE_PER_SEC)
        rotationDeg += released
        pendingDeg -= released
        if (pendingDeg < 0.001) pendingDeg = 0
      }
    },
    nudge(deg) {
      if (deg <= 0) return
      pendingDeg += deg
    },
    getRotationDeg: () => rotationDeg,
  }
}
