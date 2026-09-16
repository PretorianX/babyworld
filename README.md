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
- Escape may end native fullscreen; the smash surface stays up until `leave`.

## Quality checks (development)

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
