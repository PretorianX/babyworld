import { describe, expect, it } from 'vitest'
import { DEFAULT_POSE, JOINT_KEYS, ROOT_KEYS, type JointPose } from './joints'
import {
  NOTE_GESTURES,
  applyOffsets,
  createGestureBlender,
  gestureForNote,
} from './pianoGestures'
import { PIANO_KEY_MAP, PIANO_NOTES, type NoteId } from './pianoNotes'

const ALL_POSE_KEYS = [...JOINT_KEYS, ...ROOT_KEYS] as const

function offsetMagnitude(offsets: Partial<JointPose>): number {
  let sum = 0
  for (const key of ALL_POSE_KEYS) {
    const v = offsets[key]
    if (v !== undefined) sum += Math.abs(v)
  }
  return sum
}

describe('PIANO_KEY_MAP / NOTE_GESTURES coverage', () => {
  it('maps every keyboard key to a known piano note', () => {
    for (const noteId of Object.values(PIANO_KEY_MAP)) {
      expect(PIANO_NOTES).toContain(noteId)
    }
  })

  it('provides a gesture target for every mapped note', () => {
    for (const noteId of Object.values(PIANO_KEY_MAP)) {
      const gesture = gestureForNote(noteId)
      expect(gesture).toBeDefined()
      expect(Object.keys(gesture).length).toBeGreaterThan(0)
    }
  })

  it('covers every note in PIANO_NOTES with a gesture', () => {
    for (const noteId of PIANO_NOTES) {
      expect(NOTE_GESTURES[noteId]).toBeDefined()
    }
  })

  it('uses related limbs for nearby whites and flips side across octave', () => {
    const c4 = gestureForNote('C4')
    const d4 = gestureForNote('D4')
    const c5 = gestureForNote('C5')
    expect(c4.upperArmL).toBeDefined()
    expect(d4.upperArmL).toBeDefined()
    expect(c5.upperArmR).toBeDefined()
    expect(c4.upperArmR ?? 0).toBe(0)
  })
})

describe('applyOffsets', () => {
  it('adds partial offsets onto the base pose', () => {
    const base: JointPose = { ...DEFAULT_POSE, upperArmL: 10, rootY: 0 }
    const out = applyOffsets(base, { upperArmL: -40, rootY: -8, torso: 3 })
    expect(out.upperArmL).toBe(-30)
    expect(out.rootY).toBe(-6)
    expect(out.torso).toBe(DEFAULT_POSE.torso + 3)
    expect(out.upperArmR).toBe(base.upperArmR)
  })

  it('does not mutate the base pose', () => {
    const base = { ...DEFAULT_POSE }
    const snapshot = { ...base }
    applyOffsets(base, { head: 9 })
    expect(base).toEqual(snapshot)
  })

  it('clamps gesture translation before applying it to the animated pose', () => {
    const base: JointPose = { ...DEFAULT_POSE, rootX: 4, rootY: -55 }
    const out = applyOffsets(base, { rootX: 1_000, rootY: -1_000 })

    expect(out.rootX).toBe(14)
    expect(out.rootY).toBe(-61)
  })

  it('never introduces non-finite pose values', () => {
    const base = { ...DEFAULT_POSE }
    const out = applyOffsets(base, {
      head: Number.NaN,
      rootX: Number.POSITIVE_INFINITY,
      rootY: Number.NEGATIVE_INFINITY,
    })

    for (const key of ALL_POSE_KEYS) {
      expect(Number.isFinite(out[key])).toBe(true)
    }
  })
})

