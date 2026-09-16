import { useCallback, useEffect, useRef, useState } from 'react'
import { SmashSurface } from './components/SmashSurface'
import { StartGate } from './components/StartGate'
import {
  onSmashFullscreenChange,
  shouldReclaimOnGesture,
} from './game/fullscreenGuard'
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
 * fullscreen is an enhancement. Keyboard Lock (Chromium) holds single Esc
 * presses while fullscreen. When fullscreen is lost anyway (Safari has no
 * Keyboard Lock; Chromium press-and-hold Esc always exits), we reclaim it —
 * immediately in the fullscreenchange handler when the browser still has
 * transient activation, otherwise on the next key/pointer gesture.
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

  const reclaimFullscreen = useCallback(() => {
    const isFullscreen = Boolean(document.fullscreenElement)
    if (!shouldReclaimOnGesture({ isFullscreen, leaving: leavingRef.current })) {
      return
    }
    void requestFullscreen().then(async (result) => {
      if (leavingRef.current) return
      setFullscreenDenied(result === 'denied')
      if (result === 'ok') await lockSmashKeys()
    })
  }, [])

  useEffect(() => {
    if (mode !== 'smash') return

    const onFullscreenChange = () => {
      const action = onSmashFullscreenChange({
        isFullscreen: Boolean(document.fullscreenElement),
        leaving: leavingRef.current,
      })
      if (action === 'relock') {
        // Chromium only honors the Esc lock while fullscreen — re-engage on
        // every entry so the lock survives fullscreen round-trips.
        void lockSmashKeys()
      } else if (action === 'reclaim') {
        reclaimFullscreen()
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [mode, reclaimFullscreen])

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
        <SmashSurface
          onLeave={leaveSmash}
          onReclaim={reclaimFullscreen}
          glyphMode={DEFAULT_GLYPH_MODE}
        />
      </div>
    )
  }

  return <StartGate onEnter={enterSmash} />
}
