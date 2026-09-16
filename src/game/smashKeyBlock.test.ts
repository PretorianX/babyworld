import { describe, expect, it } from 'vitest'
import { shouldTrapSmashKey, type SmashKeyEvent } from './smashKeyBlock'

function event(partial: Partial<SmashKeyEvent> & Pick<SmashKeyEvent, 'key'>): SmashKeyEvent {
  return {
    code: partial.code ?? '',
    altKey: partial.altKey ?? false,
    ctrlKey: partial.ctrlKey ?? false,
    metaKey: partial.metaKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    key: partial.key,
  }
}

describe('shouldTrapSmashKey', () => {
  it('traps Escape and fullscreen / browser UI function keys', () => {
    expect(shouldTrapSmashKey(event({ key: 'Escape' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F11' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F12' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F5' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F6' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F1' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F10' }))).toBe(true)
  })

  it('traps Meta/Win/Command and Alt left/right by key or code', () => {
    expect(shouldTrapSmashKey(event({ key: 'Meta', metaKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'OS', code: 'OSLeft' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'Meta', code: 'MetaRight' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'Alt', altKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'Alt', code: 'AltRight' }))).toBe(true)
  })

  it('traps Alt+Tab, Alt+F4, Alt+Space and other Alt combos', () => {
    expect(shouldTrapSmashKey(event({ key: 'Tab', altKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'F4', altKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: ' ', altKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'a', altKey: true }))).toBe(true)
  })

  it('traps Ctrl/Cmd close/new/reload/quit/address shortcuts and DevTools', () => {
    for (const key of ['w', 't', 'n', 'l', 'r', 'q', 'W', 'T']) {
      expect(shouldTrapSmashKey(event({ key, ctrlKey: true }))).toBe(true)
      expect(shouldTrapSmashKey(event({ key, metaKey: true }))).toBe(true)
    }
    expect(shouldTrapSmashKey(event({ key: 'i', ctrlKey: true, shiftKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'j', metaKey: true, shiftKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'c', ctrlKey: true, shiftKey: true }))).toBe(true)
  })

  it('traps Ctrl+Esc and browser navigation keys', () => {
    expect(shouldTrapSmashKey(event({ key: 'Escape', ctrlKey: true }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'BrowserBack' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'BrowserForward' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'BrowserHome' }))).toBe(true)
    expect(shouldTrapSmashKey(event({ key: 'BrowserRefresh' }))).toBe(true)
  })

  it('allows plain smash letters so leave can still be typed', () => {
    for (const key of ['l', 'e', 'a', 'v', 'e', 'q', ' ']) {
      expect(shouldTrapSmashKey(event({ key }))).toBe(false)
    }
    expect(shouldTrapSmashKey(event({ key: 'Enter' }))).toBe(false)
  })
})
