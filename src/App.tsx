import { useCallback, useEffect, useRef, useState } from 'react'
import { SmashSurface } from './components/SmashSurface'
import { StartGate } from './components/StartGate'
import { DEFAULT_GLYPH_MODE } from './game/glyphMode'
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
  const leavingRef = useRef(false)

  useEffect(() => {
    if (mode !== 'smash') return

    document.body.classList.add('smash-active')

    const onFullscreenChange = () => {
      if (leavingRef.current) return
      if (document.fullscreenElement) return
      // Kids mash Esc; browsers may still drop native fullscreen — reclaim it.
      void requestFullscreen().then((result) => {
        if (leavingRef.current) return
        if (result === 'denied') setFullscreenDenied(true)
      })
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.body.classList.remove('smash-active')
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [mode])

  const enterSmash = useCallback(() => {
    leavingRef.current = false
    void resumeAudio()
    void requestFullscreen().then((result) => {
      if (result === 'denied') {
        setFullscreenDenied(true)
      }
    })
    setMode('smash')
  }, [])

  const leaveSmash = useCallback(() => {
    leavingRef.current = true
    setFullscreenDenied(false)
    setMode('gate')
    void exitFullscreenQuietly()
  }, [])

  if (mode === 'smash') {
    return (
      <div className="smash-shell" data-fullscreen-denied={fullscreenDenied ? 'true' : 'false'}>
        <SmashSurface onLeave={leaveSmash} glyphMode={DEFAULT_GLYPH_MODE} />
      </div>
    )
  }

  return <StartGate onEnter={enterSmash} />
}
