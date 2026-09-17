import { useCallback, useEffect, useRef, useState } from 'react'
import { DollStage } from './components/DollStage'
import { SmashSurface } from './components/SmashSurface'
import { StartGate } from './components/StartGate'
import {
  onSmashFullscreenChange,
  shouldReclaimOnGesture,
} from './game/fullscreenGuard'
import { DEFAULT_GLYPH_MODE } from './game/glyphMode'
import { lockSmashKeys, unlockSmashKeys } from './game/keyboardLock'
import { resumeAudio } from './game/soundEngine'

export type AppMode = 'gate' | 'smash' | 'doll'

function isImmersive(mode: AppMode): boolean {
  return mode === 'smash' || mode === 'doll'
}

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
 * Enter immersive activity: CSS shell always covers the viewport; native
 * fullscreen is an enhancement. Keyboard Lock (Chromium) holds single Esc
 * presses while fullscreen. Exit only by typing `leave`.
 */
export default function App() {
  const [mode, setMode] = useState<AppMode>('gate')
  const [fullscreenDenied, setFullscreenDenied] = useState(false)
  const leavingRef = useRef(false)

  useEffect(() => {
    if (!isImmersive(mode)) return

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
    if (!isImmersive(mode)) return

    const onFullscreenChange = () => {
      const action = onSmashFullscreenChange({
        isFullscreen: Boolean(document.fullscreenElement),
        leaving: leavingRef.current,
      })
      if (action === 'relock') {
        void lockSmashKeys()
      } else if (action === 'reclaim') {
        reclaimFullscreen()
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [mode, reclaimFullscreen])

  const enterImmersive = useCallback((next: 'smash' | 'doll') => {
    leavingRef.current = false
    void resumeAudio()
    setMode(next)
    void requestFullscreen().then(async (result) => {
      if (leavingRef.current) return
      if (result === 'denied') {
        setFullscreenDenied(true)
      }
      await lockSmashKeys()
    })
  }, [])

  const leaveImmersive = useCallback(() => {
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
          onLeave={leaveImmersive}
          onReclaim={reclaimFullscreen}
          glyphMode={DEFAULT_GLYPH_MODE}
        />
      </div>
    )
  }

  if (mode === 'doll') {
    return (
      <div
        className="smash-shell doll-shell"
        data-fullscreen-denied={fullscreenDenied ? 'true' : 'false'}
        data-immersive="css"
      >
        <DollStage onLeave={leaveImmersive} onReclaim={reclaimFullscreen} />
      </div>
    )
  }

  return (
    <StartGate
      onEnterSmash={() => enterImmersive('smash')}
      onEnterDoll={() => enterImmersive('doll')}
    />
  )
}
