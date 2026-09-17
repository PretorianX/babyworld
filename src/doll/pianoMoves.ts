import type { MoveId } from './moves'
import type { NoteId } from './pianoNotes'

/**
 * White keys drive full dance moves (cycled across the keyboard so scales
 * chain different moves); black keys stay gesture-only accents.
 */
export const MOVE_FOR_NOTE: Partial<Record<NoteId, MoveId>> = {
  C4: 'jump',
  D4: 'star',
  E4: 'somersault',
  F4: 'wave',
  G4: 'split',
  A4: 'moonwalk',
  B4: 'backflip',
  C5: 'jump',
  D5: 'star',
  E5: 'somersault',
  F5: 'wave',
  G5: 'split',
}

export function moveForNote(noteId: NoteId): MoveId | undefined {
  return MOVE_FOR_NOTE[noteId]
}
