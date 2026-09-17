/**
 * Piano note ids and computer-keyboard mapping for the doll stage.
 *
 * Whites (C4–B4): a s d f g h j
 * Blacks (C#–A#): w e   t y u
 * Upper whites (C5–G5): k l ; ' ]
 * Upper blacks: o p [
 */
export const PIANO_NOTES = [
  'C4',
  'C#4',
  'D4',
  'D#4',
  'E4',
  'F4',
  'F#4',
  'G4',
  'G#4',
  'A4',
  'A#4',
  'B4',
  'C5',
  'C#5',
  'D5',
  'D#5',
  'E5',
  'F5',
  'F#5',
  'G5',
] as const

export type NoteId = (typeof PIANO_NOTES)[number]

export const PIANO_KEY_MAP: Readonly<Record<string, NoteId>> = {
  a: 'C4',
  s: 'D4',
  d: 'E4',
  f: 'F4',
  g: 'G4',
  h: 'A4',
  j: 'B4',
  w: 'C#4',
  e: 'D#4',
  t: 'F#4',
  y: 'G#4',
  u: 'A#4',
  k: 'C5',
  l: 'D5',
  ';': 'E5',
  "'": 'F5',
  o: 'C#5',
  p: 'D#5',
  '[': 'F#5',
  ']': 'G5',
}

/** MIDI note numbers for oscillator tuning (A4 = 440 Hz). */
const MIDI: Record<NoteId, number> = {
  C4: 60,
  'C#4': 61,
  D4: 62,
  'D#4': 63,
  E4: 64,
  F4: 65,
  'F#4': 66,
  G4: 67,
  'G#4': 68,
  A4: 69,
  'A#4': 70,
  B4: 71,
  C5: 72,
  'C#5': 73,
  D5: 74,
  'D#5': 75,
  E5: 76,
  F5: 77,
  'F#5': 78,
  G5: 79,
}

export function frequencyForNote(noteId: NoteId): number {
  return 440 * 2 ** ((MIDI[noteId] - 69) / 12)
}

export function noteIdFromKey(key: string): NoteId | undefined {
  return PIANO_KEY_MAP[key.toLowerCase()]
}

/** Computer-key label drawn on an on-screen piano key (e.g. `a`, `;`). */
export function keyLabelForNote(noteId: NoteId): string | undefined {
  for (const [key, mapped] of Object.entries(PIANO_KEY_MAP)) {
    if (mapped === noteId) return key
  }
  return undefined
}

export type PianoKeyDef = {
  noteId: NoteId
  kind: 'white' | 'black'
  /** White-key column index (0-based), used for black-key placement. */
  whiteIndex: number
}

/** On-screen layout: C4–G5 (about 1.5 octaves). */
export const PIANO_LAYOUT: readonly PianoKeyDef[] = [
  { noteId: 'C4', kind: 'white', whiteIndex: 0 },
  { noteId: 'C#4', kind: 'black', whiteIndex: 0 },
  { noteId: 'D4', kind: 'white', whiteIndex: 1 },
  { noteId: 'D#4', kind: 'black', whiteIndex: 1 },
  { noteId: 'E4', kind: 'white', whiteIndex: 2 },
  { noteId: 'F4', kind: 'white', whiteIndex: 3 },
  { noteId: 'F#4', kind: 'black', whiteIndex: 3 },
  { noteId: 'G4', kind: 'white', whiteIndex: 4 },
  { noteId: 'G#4', kind: 'black', whiteIndex: 4 },
  { noteId: 'A4', kind: 'white', whiteIndex: 5 },
  { noteId: 'A#4', kind: 'black', whiteIndex: 5 },
  { noteId: 'B4', kind: 'white', whiteIndex: 6 },
  { noteId: 'C5', kind: 'white', whiteIndex: 7 },
  { noteId: 'C#5', kind: 'black', whiteIndex: 7 },
  { noteId: 'D5', kind: 'white', whiteIndex: 8 },
  { noteId: 'D#5', kind: 'black', whiteIndex: 8 },
  { noteId: 'E5', kind: 'white', whiteIndex: 9 },
  { noteId: 'F5', kind: 'white', whiteIndex: 10 },
  { noteId: 'F#5', kind: 'black', whiteIndex: 10 },
  { noteId: 'G5', kind: 'white', whiteIndex: 11 },
]

export const WHITE_KEY_COUNT = PIANO_LAYOUT.filter((k) => k.kind === 'white').length
