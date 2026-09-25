# Implementation Plan: Flappy Kiro

## Overview

Build a self-contained browser game in a single `kiro-introduction-starter-kit/index.html` file using vanilla HTML, CSS, and JavaScript. The implementation follows a component-by-component approach: constants and scaffolding first, then pure-logic components (physics, pipes, score, collision), then rendering and audio, then wiring the game loop, then property-based tests.

Each task builds directly on the previous ones. No step leaves unintegrated code.

---

## Tasks

- [ ] 1. Create the HTML shell and declare all game constants
  - Create `kiro-introduction-starter-kit/index.html` with a `<canvas id="gameCanvas">` element sized 480×640
  - Add CSS that scales the canvas to fit the viewport via `max-width`/`max-height` and `display: block; margin: auto` with no scrollbars
  - Add a `<noscript>`-style canvas-unsupported fallback: check `canvas.getContext` and replace `document.body.innerHTML` with a "not supported" message if missing
  - Declare all named constants in a `<script>` block: `CANVAS_W`, `CANVAS_H`, `GRAVITY`, `FLAP_VELOCITY`, `PIPE_SPEED`, `PIPE_WIDTH`, `PIPE_CAP_EXTRA`, `GAP_HEIGHT`, `GAP_MIN_Y`, `GAP_MAX_Y`, `PIPE_SPACING`, `CLOUD_SPEED`, `HUD_HEIGHT`, `GHOST_W`, `GHOST_H`, `ASSET_BASE`, `MAX_FALL_VEL`
  - Declare the `gameState` variable initialised to `"START"`
  - _Requirements: 1.1, 1.5, 1.7_

- [ ] 2. Implement InputHandler
  - [ ] 2.1 Implement the InputHandler object
    - Add a `flapPending` boolean; attach `keydown` (Space), `click`, and `touchstart` listeners on the document that set `flapPending = true`
    - Implement `InputHandler.consumeFlap()` — returns current `flapPending` value then resets it to `false`
    - _Requirements: 2.1, 2.2_

- [ ] 3. Implement PhysicsEngine
  - [ ] 3.1 Implement the PhysicsEngine object
    - Define `kiro: { x, y, vy }` where `x` is fixed at `CANVAS_W * 0.25`
    - Implement `reset()`: set `y = CANVAS_H / 2`, `vy = 0`
    - Implement `flap()`: set `vy = FLAP_VELOCITY`
    - Implement `update()`: apply `vy += GRAVITY`, then `y += vy`; do NOT clamp or kill the game here — leave boundary enforcement to CollisionDetector
    - _Requirements: 2.4, 2.5_

  - [ ]* 3.2 Write property test for PhysicsEngine gravity accumulation (Property 1)
    - **Property 1: Gravity accumulates downward velocity across frames**
    - Generate random `vy ∈ [-15, 15]` and `n ∈ [1, 60]`; run `n` physics updates without flap; assert `vy_final === vy_initial + GRAVITY * n` and `y` reflects cumulative displacement
    - **Validates: Requirements 2.5**

  - [ ]* 3.3 Write property test for PhysicsEngine flap impulse (Property 2)
    - **Property 2: Flap always resets velocity to the fixed upward impulse**
    - Generate random `vy ∈ [-20, 20]`; call `flap()`; assert `vy === FLAP_VELOCITY` exactly
    - **Validates: Requirements 2.4**

- [ ] 4. Implement PipeManager
  - [ ] 4.1 Implement the PipeManager object
    - Define `pipes: PipePair[]` where each pair is `{ x, gapCentreY, scored }`
    - Implement `reset()`: initialise two pipe pairs positioned beyond the right edge at `PIPE_SPACING` intervals from `CANVAS_W + PIPE_WIDTH`
    - Implement `update()`: decrement each pipe's `x` by `PIPE_SPEED`; when `x < -PIPE_WIDTH`, recycle — set `x` to the rightmost pipe's `x` plus `PIPE_SPACING`, randomise `gapCentreY` within `[GAP_MIN_Y + GAP_HEIGHT/2, CANVAS_H - GAP_MIN_Y - GAP_HEIGHT/2]`, reset `scored = false`
    - Implement `getTopRect(p)` and `getBottomRect(p)` returning `{ x, y, w, h }` derived rects
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 4.2 Write property test for PipeManager gap bounds and spacing (Property 3)
    - **Property 3: Recycled pipe gap always satisfies position and spacing invariants**
    - Generate 100+ recycle events; assert every `gapCentreY` satisfies `GAP_MIN_Y + GAP_HEIGHT/2 ≤ gapCentreY ≤ CANVAS_H - GAP_MIN_Y - GAP_HEIGHT/2`; assert consecutive pipe centre-to-centre distance is within `[150, 200]` px
    - **Validates: Requirements 3.2, 3.3, 3.4**

  - [ ]* 4.3 Write property test for PipeManager scrolling uniformity (Property 4)
    - **Property 4: Pipe scrolling is constant and uniform**
    - Generate random initial `x` values and `n ∈ [1, 200]` frames (before recycle threshold); assert each pipe's `x` decreases by exactly `PIPE_SPEED * n`
    - **Validates: Requirements 3.1**

