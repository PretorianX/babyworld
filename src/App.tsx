import { useCallback, useEffect, useState } from 'react'
import { SmashSurface } from './components/SmashSurface'
import { StartGate } from './components/StartGate'
import {
  DEFAULT_GLYPH_MODE,
  cycleGlyphMode,
  type GlyphMode,
} from './game/glyphMode'
import { resumeAudio } from './game/soundEngine'

export type AppMode = 'gate' | 'smash'

async function requestFullscreen(): Promise<'ok' | 'denied'> {
  if (document.fullscreenElement) return 'ok'
  try {
    await document.documentElement.requestFullscreen()
    return 'ok'
  } catch {
    return 'denied'
  }
}

async function exitFullscreenQuietly(): Promise<void> {
  if (!document.fullscreenElement) return
  try {
    await document.exitFullscreen()
  } catch {
    // Browser may already have left fullscreen.
  }
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('gate')
  const [fullscreenDenied, setFullscreenDenied] = useState(false)
  const [glyphMode, setGlyphMode] = useState<GlyphMode>(DEFAULT_GLYPH_MODE)

  useEffect(() => {
    if (mode !== 'smash') return

    document.body.classList.add('smash-active')

    const onFullscreenChange = () => {
      // Display-only: never return to gate when native fullscreen ends.
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.body.classList.remove('smash-active')
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [mode])

  const enterSmash = useCallback(() => {
    void resumeAudio()
    void requestFullscreen().then((result) => {
      if (result === 'denied') {
        setFullscreenDenied(true)
      }
    })
    setMode('smash')
  }, [])

  const leaveSmash = useCallback(() => {
    void exitFullscreenQuietly()
    setFullscreenDenied(false)
    setMode('gate')
  }, [])

  const onCycleGlyphMode = useCallback(() => {
    setGlyphMode((current) => cycleGlyphMode(current))
  }, [])

  if (mode === 'smash') {
    return (
      <div className="smash-shell" data-fullscreen-denied={fullscreenDenied ? 'true' : 'false'}>
        <SmashSurface onLeave={leaveSmash} glyphMode={glyphMode} />
      </div>
    )
  }

  return (
    <StartGate
      onEnter={enterSmash}
      glyphMode={glyphMode}
      onCycleGlyphMode={onCycleGlyphMode}
    />
  )
}
