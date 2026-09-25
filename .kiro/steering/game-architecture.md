# Game Architecture Standards

> This file covers the *why* and *rules* of the overall architecture: how the modules are composed, how events flow, and how the state machine governs execution. For naming conventions see `coding-standards.md`; for Canvas/collision internals see `canvas-and-collision.md`; for the component list see `structure.md`.

---

## Modular System Design

### The Single-File Module Pattern

All game logic lives in one `index.html` file, but is still structured as discrete, independently-testable modules. Each module is an IIFE that owns private state and exposes a minimal public interface.

```
Constants
    │
    ▼
InputHandler  ──────────────────────────────────┐
                                                │
PhysicsEngine ──┐                               ▼
PipeManager  ───┼──▶  Game Loop (RAF)  ──▶  Renderer
CloudManager ───┤          │
CollisionDetector          │
ScoreManager  ──┘          ▼
                       AudioManager
```

Modules are **declared top-to-bottom in dependency order**. A module may only reference modules declared above it. The game loop, declared last, wires everything together.

### Module Responsibilities Are Exclusive

Each module owns one concern and one concern only. No module reaches into another module's private state.

| If you need to… | Do this… | Not this… |
|---|---|---|
| Know Kiro's position | Read `PhysicsEngine.kiro` | Read a global `kiroY` variable |
| Trigger a flap | Call `PhysicsEngine.flap()` | Set `PhysicsEngine.kiro.vy` directly |
| Know if a pipe was cleared | Check `p.scored` in `ScoreManager.update()` | Let `PipeManager` increment the score |
| End the game | Set `gameState = 'GAME_OVER'` in the game loop | Let `CollisionDetector` set `gameState` |

### Pure vs. Stateful Modules

Keep the distinction clear:

**Pure modules** (no side effects beyond their own state, fully unit-testable):
- `PhysicsEngine` — only mutates `kiro.y` and `kiro.vy`
- `PipeManager` — only mutates pipe array entries
- `CloudManager` — only mutates cloud array entries
- `CollisionDetector` — pure function, no state at all
- `ScoreManager` — mutates `score`/`highScore`; side-effects (`localStorage`, `saveHighScore()`) are explicit method calls

**Stateful/side-effectful modules** (require browser environment, harder to unit-test):
- `InputHandler` — reads DOM events
- `AudioManager` — touches Web Audio API
- `Renderer` — writes to Canvas 2D context

Write and test the pure modules first (Tasks 2–7 in the implementation plan). Wire in the side-effectful modules only after the pure core is verified.

### Module Interface Contract

Every module exposes at minimum:
- `reset()` — restores the module to its initial state as if the page just loaded
- A predictable read surface for the game loop (e.g. `kiro`, `pipes`, `clouds`)
- No direct DOM reads/writes except in `InputHandler`, `AudioManager`, and `Renderer`

```js
// Minimal interface contract example
const PhysicsEngine = (() => {
  const kiro = { x: 0, y: 0, vy: 0 };

  return {
    kiro,             // readable by game loop and CollisionDetector
    reset() { ... },
    flap()  { ... },
    update(){ ... },
  };
})();
```

---

## Event Handling Patterns

### One Input Flag, One Consumer

`InputHandler` converts all raw browser events (Space keydown, click, touchstart) into a single boolean flag: `flapPending`. The game loop consumes this flag exactly once per frame via `consumeFlap()`, which reads and immediately clears the flag.

```
[Space / click / touch]
         │
         ▼
  flapPending = true          ← InputHandler sets
         │
         ▼
  consumeFlap() → true        ← Game loop reads and clears
         │
         ▼
  flapPending = false
```

**Rules:**
- Only `InputHandler` sets `flapPending`. No other code touches it.
- Only the game loop calls `consumeFlap()`. Components never call it directly.
- `consumeFlap()` is called **once per frame, unconditionally**, before any state branching. This prevents double-consumption bugs.
- If multiple inputs arrive within a single frame (e.g. two rapid taps), they collapse to a single flap. This is intentional and correct.

### Event Listener Registration

All listeners are registered once at script initialisation, not inside the game loop or component constructors.

```js
// Good — registered once
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') InputHandler._setPending();
});

// Bad — registered every frame or on state change
function gameLoop() {
  document.addEventListener('keydown', handleKey);  // accumulates listeners
}
```

Prevent default scroll behavior on Space to avoid page scroll interference:

```js
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    InputHandler._setPending();
  }
});
```

### Input Gating by Game State

The game loop — not `InputHandler` — decides what a flap *means* based on the current state. `InputHandler` only records that a flap occurred.

```js
const flapped = InputHandler.consumeFlap();

if (gameState === 'START' && flapped) {
  gameState = 'PLAYING';
  PhysicsEngine.flap();
  AudioManager.playJump();
}

if (gameState === 'PLAYING' && flapped) {
  PhysicsEngine.flap();
  AudioManager.playJump();
}

if (gameState === 'GAME_OVER') {
  // flap is ignored entirely — input has no effect
}
```

This means `InputHandler` never needs to know about `gameState`, keeping it fully decoupled.

### Touch Event Handling

Register `touchstart` with `{ passive: false }` so `preventDefault()` can suppress unwanted scroll or zoom on mobile.

```js
document.addEventListener('touchstart', (e) => {
  e.preventDefault();
  InputHandler._setPending();
}, { passive: false });
```

---

## State Machine

### The Three States