- [ ] 5. Implement CloudManager
  - [ ] 5.1 Implement the CloudManager object
    - Initialise 3–4 cloud objects `{ x, y, w, h }` with randomised positions and sizes (`w: 60–120`, `h: 20–40`)
    - Implement `update()`: decrement each cloud's `x` by `CLOUD_SPEED`; when `x + w < 0`, wrap cloud to `x = CANVAS_W + w` with a newly randomised `y`
    - _Requirements: 7.2_

  - [ ]* 5.2 Write property test for CloudManager parallax scrolling (Property 5)
    - **Property 5: Cloud parallax scrolling is always half of pipe speed**
    - Generate random `x ∈ [-100, 600]` and `n ∈ [1, 100]`; run `n` cloud updates (no wrap); assert `x` decreased by exactly `PIPE_SPEED * 0.5 * n`
    - **Validates: Requirements 7.2**

- [ ] 6. Implement CollisionDetector
  - [ ] 6.1 Implement the CollisionDetector object
    - Implement `check(kiro, pipes)`: compute the inset hitbox (`4 px` inset on each side); test AABB intersection against each pipe's `getTopRect` and `getBottomRect`
    - Add floor check: `kiro.y + GHOST_H/2 >= CANVAS_H - HUD_HEIGHT`
    - Add ceiling check: `kiro.y - GHOST_H/2 <= 0`
    - Return `true` on any collision, `false` otherwise
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.2 Write property test for CollisionDetector AABB accuracy (Property 11)
    - **Property 11: AABB collision is accurate for pipes, floor, and ceiling**
    - Generate overlapping Kiro hitbox / pipe rect pairs; assert `check()` returns `true`. Generate non-overlapping pairs (gap ≥ 1 px); assert `false`. Generate Kiro `y` values at/beyond floor and ceiling; assert `true`
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 7. Implement ScoreManager
  - [ ] 7.1 Implement the ScoreManager object
    - Define `score` and `highScore` fields
    - Implement `loadHighScore()`: read `"flappyKiro_highScore"` from `localStorage`; parse with `parseInt(..., 10)`; return `0` if result is `NaN`, negative, or non-finite integer
    - Implement `saveHighScore()`: write `highScore` to `localStorage`
    - Implement `reset()`: set `score = 0`; leave `highScore` unchanged
    - Implement `update(pipes, kiro)`: for each pipe pair where `!p.scored` and `kiro.x > p.x + PIPE_WIDTH`, set `p.scored = true` and increment `score`; if `score > highScore`, update `highScore` and call `saveHighScore()`
    - Call `loadHighScore()` on initialisation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 7.2 Write property test for ScoreManager pipe-clear scoring (Property 6)
    - **Property 6: Score increments exactly once per pipe pair cleared**
    - Generate random pipe pair with `scored = false`, position Kiro past right edge; run one update; assert score incremented by 1 and `scored === true`; run second update; assert score unchanged
    - **Validates: Requirements 5.1**

  - [ ]* 7.3 Write property test for ScoreManager high score maximality (Property 7)
    - **Property 7: High score equals the maximum score across all sessions**
    - Generate random sequences of 1–50 session scores; simulate each session (reset + set score + update high score); assert stored high score equals `Math.max(...scores)`
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 7.4 Write property test for ScoreManager localStorage round-trip (Property 8)
    - **Property 8: High score localStorage round-trip with invalid-value fallback**
    - Generate random non-negative integers; `saveHighScore()` then `loadHighScore()`; assert round-trip identity. Generate invalid values (null, NaN, negative, float, empty string); assert `loadHighScore()` returns `0`
    - **Validates: Requirements 5.4, 5.5, 5.6**

  - [ ]* 7.5 Write property test for ScoreManager reset (Property 9)
    - **Property 9: Score reset always zeroes score while preserving high score**
    - Generate random `(score, highScore)` pairs; call `reset()`; assert `score === 0` and `highScore` unchanged
    - **Validates: Requirements 5.7, 8.5**

- [ ] 8. Checkpoint — pure logic complete
  - Ensure all non-optional tests pass for PhysicsEngine, PipeManager, CloudManager, CollisionDetector, and ScoreManager. Ask the user if questions arise.

