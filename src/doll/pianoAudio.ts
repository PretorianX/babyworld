import { frequencyForNote, type NoteId } from './pianoNotes'

let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

/** Resume Web Audio after a user gesture (required by browsers). */
export async function resumePianoAudio(): Promise<void> {
  const ctx = getContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/**
 * Immediate note-on via a short ADSR triangle tone.
 * Retriggers freely — no global mute.
 */
export function playPianoNote(noteId: NoteId): void {
  const ctx = getContext()
  const now = ctx.currentTime
  const freq = frequencyForNote(noteId)
  const attack = 0.012
  const decay = 0.08
  const sustain = 0.22
  const release = 0.28
  const peak = 0.18
  const sustainLevel = 0.08

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = 'triangle'
  filter.type = 'lowpass'
  filter.frequency.value = 2400
  filter.Q.value = 0.7

  osc.frequency.setValueAtTime(freq, now)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + attack)
  gain.gain.exponentialRampToValueAtTime(sustainLevel, now + attack + decay)
  gain.gain.setValueAtTime(sustainLevel, now + attack + decay + sustain)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + sustain + release)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  const stopAt = now + attack + decay + sustain + release + 0.02
  osc.start(now)
  osc.stop(stopAt)
}
