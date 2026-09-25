# Tech Stack

## Core Technologies
- **Vanilla HTML5, CSS, JavaScript** — no frameworks, no libraries, no transpilation
- **HTML5 Canvas API** — all game rendering via a single `<canvas>` element
- **Web Audio API / `Audio` constructor** — sound effects loaded and played via JS
- **`localStorage`** — high score persistence

## Constraints
- Zero external runtime dependencies
- No build step required — `index.html` opens directly in any modern browser
- All game logic lives in a single `index.html` file

## Testing
The pure-logic components (physics, pipes, collision, scoring) are designed to be testable without a DOM or Canvas API.

- **Unit/property tests**: Jest or Vitest + [fast-check](https://github.com/dubzzz/fast-check) for property-based testing
- **Minimum 100 iterations** per property-based test
- **Integration/visual checks**: Manual smoke tests in Chrome, Firefox, and Safari

### Common Commands
```bash
# If a test runner is set up (Vitest example)
npx vitest --run       # single-pass unit/property tests (no watch mode)

# Open the game directly — no dev server needed
open index.html
```

## Asset Paths
Assets are referenced relative to `index.html`'s own location, so the path is simply `assets/`:
- `assets/ghosty.png` — Kiro sprite
- `assets/jump.wav` — flap sound
- `assets/game_over.wav` — game over sound

> The `ASSET_BASE` constant in `index.html` is `'assets/'`. Do not change it to a longer path — when `index.html` is opened directly as a `file://` URL, relative paths resolve from its own directory.
