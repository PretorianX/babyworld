import { useCallback, useEffect, useState } from 'react'
import { playPianoNote, resumePianoAudio } from '../doll/pianoAudio'
import {
  PIANO_LAYOUT,
  WHITE_KEY_COUNT,
  keyLabelForNote,
  noteIdFromKey,
  type NoteId,
} from '../doll/pianoNotes'

type DollPianoProps = {
  onStrike: (noteId: NoteId) => void
}

const WHITE_W = 28
const WHITE_H = 96
const BLACK_W = 18
const BLACK_H = 58
const GAP = 2

function whiteX(whiteIndex: number): number {
  return whiteIndex * (WHITE_W + GAP)
}

export function DollPiano({ onStrike }: DollPianoProps) {
  const [active, setActive] = useState<ReadonlySet<NoteId>>(() => new Set())

  const strike = useCallback(
    (noteId: NoteId) => {
      void resumePianoAudio()
      playPianoNote(noteId)
      onStrike(noteId)
      setActive((prev) => {
        const next = new Set(prev)
        next.add(noteId)
        return next
      })
    },
    [onStrike],
  )

  const release = useCallback((noteId: NoteId) => {
    setActive((prev) => {
      if (!prev.has(noteId)) return prev
      const next = new Set(prev)
      next.delete(noteId)
      return next
    })
  }, [])

  useEffect(() => {
    const held = new Set<string>()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const noteId = noteIdFromKey(event.key)
      if (!noteId) return
      if (held.has(event.key.toLowerCase())) return
      held.add(event.key.toLowerCase())
      event.preventDefault()
      strike(noteId)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const noteId = noteIdFromKey(event.key)
      held.delete(event.key.toLowerCase())
      if (!noteId) return
      release(noteId)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [strike, release])

  const width = WHITE_KEY_COUNT * (WHITE_W + GAP) - GAP
  const whites = PIANO_LAYOUT.filter((k) => k.kind === 'white')
  const blacks = PIANO_LAYOUT.filter((k) => k.kind === 'black')

  return (
    <div className="doll-piano" role="group" aria-label="Piano">
      <svg
        className="doll-piano__keys"
        viewBox={`0 0 ${width} ${WHITE_H}`}
        width="100%"
        height="auto"
        aria-hidden="true"
      >
        {whites.map((key) => {
          const x = whiteX(key.whiteIndex)
          const pressed = active.has(key.noteId)
          const label = keyLabelForNote(key.noteId)
          return (
            <g key={key.noteId}>
              <rect
                className={
                  pressed
                    ? 'doll-piano__white doll-piano__white--active'
                    : 'doll-piano__white'
                }
                x={x}
                y={0}
                width={WHITE_W}
                height={WHITE_H}
                rx={4}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  strike(key.noteId)
                }}
                onPointerUp={() => release(key.noteId)}
                onPointerCancel={() => release(key.noteId)}
              />
              {label ? (
                <text
                  className="doll-piano__label doll-piano__label--white"
                  x={x + WHITE_W / 2}
                  y={WHITE_H - 14}
                  textAnchor="middle"
                >
                  {label}
                </text>
              ) : null}
            </g>
          )
        })}
        {blacks.map((key) => {
          const x = whiteX(key.whiteIndex) + WHITE_W + GAP / 2 - BLACK_W / 2
          const pressed = active.has(key.noteId)
          const label = keyLabelForNote(key.noteId)
          return (
            <g key={key.noteId}>
              <rect
                className={
                  pressed
                    ? 'doll-piano__black doll-piano__black--active'
                    : 'doll-piano__black'
                }
                x={x}
                y={0}
                width={BLACK_W}
                height={BLACK_H}
                rx={3}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  e.stopPropagation()
                  strike(key.noteId)
                }}
                onPointerUp={() => release(key.noteId)}
                onPointerCancel={() => release(key.noteId)}
              />
              {label ? (
                <text
                  className="doll-piano__label doll-piano__label--black"
                  x={x + BLACK_W / 2}
                  y={BLACK_H - 10}
                  textAnchor="middle"
                >
                  {label}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