```
        ┌─────────────────────────────────────┐
        │                                     │
        ▼                                     │
  ┌──────────┐  first flap   ┌───────────┐   │
  │  START   │ ────────────▶ │  PLAYING  │   │
  └──────────┘               └─────┬─────┘   │
        ▲                          │         │
        │                          │ collision│
        │        flap / click       ▼         │
        └─────────────────── ┌───────────┐   │
                             │ GAME_OVER │───┘
                             └───────────┘
           (GAME_OVER → START resets all components)
```

| State | What runs each frame |
|---|---|
| `START` | Input check only; Renderer draws start overlay |
| `PLAYING` | Full update pipeline; Renderer draws game |
| `GAME_OVER` | Input check only; Renderer draws game-over overlay |

### State Transition Rules

Only the **game loop** transitions `gameState`. No component sets it directly.

| Transition | Trigger | Actions taken |
|---|---|---|
| `START → PLAYING` | First flap | `PhysicsEngine.flap()`, `AudioManager.playJump()` |
| `PLAYING → GAME_OVER` | `CollisionDetector.check()` returns `true` | `AudioManager.playGameOver()`, `ScoreManager.saveHighScore()` |
| `GAME_OVER → START` | Any flap or click | `PhysicsEngine.reset()`, `PipeManager.reset()`, `ScoreManager.reset()` |

There is no `PLAYING → START` direct transition. The game always passes through `GAME_OVER` before resetting.

### Reset Contract

When transitioning from `GAME_OVER` to `START`, every stateful pure module must be reset **before** `gameState` is updated. This ensures that if the Renderer reads state on the same frame as the reset, it sees the freshly initialised values.

```js
// Correct reset order
PhysicsEngine.reset();   // Kiro back to centre, vy = 0
PipeManager.reset();     // pipes repositioned off right edge
ScoreManager.reset();    // score = 0, highScore preserved
gameState = 'START';     // only now flip the state
```

### What Each State Permits

**`START`**
- Renderer draws the background, clouds, pipes (static), Kiro (static), HUD (Score: 0), and the "Tap or press Space to Start" overlay
- Pipes and clouds do **not** scroll
- Physics does **not** apply — Kiro stays at vertical centre
- Flap transitions to `PLAYING` and immediately triggers the first physics flap

**`PLAYING`**
- Full update pipeline runs every frame
- Input flap calls `PhysicsEngine.flap()` and `AudioManager.playJump()`
- Collision detection runs; a `true` result triggers `GAME_OVER` transition immediately — no deferred handling
- Score is updated after collision check (so a final pipe-clear on the death frame is credited)

**`GAME_OVER`**
- Update pipeline is halted — physics, pipes, clouds, and score are all frozen
- Renderer still runs, drawing the frozen game state plus the "Game Over" overlay
- Flap input is consumed but ignored (no state change, no physics)
- A subsequent click/tap after the game-over screen appears triggers the `GAME_OVER → START` reset

---

## Game Loop Architecture

### Canonical Loop Structure

```js
let rafId = null;

function gameLoop() {
  // 1. Consume input (always, before branching)
  const flapped = InputHandler.consumeFlap();

  // 2. State-gated update
  if (gameState === 'START') {
    if (flapped) {
      PhysicsEngine.flap();
      AudioManager.playJump();
      gameState = 'PLAYING';
    }
  } else if (gameState === 'PLAYING') {
    if (flapped) {
      PhysicsEngine.flap();
      AudioManager.playJump();
    }
    PhysicsEngine.update();
    PipeManager.update();
    CloudManager.update();
    if (CollisionDetector.check(PhysicsEngine.kiro, PipeManager.pipes)) {
      AudioManager.playGameOver();
      ScoreManager.saveHighScore();
      gameState = 'GAME_OVER';
    } else {
      ScoreManager.update(PipeManager.pipes, PhysicsEngine.kiro);
    }
  } else if (gameState === 'GAME_OVER') {
    if (flapped) {
      PhysicsEngine.reset();
      PipeManager.reset();
      ScoreManager.reset();
      gameState = 'START';
    }
  }

  // 3. Render unconditionally — every state needs a draw pass
  Renderer.draw(
    gameState,
    PhysicsEngine.kiro,
    PipeManager.pipes,
    CloudManager.clouds,
    ScoreManager.score,
    ScoreManager.highScore
  );

  // 4. Schedule next frame
  rafId = requestAnimationFrame(gameLoop);
}
```

### Initialisation Order

Run these steps once before starting the loop:

```js
// 1. Validate browser support
if (!canvas.getContext) { /* show fallback */ return; }

// 2. Initialise side-effectful modules
AudioManager.init();

// 3. Initialise pure modules
PhysicsEngine.reset();
PipeManager.reset();
ScoreManager.loadHighScore();

// 4. Register input listeners (once)
// ... keydown / click / touchstart ...

// 5. Start the loop
rafId = requestAnimationFrame(gameLoop);
```

Never call `reset()` from inside the loop on first load — the loop starts in `START` state which already assumes reset values.

### Execution Order Within a Frame

The order within `PLAYING` is meaningful and must not be changed:

1. **Input** — consume before physics so a flap is reflected in the same frame it arrives
2. **Physics** — advance Kiro's position
3. **Pipes** — scroll pipes left
4. **Clouds** — scroll clouds left
5. **Collision** — test the *new* positions (post-move) — not the positions from last frame
6. **Score** — only runs if no collision this frame
7. **Render** — draws the final resolved state

Running collision before score ensures a pipe-edge graze that kills Kiro does not also credit the score. Running collision on post-move positions ensures a fast-moving Kiro cannot "tunnel" through a pipe edge without detection.