describe('createGestureBlender', () => {
  it('starts at zero offsets', () => {
    const blender = createGestureBlender()
    expect(offsetMagnitude(blender.getOffsets())).toBe(0)
  })

  it('moves toward the strike target over time without snapping', () => {
    const blender = createGestureBlender({
      approachDegPerSec: 120,
      decayDegPerSec: 0,
    })
    blender.strike('C4')
    const target = gestureForNote('C4')
    const afterSmall = blender.tick(50)
    const arm = afterSmall.upperArmL ?? 0
    expect(arm).not.toBe(0)
    expect(Math.abs(arm)).toBeLessThan(Math.abs(target.upperArmL ?? 0))

    const afterMore = blender.tick(2000)
    expect(afterMore.upperArmL ?? 0).toBeCloseTo(target.upperArmL ?? 0, 0)
  })

  it('decays offsets toward zero after the target is reached', () => {
    const blender = createGestureBlender({
      approachDegPerSec: 10_000,
      decayDegPerSec: 60,
    })
    blender.strike('G4')
    blender.tick(200)
    const peak = offsetMagnitude(blender.getOffsets())
    expect(peak).toBeGreaterThan(0)

    for (let i = 0; i < 40; i++) blender.tick(100)
    expect(offsetMagnitude(blender.getOffsets())).toBeLessThan(peak * 0.25)
  })

  it('blends rapid strikes continuously without NaN or unbounded values', () => {
    const blender = createGestureBlender({
      approachDegPerSec: 180,
      decayDegPerSec: 90,
      maxOffsetDeg: 80,
    })
    const notes = Object.values(PIANO_KEY_MAP) as NoteId[]
    for (let i = 0; i < 80; i++) {
      blender.strike(notes[i % notes.length]!)
      const offsets = blender.tick(16)
      for (const key of ALL_POSE_KEYS) {
        const v = offsets[key]
        if (v === undefined) continue
        expect(Number.isFinite(v)).toBe(true)
        expect(Math.abs(v)).toBeLessThanOrEqual(80)
      }
    }
  })

  it('keeps vertical bounce within six pixels during repeated strikes', () => {
    const blender = createGestureBlender()

    for (let i = 0; i < 300; i++) {
      blender.strike(i % 2 === 0 ? 'B4' : 'G5')
      const rootY = blender.tick(16).rootY ?? 0
      expect(Number.isFinite(rootY)).toBe(true)
      expect(Math.abs(rootY)).toBeLessThanOrEqual(6)
    }
  })

  it('keeps dance-like arm movement while bounding vertical bounce', () => {
    const blender = createGestureBlender()
    blender.strike('A#4')

    let largestArmSwing = 0
    for (let i = 0; i < 20; i++) {
      const offsets = blender.tick(16)
      largestArmSwing = Math.max(
        largestArmSwing,
        Math.abs(offsets.upperArmR ?? 0),
      )
      expect(Math.abs(offsets.rootY ?? 0)).toBeLessThanOrEqual(6)
    }

    expect(largestArmSwing).toBeGreaterThan(8)
  })

  it('keeps offsets finite when frame timing is invalid', () => {
    const blender = createGestureBlender()
    blender.strike('C4')

    for (const dtMs of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const offsets = blender.tick(dtMs)
      for (const key of ALL_POSE_KEYS) {
        const value = offsets[key]
        if (value !== undefined) expect(Number.isFinite(value)).toBe(true)
      }
    }
  })

  it('adds a decaying accent on strike without replacing the blend', () => {
    const blender = createGestureBlender({
      approachDegPerSec: 0,
      decayDegPerSec: 0,
      accentDeg: 12,
      accentDecayDegPerSec: 40,
    })
    blender.strike('A4')
    const justStruck = blender.getOffsets()
    expect(offsetMagnitude(justStruck)).toBeGreaterThan(0)

    for (let i = 0; i < 20; i++) blender.tick(100)
    expect(offsetMagnitude(blender.getOffsets())).toBeLessThan(
      offsetMagnitude(justStruck),
    )
  })

  it('does not stack accents when the same note is mashed', () => {
    const blender = createGestureBlender({
      approachDegPerSec: 0,
      decayDegPerSec: 0,
      accentDeg: 6,
      accentDecayDegPerSec: 0,
    })

    blender.strike('A#4')
    const firstStrike = blender.getOffsets().upperArmR
    for (let i = 0; i < 30; i++) blender.strike('A#4')

    expect(blender.getOffsets().upperArmR).toBe(firstStrike)
  })
})
