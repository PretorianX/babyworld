import type { SoundProfile } from './soundProfile'
import { soundProfileForKey, soundProfileForPointer } from './soundProfile'

let audioCtx: AudioContext | null = null
let variation = 0

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export async function resumeAudio(): Promise<void> {
  const ctx = getContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

export function playProfile(profile: SoundProfile): void {
  const ctx = getContext()
  const now = ctx.currentTime
  const duration = profile.durationMs / 1000

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  switch (profile.voice) {
    case 'boing':
      osc.type = 'triangle'
      filter.type = 'lowpass'
      filter.frequency.value = 1800
      break
    case 'chirp':
      osc.type = 'square'
      filter.type = 'bandpass'
      filter.frequency.value = 1200
      filter.Q.value = 3
      break
    case 'slide':
      osc.type = 'sawtooth'
      filter.type = 'lowpass'
      filter.frequency.value = 900
      break
  }

  osc.frequency.setValueAtTime(profile.startHz, now)
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, profile.endHz), now + duration)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playKeySound(key: string): void {
  playProfile(soundProfileForKey(key, variation++))
}

export function playPointerSound(x: number, y: number): void {
  playProfile(soundProfileForPointer(x, y, variation++))
}