- [ ] 9. Implement AudioManager
  - [ ] 9.1 Implement the AudioManager object
    - Implement `init()`: create `Audio` objects for `jump.wav` and `game_over.wav` using `ASSET_BASE`; attach `onerror` handlers that set a `failed` flag per asset
    - Implement `playJump()`: if not failed, set `currentTime = 0` then call `play().catch(() => {})`
    - Implement `playGameOver()`: if not failed, call `play().catch(() => {})`
    - Track a `userInteracted` flag; set it `true` on the first flap call to `playJump()` — this unblocks autoplay without requiring a prior separate interaction
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Implement Renderer
  - [ ] 10.1 Implement the Renderer object — background, clouds, and pipes
    - Implement `draw(state, kiro, pipes, clouds, score, highScore)` with the correct draw order
    - Step 1: fill background with `#a8d8ea`
    - Step 2: draw clouds as white filled ellipses at each cloud's `{ x, y, w, h }`
    - Step 3: draw each pipe's top and bottom rects as filled green (`#5aad3f`) rectangles; draw a slightly darker green (`#3d8c2a`) cap rect (`PIPE_WIDTH + PIPE_CAP_EXTRA * 2` wide, capped at the open end of each pipe)
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 10.2 Implement the Renderer — Kiro sprite with rotation
    - Load the ghost sprite from `ASSET_BASE + "ghosty.png"` via `new Image()`
    - Implement the rotation lerp: `angle = lerp(vy, FLAP_VELOCITY, MAX_FALL_VEL, -Math.PI/6, Math.PI/2)`, clamped to `[-Math.PI/6, Math.PI/2]`
    - Draw Kiro using `ctx.save() / ctx.translate(cx, cy) / ctx.rotate(angle) / ctx.drawImage(...) / ctx.restore()`
    - _Requirements: 7.3, 7.4_

  - [ ]* 10.3 Write property test for Renderer rotation mapping (Property 10)
    - **Property 10: Sprite rotation is bounded and monotonically non-decreasing with velocity**
    - Generate random `vy ∈ [FLAP_VELOCITY, MAX_FALL_VEL]`; compute angle via the lerp/clamp; assert result ∈ `[-Math.PI/6, Math.PI/2]`; pick two random velocities, sort them, verify angles are in the same order (monotone)
    - **Validates: Requirements 7.4**

  - [ ] 10.4 Implement the Renderer — HUD and overlay text
    - Draw the HUD as a dark semi-transparent rect (`rgba(0,0,0,0.45)`) at the bottom of the canvas, `HUD_HEIGHT` px tall; render `"Score: [score] | High: [highScore]"` in at least 16px legible font, centred
    - When `state === "START"`, draw `"Tap or press Space to Start"` centred on the canvas
    - When `state === "GAME_OVER"`, draw `"Game Over"` and `"Tap or press Space to Restart"` centred on the canvas
    - _Requirements: 1.3, 1.4, 7.6, 7.7, 7.8_

- [ ] 11. Wire the game loop and state machine
  - [ ] 11.1 Implement the game loop and state machine
    - Write the `gameLoop()` function driven by `requestAnimationFrame`
    - On each tick: call `InputHandler.consumeFlap()`; branch on `gameState`:
      - `"START"`: if flap consumed → `gameState = "PLAYING"`, call `PhysicsEngine.flap()`, `AudioManager.playJump()`
      - `"PLAYING"`: run `PhysicsEngine.update()`, `PipeManager.update()`, `CloudManager.update()`, `CollisionDetector.check()` — on collision trigger game over (set `gameState = "GAME_OVER"`, call `AudioManager.playGameOver()`, `ScoreManager` high score save); `ScoreManager.update()`
      - `"GAME_OVER"`: if flap consumed → reset all components (`PhysicsEngine.reset()`, `PipeManager.reset()`, `ScoreManager.reset()`), `gameState = "START"`
    - Call `Renderer.draw(...)` unconditionally every tick
    - Start the loop with `requestAnimationFrame(gameLoop)`
    - _Requirements: 1.2, 1.6, 2.3, 2.6, 4.4, 4.5, 4.6, 8.1, 8.2, 8.3, 8.4_

  - [ ] 11.2 Initialise all components and kick off the game
    - Call `AudioManager.init()`, `PhysicsEngine.reset()`, `PipeManager.reset()`, `ScoreManager.loadHighScore()` at script start
    - Verify the canvas-support check fires before the loop starts
    - Call `requestAnimationFrame(gameLoop)` to start
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ] 12. Final checkpoint — full integration
  - Ensure all non-optional tests pass. Open `kiro-introduction-starter-kit/index.html` in a browser and verify: game loads in START state, Kiro is positioned correctly, pipes scroll, scoring works, game over triggers correctly, restart works, high score persists after page refresh. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Each task references specific requirements for traceability
- All components live in a single `<script>` block inside `index.html` — no separate files or build step
- The property-based test suite uses `fast-check` and should be run in a separate test file (e.g., `flappy-kiro.test.js`) with Vitest or Jest; run tests with `--run` flag for single execution
- `kiro-introduction-starter-kit/assets/` already contains `ghosty.png`, `jump.wav`, and `game_over.wav` — no asset creation needed
- Canvas logical resolution is fixed at 480×640; only CSS display size scales to viewport

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["5.2", "6.2", "7.2", "7.3", "7.4", "7.5", "9.1"] },
    { "id": 5, "tasks": ["10.1", "10.2"] },
    { "id": 6, "tasks": ["10.3", "10.4"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2"] }
  ]
}
```
