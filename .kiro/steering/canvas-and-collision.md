# Canvas API, Animation Frames & Collision Detection

> This file goes deep on the *how* of rendering and collision. For naming conventions, component structure, and draw order see `coding-standards.md`.

---

## Canvas API Patterns

### One Context, Acquired Once

Obtain the 2D context a single time at startup and reuse it everywhere. Never call `getContext` inside the game loop or in component methods.

```js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
```

### Pixel-Perfect Positioning

The canvas coordinate system has `(0, 0)` at the top-left. Positive `y` goes **down**. Always express Kiro's position as its **centre point** — offset by half the sprite dimensions when drawing.

```js
// Drawing Kiro centred on (kiro.x, kiro.y)
ctx.drawImage(sprite, kiro.x - GHOST_W / 2, kiro.y - GHOST_H / 2, GHOST_W, GHOST_H);
```

### Transforms: Always Save / Restore

Any call to `translate`, `rotate`, or `scale` accumulates on the context's current transform matrix. Always bracket stateful operations with `save()` / `restore()` — never manually undo transforms.

```js
// Good
ctx.save();
ctx.translate(kiro.x, kiro.y);
ctx.rotate(angle);
ctx.drawImage(sprite, -GHOST_W / 2, -GHOST_H / 2, GHOST_W, GHOST_H);
ctx.restore();

// Bad — manually reversing transforms is error-prone
ctx.translate(kiro.x, kiro.y);
ctx.rotate(angle);
ctx.drawImage(sprite, -GHOST_W / 2, -GHOST_H / 2, GHOST_W, GHOST_H);
ctx.rotate(-angle);          // easy to forget or miscalculate
ctx.translate(-kiro.x, -kiro.y);
```

### fillRect vs clearRect

Use a full-canvas `fillRect` (the sky background) as the implicit clear each frame. `clearRect` is only needed when you want a transparent canvas — this game does not.

```js
// Background fill doubles as the frame clear
ctx.fillStyle = '#a8d8ea';
ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
```

### Drawing Pipes

Each pipe is two filled rectangles: the body and a wider cap at the open end. Compute both from the stored `gapCentreY`.

```js
function drawPipe(p) {
  const topH = p.gapCentreY - GAP_HEIGHT / 2;
  const botY = p.gapCentreY + GAP_HEIGHT / 2;
  const botH = CANVAS_H - botY;
  const capX = p.x - PIPE_CAP_EXTRA;
  const capW = PIPE_WIDTH + PIPE_CAP_EXTRA * 2;

  ctx.fillStyle = '#5aad3f';
  // top body
  ctx.fillRect(p.x, 0, PIPE_WIDTH, topH);
  // bottom body
  ctx.fillRect(p.x, botY, PIPE_WIDTH, botH);

  ctx.fillStyle = '#3d8c2a';          // darker cap colour
  // top cap (at the bottom of the top pipe)
  ctx.fillRect(capX, topH - 12, capW, 12);
  // bottom cap (at the top of the bottom pipe)
  ctx.fillRect(capX, botY, capW, 12);
}
```

### Drawing Clouds

Clouds are filled white ellipses. `ellipse()` is the clearest API; fall back to a scaled `arc()` if you need IE11 support (not required for this project).

```js
function drawCloud(c) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}
```

### Sprite Rotation (Kiro Tilt)

Map vertical velocity to a rotation angle with linear interpolation, then clamp.

```js
function lerp(v, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin));
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

const MAX_FALL_VEL = 15;  // terminal velocity cap (px/frame)

function kiroAngle(vy) {
  const raw = lerp(vy, FLAP_VELOCITY, MAX_FALL_VEL, -Math.PI / 6, Math.PI / 2);
  return clamp(raw, -Math.PI / 6, Math.PI / 2);
}
```

### HUD Rendering

Draw the HUD bar last in each frame so it always appears on top.

```js
function drawHUD(score, highScore) {
  // semi-transparent bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, CANVAS_H - HUD_HEIGHT, CANVAS_W, HUD_HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `Score: ${score} | High: ${highScore}`,
    CANVAS_W / 2,
    CANVAS_H - HUD_HEIGHT / 2
  );
}
```

Always reset `textAlign` and `textBaseline` (or wrap in `save/restore`) if any other drawing code sets them.

---

## Animation Frame Handling

### Loop Structure

The game loop calls itself via `requestAnimationFrame`. The RAF id should be stored so it can be cancelled if needed.

```js
let rafId = null;

function gameLoop() {
  update();
  Renderer.draw();
  rafId = requestAnimationFrame(gameLoop);
}

function startLoop() {
  if (rafId !== null) return;       // guard against double-starts
  rafId = requestAnimationFrame(gameLoop);
}

function stopLoop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}
```

### Frame-Rate Independence

