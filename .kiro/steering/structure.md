# Project Structure

```
kiro-introduction/
├── index.html                          # The entire game — single deliverable file
├── kiro-introduction-starter-kit/
│   ├── assets/
│   │   ├── ghosty.png                  # Kiro ghost sprite (48×48 render size)
│   │   ├── jump.wav                    # Flap sound effect
│   │   └── game_over.wav              # Game over sound effect
│   ├── img/
│   │   └── example-ui.png             # Reference screenshot of target UI
│   └── README.md                       # Starter kit notes
└── .kiro/
    ├── specs/flappy-kiro/
    │   ├── requirements.md            # Full feature requirements
    │   └── design.md                  # Architecture, component interfaces, data models
    └── steering/                      # AI assistant context files (this folder)
```

## Architecture Inside `index.html`

All game logic is organised into module-like JS objects (IIFE closures) within the single HTML file:

| Component | Responsibility |
|---|---|
| `InputHandler` | Listens for Space / click / touch; exposes `consumeFlap()` |
| `PhysicsEngine` | Kiro position & velocity; applies gravity and flap impulse |
| `PipeManager` | Generates, scrolls, and recycles pipe pairs |
| `CloudManager` | Scrolls background clouds at 0.5× pipe speed (parallax) |
| `CollisionDetector` | AABB collision: Kiro vs pipes, floor, ceiling |
| `ScoreManager` | Tracks score, updates/persists high score via `localStorage` |
| `AudioManager` | Loads and plays sound effects; handles autoplay restrictions silently |
| `Renderer` | Draws all canvas elements each frame in correct layer order |

## Conventions
- All tunable numeric values (speeds, sizes, physics constants) are declared as **named constants at the top of the script** — never use magic numbers inline
- Game state is a single `gameState` variable: `"START" | "PLAYING" | "GAME_OVER"`
- Kiro's `x` position is fixed at `CANVAS_W * 0.25`; only `y` and `vy` change during play
- `localStorage` key for high score: `"flappyKiro_highScore"`
- Kiro hitbox is inset 4 px on each side from the sprite bounds (forgiving collision margins)
- Asset paths use the prefix `kiro-introduction-starter-kit/assets/` — do not change this
