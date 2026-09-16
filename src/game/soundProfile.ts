export type SoundVoice = 'boing' | 'chirp' | 'slide'

export type SoundProfile = {
  voice: SoundVoice
  startHz: number
  endHz: number
  durationMs: number
  gain: number
}

const VOICES: SoundVoice[] = ['boing', 'chirp', 'slide']

export function hashKey(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h
}

export function soundProfileForKey(key: string, variation: number = 0): SoundProfile {
  const h = hashKey(`${key}:${variation}`)
  const voice = VOICES[h % VOICES.length]
  const base = 200 + (h % 480)
  const wobble = 60 + (h % 220)
  const durationMs = 70 + (h % 110)
  const gain = 0.12 + (h % 9) / 100

  switch (voice) {
    case 'boing':
      return { voice, startHz: base, endHz: base + wobble, durationMs, gain }
    case 'chirp':
      return {
        voice,
        startHz: base + wobble * 0.5,
        endHz: Math.max(120, base - wobble * 0.25),
        durationMs: Math.max(55, durationMs - 15),
        gain,
      }
    case 'slide':
      return {
        voice,
        startHz: base + wobble,
        endHz: Math.max(90, base - wobble),
        durationMs: durationMs + 40,
        gain,
      }
  }
}

export function soundProfileForPointer(x: number, y: number, variation: number = 0): SoundProfile {
  return soundProfileForKey(`pointer:${Math.round(x)}:${Math.round(y)}`, variation)
}
