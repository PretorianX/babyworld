import { describe, expect, it } from 'vitest'
import { createAnimator, lerpPose } from './animator'
import { DEFAULT_POSE, type JointPose } from './joints'
import { MOVES } from './moves'
import { POSES } from './poses'

describe('lerpPose', () => {
  it('returns from at t=0 and to at t=1', () => {
    const from = DEFAULT_POSE
    const to = POSES.star
    expect(lerpPose(from, to, 0)).toEqual(from)
    expect(lerpPose(from, to, 1)).toEqual(to)
  })

  it('interpolates joint angles and root at midpoint', () => {
    const from: JointPose = {
      ...DEFAULT_POSE,
      rootY: 0,
      upperArmL: 0,
    }
    const to: JointPose = {
      ...DEFAULT_POSE,
      rootY: -40,
      upperArmL: 90,
    }
    const mid = lerpPose(from, to, 0.5)
    expect(mid.rootY).toBe(-20)
    expect(mid.upperArmL).toBe(45)
  })
})

describe('createAnimator', () => {
  it('starts on idle and loops while ticking past duration', () => {
    const animator = createAnimator()
    expect(animator.getMoveId()).toBe('idle')
    const idleDuration = MOVES.idle.durationMs
    animator.tick(idleDuration + 1)
    expect(animator.getMoveId()).toBe('idle')
  })

  it('plays a one-shot move then returns to idle', () => {
    const animator = createAnimator()
    animator.play('jump')
    expect(animator.getMoveId()).toBe('jump')

    const jumpDuration = MOVES.jump.durationMs
    animator.tick(jumpDuration)
    expect(animator.getMoveId()).toBe('idle')
  })

  it('interrupts current move when play is called again', () => {
    const animator = createAnimator()
    animator.play('jump')
    animator.tick(50)
    animator.play('wave')
    expect(animator.getMoveId()).toBe('wave')
    animator.tick(MOVES.wave.durationMs * 0.2)
    expect(animator.getMoveId()).toBe('wave')
    expect(animator.getPose().upperArmR).toBeCloseTo(POSES.waveUp.upperArmR, 0)
  })

  it('holds star pose during the middle of the star move', () => {
    const animator = createAnimator()
    animator.play('star')
    animator.tick(MOVES.star.durationMs * 0.5)
    expect(animator.getMoveId()).toBe('star')
    const pose = animator.getPose()
    expect(pose.upperArmL).toBeCloseTo(POSES.star.upperArmL, 0)
    expect(pose.upperLegL).toBeCloseTo(POSES.star.upperLegL, 0)
  })

  it('spreads star arms in the same outward sense as the legs', () => {
    expect(Math.sign(POSES.star.upperArmL)).toBe(Math.sign(POSES.star.upperLegL))
    expect(Math.sign(POSES.star.upperArmR)).toBe(Math.sign(POSES.star.upperLegR))
    expect(POSES.star.upperArmL).toBeGreaterThan(0)
    expect(POSES.star.upperArmR).toBeLessThan(0)
  })

  it('waves the right arm outward beside the body, not across the front', () => {
    expect(POSES.waveUp.upperArmR).toBeLessThan(0)
    expect(POSES.waveDown.upperArmR).toBeLessThan(0)
    expect(POSES.waveUp.lowerArmR).toBeLessThan(POSES.waveDown.lowerArmR)
  })

  it('does not snap the pose when play interrupts mid-move', () => {
    const animator = createAnimator()
    animator.play('star')
    animator.tick(MOVES.star.durationMs * 0.5)
    const before = animator.getPose()

    animator.play('jump')
    animator.tick(16)
    const after = animator.getPose()

    // One 16ms frame after the interrupt the pose must still be near the
    // star pose (crossfade), not teleported to the jump start.
    expect(Math.abs(after.upperArmL - before.upperArmL)).toBeLessThan(20)
  })

  it('queues requestMove while another move is playing', () => {
    const animator = createAnimator()
    animator.requestMove('jump')
    expect(animator.getMoveId()).toBe('jump')

    animator.tick(100)
    animator.requestMove('star')
    // Still finishing jump — star is queued, not an interrupt.
    expect(animator.getMoveId()).toBe('jump')

    animator.tick(MOVES.jump.durationMs)
    expect(animator.getMoveId()).toBe('star')

    animator.tick(MOVES.star.durationMs + 20)
    expect(animator.getMoveId()).toBe('idle')
  })

  it('keeps only the latest queued move', () => {
    const animator = createAnimator()
    animator.requestMove('jump')
    animator.tick(50)
    animator.requestMove('star')
    animator.requestMove('wave')
    animator.tick(MOVES.jump.durationMs)
    expect(animator.getMoveId()).toBe('wave')
  })
})
