import { useCallback, useEffect, useRef, useState } from 'react'
import { SmashSurface } from './components/SmashSurface'
import { StartGate } from './components/StartGate'
import { DEFAULT_GLYPH_MODE } from './game/glyphMode'
import { lockSmashKeys, unlockSmashKeys } from './game/keyboardLock'
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

/**
 * Enter immersive smash: CSS shell always covers the viewport; native
 * fullscreen is an enhancement. Keyboard Lock (Chromium) holds Esc so the
 * browser never drops fullscreen — we do not reclaim via fullscreenchange
 * (that flicker gap is the bug).
 */
export default function App() {
  const [mode, setMode] = useState<AppMode>('gate')
  const [fullscreenDenied, setFullscreenDenied] = useState(false)
  const leavingRef = useRef(false)

  useEffect(() => {
    if (mode !== 'smash') return

    document.body.classList.add('smash-active')
    document.documentElement.classList.add('smash-active')

    return () => {
      document.body.classList.remove('smash-active')
      document.documentElement.classList.remove('smash-active')
    }
  }, [mode])

  const enterSmash = useCallback(() => {
    leavingRef.current = false
    void resumeAudio()
    // Mount CSS immersive shell immediately — never wait on fullscreen.
    setMode('smash')
    void requestFullscreen().then(async (result) => {
      if (leavingRef.current) return
      if (result === 'denied') {
        setFullscreenDenied(true)
      }
      // Keyboard Lock requires a user gesture + (typically) fullscreen in Chromium.
      await lockSmashKeys()
    })
  }, [])

  const leaveSmash = useCallback(() => {
    leavingRef.current = true
    unlockSmashKeys()
    setFullscreenDenied(false)
    setMode('gate')
    void exitFullscreenQuietly()
  }, [])

  if (mode === 'smash') {
    return (
      <div
        className="smash-shell"
        data-fullscreen-denied={fullscreenDenied ? 'true' : 'false'}
        data-immersive="css"
      >
        <SmashSurface onLeave={leaveSmash} glyphMode={DEFAULT_GLYPH_MODE} />
      </div>
    )
  }

  return <StartGate onEnter={enterSmash} />
}
