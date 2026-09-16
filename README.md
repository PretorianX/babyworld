# BabyWorld

Fullscreen keyboard/touch smash toy with Duck (MailDuck) branding. Funny Web Audio sounds on every keystroke. Exit the game only by typing `leave`.

## Run

```bash
docker compose up --build
```

Open [http://localhost:8010](http://localhost:8010).

Stop with:

```bash
docker compose down
```

## Controls

- Tap **Enter smash** to start (requests fullscreen and unlocks audio).
- Mash the keyboard or tap the screen for glyphs, particles, and silly tones.
- Type **leave** (letters within about 4 seconds) to return to the start gate.
- Escape and common browser/OS exit chords are cancelled in-page when possible; only `leave` returns to the gate.
- On Chromium, smash uses the **Keyboard Lock API** (`navigator.keyboard.lock`) so Esc does not exit native fullscreen. Other browsers fall back to a fixed full-viewport CSS shell (native fullscreen is optional).

Ambient backdrop is a calm MailDuck-colored particle network (navy field, orange/yellow links) — no full-screen palette strobing. Smash glyphs default to mixed letters + emoji.

## Quality checks (development)

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
