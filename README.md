# 🎮 Flappy Kiro

A browser-based retro endless scroller game inspired by Flappy Bird. Guide Kiro the ghost through an endless stream of pipe obstacles — how far can you get?

## 🕹️ Play Now

**[▶ Play Flappy Kiro](https://karenlauu.github.io/flappy-game/)**

## How to Play

- Press **Space**, **click**, or **tap** to make Kiro flap upward
- Navigate through the gaps between the green pipes
- Hitting a pipe, the floor, or the ceiling ends the game
- Your high score is saved automatically between sessions

## Screenshots

![Flappy Kiro](kiro-introduction-starter-kit/img/example-ui.png)

## Features

- 🎮 Single-file game — no install, no dependencies, opens in any browser
- 👻 Ghost sprite with physics-based tilt animation
- 🎵 Sound effects on flap and game over
- 🏆 Persistent high score saved in browser storage
- 📱 Works on desktop and mobile
- ☁️ Parallax scrolling clouds

## Run Locally

No build step needed — just open the file:

```bash
git clone https://github.com/karenlauu/flappy-game.git
cd flappy-game
open kiro-introduction-starter-kit/index.html
```

## Built With

- Vanilla HTML5, CSS, and JavaScript
- HTML5 Canvas API for rendering
- Web Audio API for sound effects
- AWS CDK + Amplify for cloud hosting (see `infra/`)

## Project Structure

```
├── index.html                          # Root entry point (GitHub Pages)
├── kiro-introduction-starter-kit/
│   ├── index.html                      # Game source
│   └── assets/
│       ├── ghosty.png                  # Kiro sprite
│       ├── jump.wav                    # Flap sound
│       └── game_over.wav              # Game over sound
└── infra/                              # AWS CDK infrastructure
```

## License

See [LICENCE.md](kiro-introduction-starter-kit/LICENCE.md)