This game runs at a **fixed logical frame rate** (pipe speed and gravity are expressed in px/frame). This keeps physics deterministic and testable without a clock. Do **not** multiply by a `deltaTime` factor — the design intentionally avoids variable timesteps.

Consequence: if the device drops below 60 fps the game will slow down proportionally. This is acceptable for a Flappy Bird clone and keeps the physics model simple.

### Keeping the Loop Running During Non-Playing States

The loop runs continuously through all game states. Rendering the start and game-over overlays requires a running RAF. Only update logic is gated:

```js
function update() {
  const flapped = InputHandler.consumeFlap();

  if (gameState === 'START') {
    if (flapped) gameState = 'PLAYING';
    return;                          // skip physics / collision
  }

  if (gameState === 'GAME_OVER') {
    if (flapped) resetGame();
    return;
  }

  // gameState === 'PLAYING'
  if (flapped) {
    PhysicsEngine.flap();
    AudioManager.playJump();
  }
  PhysicsEngine.update();
  PipeManager.update();
  CloudManager.update();
  if (CollisionDetector.check(PhysicsEngine.kiro, PipeManager.pipes)) {
    gameState = 'GAME_OVER';
    AudioManager.playGameOver();
    ScoreManager.saveHighScore();
  }
  ScoreManager.update(PipeManager.pipes, PhysicsEngine.kiro);
}
```

### Page Visibility

Pause the loop when the browser tab is hidden to avoid pipes advancing while the player cannot see the game.

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else if (gameState === 'PLAYING') startLoop();
});
```

---

## Collision Detection

### AABB (Axis-Aligned Bounding Box)

All collision in this game uses AABB intersection — the simplest and fastest approach for axis-aligned rectangles. Two rects `A` and `B` overlap when **all four** of these hold simultaneously:

```
A.x < B.x + B.w   (A's left edge is left of B's right edge)
A.x + A.w > B.x   (A's right edge is right of B's left edge)
A.y < B.y + B.h   (A's top edge is above B's bottom edge)
A.y + A.h > B.y   (A's bottom edge is below B's top edge)
```

Negating gives the **separation test** — if any one condition is false the rects do not overlap. Either form is equivalent; the separation test is often written as an early-return.

```js
function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
```

### Kiro's Hitbox

The sprite is rendered at `48 × 48` px, but the hitbox is inset by **4 px on every side** to give forgiving collision margins (standard Flappy Bird feel).

```js
function getKiroHitbox(kiro) {
  return {
    x: kiro.x - GHOST_W / 2 + 4,
    y: kiro.y - GHOST_H / 2 + 4,
    w: GHOST_W - 8,
    h: GHOST_H - 8,
  };
}
```

Do not change the hitbox inset without re-validating the feel of the game. Larger insets make the game too forgiving; zero inset feels pixel-punishing.

### Pipe Collision Rects

Derive pipe rects from `PipePair` on the fly — do not store them. Both rects have the same `x` and `w` as the pipe column.

```js
function getTopRect(p) {
  return { x: p.x, y: 0, w: PIPE_WIDTH, h: p.gapCentreY - GAP_HEIGHT / 2 };
}

function getBottomRect(p) {
  const y = p.gapCentreY + GAP_HEIGHT / 2;
  return { x: p.x, y, w: PIPE_WIDTH, h: CANVAS_H - y };
}
```

### Full Collision Check

Test the hitbox against every pipe rect, then test the floor and ceiling. Return `true` on the first hit found.

```js
function check(kiro, pipes) {
  const hb = getKiroHitbox(kiro);

  // Floor: bottom of hitbox reaches HUD top
  if (hb.y + hb.h >= CANVAS_H - HUD_HEIGHT) return true;

  // Ceiling: top of hitbox reaches canvas top
  if (hb.y <= 0) return true;

  // Pipes
  for (const p of pipes) {
    if (aabbOverlap(hb, getTopRect(p))) return true;
    if (aabbOverlap(hb, getBottomRect(p))) return true;
  }

  return false;
}
```

### Broad Phase vs. Narrow Phase

With only two pipe pairs on screen at any time, a broad-phase culling step is unnecessary overhead. The full AABB test on all pipes each frame is fast enough. If the pipe count were ever increased significantly, add an `x`-range pre-check:

```js
// Cheap x-axis cull — skip pipes that cannot possibly overlap Kiro
if (p.x > hb.x + hb.w || p.x + PIPE_WIDTH < hb.x) continue;
```

### Score Detection (Not Collision)

Pipe-clearing is not a collision event — it is a threshold crossing. Check it in `ScoreManager`, not `CollisionDetector`.

```js
// In ScoreManager.update()
for (const p of pipes) {
  if (!p.scored && kiro.x > p.x + PIPE_WIDTH) {
    p.scored = true;
    score++;
  }
}
```

Keeping this separate ensures `CollisionDetector` remains a pure function with no side effects.
