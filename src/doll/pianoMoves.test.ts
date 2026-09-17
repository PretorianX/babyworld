import { describe, expect, it } from 'vitest'
import { MOVES } from './moves'
import { MOVE_FOR_NOTE, moveForNote } from './pianoMoves'
import { PIANO_KEY_MAP, PIANO_LAYOUT, PIANO_NOTES } from './pianoNotes'

describe('moveForNote', () => {
  it('maps every white key to a full dance move', () => {
    for (const key of PIANO_LAYOUT) {
      if (key.kind !== 'white') continue
      const moveId = moveForNote(key.noteId)
      expect(moveId, `white ${key.noteId} has a move`).toBeDefined()
      expect(MOVES[moveId!]).toBeDefined()
      expect(moveId).not.toBe('idle')
    }
  })

  it('covers all four playable moves across the whites', () => {
    const used = new Set(
      PIANO_LAYOUT.filter((k) => k.kind === 'white').map(
        (k) => moveForNote(k.noteId)!,
      ),
    )
    expect(used).toContain('jump')
    expect(used).toContain('star')
    expect(used).toContain('somersault')
    expect(used).toContain('wave')
  })

  it('leaves black keys as gesture-only (no full move)', () => {
    for (const key of PIANO_LAYOUT) {
      if (key.kind !== 'black') continue
      expect(moveForNote(key.noteId)).toBeUndefined()
    }
  })

  it('only references known notes', () => {
    for (const noteId of Object.keys(MOVE_FOR_NOTE)) {
      expect(PIANO_NOTES).toContain(noteId)
    }
  })
})

describe('keyboard coverage', () => {
  it('maps every on-screen key to a computer keyboard key', () => {
    const mapped = new Set(Object.values(PIANO_KEY_MAP))
    for (const key of PIANO_LAYOUT) {
      expect(mapped.has(key.noteId), `${key.noteId} has a keyboard key`).toBe(
        true,
      )
    }
  })
})
