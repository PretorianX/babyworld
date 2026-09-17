import { useCallback, useEffect, useRef, useState } from 'react'
import { createAnimator } from '../doll/animator'
import { PIANO_NUDGE_DEG, createEarthScroll } from '../doll/earthScroll'
import { DEFAULT_POSE, type JointPose } from '../doll/joints'
import { applyOffsets, createGestureBlender } from '../doll/pianoGestures'
import { moveForNote } from '../doll/pianoMoves'
import type { NoteId } from '../doll/pianoNotes'
import { createLeaveGuard, feedLeaveGuard, type LeaveGuardState } from '../game/leaveGuard'
import {
  cancelTrappedKeyEvent,
  shouldTrapSmashKey,
} from '../game/smashKeyBlock'
import { BoyDoll } from './BoyDoll'
import { DollPiano } from './DollPiano'
import { EarthGlobe } from './EarthGlobe'
import { StarfieldBackdrop } from './StarfieldBackdrop'
import { AuroraCanvas, type AuroraRef } from './AuroraCanvas'

type DollStageProps = {
  onLeave: () => void
  onReclaim: () => void
}

export function DollStage({ onLeave, onReclaim }: DollStageProps) {
  const animatorRef = useRef(createAnimator())
  const earthRef = useRef(createEarthScroll())
  const blenderRef = useRef(createGestureBlender())
  const leaveRef = useRef<LeaveGuardState>(createLeaveGuard())
  const onLeaveRef = useRef(onLeave)
  const onReclaimRef = useRef(onReclaim)
  const [pose, setPose] = useState<JointPose>(DEFAULT_POSE)
  const [earthRotationDeg, setEarthRotationDeg] = useState(0)

  const [outfit, setOutfit] = useState<'default' | 'ninja' | 'astronaut'>('default')
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'surprised' | 'cool'>('neutral')
  const auroraRef = useRef<AuroraRef>(null)

  useEffect(() => {
    onLeaveRef.current = onLeave
    onReclaimRef.current = onReclaim
  }, [onLeave, onReclaim])

  useEffect(() => {
    const animator = animatorRef.current
    const earth = earthRef.current
    const blender = blenderRef.current
    leaveRef.current = createLeaveGuard()
    let frame = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = now - last
      last = now
      const basePose = animator.tick(dt)
      const gesture = blender.tick(dt)
      setPose(applyOffsets(basePose, gesture))
      earth.tick(dt, animator.getMoveId())
      setEarthRotationDeg(earth.getRotationDeg())
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    const onKeyDown = (event: KeyboardEvent) => {
      onReclaimRef.current()

      if (shouldTrapSmashKey(event)) {
        cancelTrappedKeyEvent(event)
        return
      }

      const isUnmodifiedLetter =
        !event.repeat &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.length === 1 &&
        /[a-z]/i.test(event.key)

      if (isUnmodifiedLetter) {
        const result = feedLeaveGuard(
          leaveRef.current,
          event.key,
          performance.now(),
        )
        leaveRef.current = result.state
        if (result.matched) {
          onLeaveRef.current()
        }
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (shouldTrapSmashKey(event)) {
        cancelTrappedKeyEvent(event)
      }
    }

    const onPointerDown = () => {
      onReclaimRef.current()
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('pointerdown', onPointerDown, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  const onPianoStrike = useCallback((noteId: NoteId) => {
    const moveId = moveForNote(noteId)
    if (moveId) {
      // Whites chain full dance moves; queued so mash stays smooth.
      animatorRef.current.requestMove(moveId)
    }
    blenderRef.current.strike(noteId)
    earthRef.current.nudge(PIANO_NUDGE_DEG)

    const hues: Record<string, number> = {
      C4: 0, 'C#4': 30, D4: 60, 'D#4': 90, E4: 120, F4: 150, 'F#4': 180,
      G4: 210, 'G#4': 240, A4: 270, 'A#4': 300, B4: 330,
      C5: 0, 'C#5': 30, D5: 60, 'D#5': 90, E5: 120, F5: 150, 'F#5': 180,
      G5: 210,
    }
    const hue = hues[noteId] ?? 0
    const noteKeys = Object.keys(hues)
    const index = noteKeys.indexOf(noteId)
    const left = 10 + (index / noteKeys.length) * 80

    auroraRef.current?.spawn(hue, left)

    const expressions = ['neutral', 'happy', 'surprised', 'cool'] as const
    setExpression(expressions[Math.floor(Math.random() * expressions.length)])
  }, [])

  return (
    <main className="doll-stage">
      <StarfieldBackdrop />
      <header className="doll-stage__header">
        <h1 className="doll-stage__title">Doll</h1>
        <div style={{ display: 'flex', gap: '8px', zIndex: 10, marginLeft: 'auto' }}>
          <button 
            style={{ padding: '4px 12px', background: outfit === 'default' ? '#f7941d' : '#1b263b', color: outfit === 'default' ? '#000' : '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => setOutfit('default')}>Boy</button>
          <button 
            style={{ padding: '4px 12px', background: outfit === 'ninja' ? '#f7941d' : '#1b263b', color: outfit === 'ninja' ? '#000' : '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => setOutfit('ninja')}>Ninja</button>
          <button 
            style={{ padding: '4px 12px', background: outfit === 'astronaut' ? '#f7941d' : '#1b263b', color: outfit === 'astronaut' ? '#000' : '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => setOutfit('astronaut')}>Space</button>
        </div>
      </header>

      <div className="doll-stage__arena" aria-live="polite">
        <AuroraCanvas ref={auroraRef} />
        <div className="doll-stage__world">
          <EarthGlobe
            rotationDeg={earthRotationDeg}
            className="doll-stage__globe"
          />
          <BoyDoll pose={pose} outfit={outfit} expression={expression} className="doll-stage__doll" />
        </div>
        <div className="doll-stage__piano-overlay">
          <DollPiano onStrike={onPianoStrike} />
        </div>
      </div>

      <p className="leave-hint">type leave to exit</p>
    </main>
  )
}
