# Coding Standards

## JavaScript Patterns

### Component Structure (IIFE Module Pattern)
Each game component is a self-contained IIFE that returns a public interface. This keeps state private and makes dependencies explicit.

```js
const ComponentName = (() => {
  // private state
  let privateVar = 0;

  function privateHelper() { /* ... */ }

  return {
    publicMethod() { /* ... */ },
    reset() { /* ... */ },
  };
})();
```

- **Never** attach component state to global variables directly — encapsulate it inside the IIFE
- **Always** return a plain object literal as the public API; keep implementation details private
- Component names are **PascalCase**: `PhysicsEngine`, `PipeManager`, `ScoreManager`, etc.

### Constants
All tunable values live at the top of the `<script>` block, before any component definitions.

```js
// Good — named constant, easy to tune
const PIPE_SPEED = 3;

// Bad — magic number buried in logic
pipes.forEach(p => { p.x -= 3; });
```

- Names are **SCREAMING_SNAKE_CASE**
- Group related constants with a blank line and a comment header
- Derived constants reference their sources: `const CLOUD_SPEED = PIPE_SPEED * 0.5;`

### Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Components / constructors | PascalCase | `PhysicsEngine`, `AudioManager` |
| Constants | SCREAMING_SNAKE_CASE | `FLAP_VELOCITY`, `GAP_HEIGHT` |
| Variables & functions | camelCase | `gapCentreY`, `consumeFlap` |
| Game state values | SCREAMING_SNAKE_CASE string | `"START"`, `"PLAYING"`, `"GAME_OVER"` |
| Boolean flags | `is` / `has` / `scored` prefix where natural | `scored`, `userInteracted` |

### Game State Branching
Gate all update logic on `gameState` using early returns, not nested ifs.

```js
// Good
function update() {
  if (gameState !== "PLAYING") return;
  PhysicsEngine.update();
  // ...
}

// Avoid
function update() {
  if (gameState === "PLAYING") {
    PhysicsEngine.update();
    // deeply nested...
  }
}
```

### Error Handling
- Wrap all `Audio.play()` calls with `.catch(() => {})` — never let audio errors propagate
- Use a `failed` flag on `AudioManager` assets; no-op silently if an asset failed to load
- Validate `localStorage` reads with `parseInt(..., 10)`; fall back to `0` on any invalid value
- Check for Canvas API support before starting the game loop; display a fallback message if absent

---

## Canvas Rendering Guidelines

### Draw Order (Every Frame)
Always draw in this layer order to ensure correct visual stacking:

1. Background fill
2. Clouds
3. Pipes
4. Kiro sprite
5. HUD bar
6. Overlay text (start prompt / game over)

### Context State Isolation
Wrap every stateful draw operation in `save()` / `restore()` to prevent style or transform leakage.

```js
ctx.save();
ctx.translate(cx, cy);
ctx.rotate(angle);
ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
ctx.restore();
```

### No Partial Clears
Always clear (or fully redraw) the entire canvas each frame — never clear only a region. The background fill at step 1 acts as the implicit clear.

---

## Performance Guidelines

### requestAnimationFrame Game Loop
Use `requestAnimationFrame` exclusively for the game loop — never `setInterval` or `setTimeout`.

```js
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

### Object Pooling for Pipes
`PipeManager` recycles existing pipe pair objects rather than creating new ones each time a pipe exits the canvas. Reset `x`, `gapCentreY`, and `scored` in place.

```js
// Good — mutate the existing object
p.x = rightmostX + PIPE_SPACING;
p.gapCentreY = randomGapY();
p.scored = false;

// Bad — allocate a new object every recycle
pipes.push({ x: rightmostX + PIPE_SPACING, gapCentreY: randomGapY(), scored: false });
pipes.shift();
```

### Avoid Per-Frame Allocations
- Do not create arrays, objects, or closures inside the game loop body
- Compute derived rects (`getTopRect`, `getBottomRect`) inline or via a reused scratch object rather than allocating a new `{ x, y, w, h }` per call if it becomes a hot path

### Sprite & Audio Asset Loading
- Load all `Image` and `Audio` objects **once** at startup, before the game loop begins
- Reuse the same `Audio` object per sound; restart playback by resetting `currentTime = 0` rather than creating a new `Audio` instance per play

### Canvas Scaling
Scale the canvas display size with CSS only — keep the logical canvas resolution fixed at `480 × 640`. Never call `canvas.width` / `canvas.height` setters during gameplay, as doing so clears the canvas and resets all context state.

```css
canvas {
  max-width: 100%;
  max-height: 100vh;
  aspect-ratio: 480 / 640;
  display: block;
  margin: auto;
}
```

---

## Code Style

- **Indentation**: 2 spaces
- **Quotes**: single quotes for strings; template literals for interpolation
- **Semicolons**: always present
- **`const` over `let`** for values that never change after assignment; never use `var`
- Keep functions short and single-purpose — if a function needs a comment to explain what it does, consider splitting it
- Comment non-obvious numeric relationships (e.g., why a hitbox is inset by 4 px, why gap centre minimum is `GAP_MIN_Y + GAP_HEIGHT / 2`)
