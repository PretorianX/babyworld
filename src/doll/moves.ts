import { type PoseId } from './poses'

export type MoveId = 'idle' | 'jump' | 'star' | 'somersault' | 'wave' | 'split' | 'moonwalk' | 'backflip'

export type MoveKeyframe = {
  at: number
  pose: PoseId
}

export type MoveDef = {
  id: MoveId
  durationMs: number
  loop: boolean
  keyframes: MoveKeyframe[]
}

export const MOVES: Record<MoveId, MoveDef> = {
  idle: {
    id: 'idle',
    durationMs: 1600,
    loop: true,
    keyframes: [
      { at: 0, pose: 'idleA' },
      { at: 0.5, pose: 'idleB' },
      { at: 1, pose: 'idleA' },
    ],
  },
  jump: {
    id: 'jump',
    durationMs: 700,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.2, pose: 'crouch' },
      { at: 0.45, pose: 'jumpPeak' },
      { at: 0.75, pose: 'crouch' },
      { at: 1, pose: 'stand' },
    ],
  },
  star: {
    id: 'star',
    durationMs: 800,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.35, pose: 'star' },
      { at: 0.7, pose: 'star' },
      { at: 1, pose: 'stand' },
    ],
  },
  somersault: {
    id: 'somersault',
    durationMs: 1000,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.15, pose: 'crouch' },
      { at: 0.3, pose: 'tuck' },
      { at: 0.85, pose: 'tuckSpin' },
      { at: 1, pose: 'stand' },
    ],
  },
  wave: {
    id: 'wave',
    durationMs: 900,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.2, pose: 'waveUp' },
      { at: 0.4, pose: 'waveDown' },
      { at: 0.6, pose: 'waveUp' },
      { at: 0.8, pose: 'waveDown' },
      { at: 1, pose: 'stand' },
    ],
  },
  split: {
    id: 'split',
    durationMs: 800,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.2, pose: 'jumpPeak' },
      { at: 0.5, pose: 'split' },
      { at: 0.8, pose: 'split' },
      { at: 1, pose: 'stand' },
    ],
  },
  moonwalk: {
    id: 'moonwalk',
    durationMs: 1200,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.2, pose: 'moonwalk1' },
      { at: 0.4, pose: 'moonwalk2' },
      { at: 0.6, pose: 'moonwalk1' },
      { at: 0.8, pose: 'moonwalk2' },
      { at: 1, pose: 'stand' },
    ],
  },
  backflip: {
    id: 'backflip',
    durationMs: 900,
    loop: false,
    keyframes: [
      { at: 0, pose: 'stand' },
      { at: 0.2, pose: 'crouch' },
      { at: 0.5, pose: 'backflipTuck' },
      { at: 0.8, pose: 'backflipLand' },
      { at: 1, pose: 'stand' },
    ],
  },
}

export const PLAYABLE_MOVES: Array<Exclude<MoveId, 'idle'>> = [
  'jump',
  'star',
  'somersault',
  'wave',
  'split',
  'moonwalk',
  'backflip',
]
