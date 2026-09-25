# Product: Flappy Kiro

Flappy Kiro is a browser-based retro endless scroller game inspired by Flappy Bird. The player controls a ghost character (Kiro) navigating through an infinite series of pipe obstacles.

## Core Gameplay
- Tap, click, or press Space to make Kiro flap upward; gravity pulls it down continuously
- Navigate through gaps between green pipe pairs scrolling from right to left
- Colliding with a pipe, the floor, or the ceiling ends the game
- Score increments each time Kiro clears a pipe pair
- High score is persisted in `localStorage` across sessions

## Key Characteristics
- Runs entirely in a single `index.html` file — no server, no build step, no external dependencies
- Fixed canvas resolution: 480 × 640 px, CSS-scaled to fit the viewport
- Three game states: `START`, `PLAYING`, `GAME_OVER`
- Sketchy/retro visual style: light blue background (`#a8d8ea`), green pipes, white cloud parallax, ghost sprite
- Audio feedback: `jump.wav` on flap, `game_over.wav` on collision
