# Requirements Document

## Introduction

Flappy Kiro is a browser-based retro endless scroller game inspired by Flappy Bird. The player controls a ghost character named Kiro, navigating through an infinite series of pipe obstacles. The game runs entirely in HTML, CSS, and JavaScript — no server required. It features a sketchy/retro visual style with a blue background, green pipes, floating clouds, and a ghost sprite. Sound effects play on jump and game over events. The player's score increments with each pipe pair cleared, and a persistent high score is tracked and shown on screen.

## Glossary

- **Game**: The browser-based Flappy Kiro application running in a single HTML file.
- **Kiro**: The ghost character sprite controlled by the player.
- **Pipe**: A vertical green obstacle consisting of a top pipe and a bottom pipe with a gap between them.
- **Gap**: The open vertical space between a top pipe and a bottom pipe that Kiro must fly through.
- **Gravity**: The constant downward acceleration applied to Kiro during gameplay.
- **Flap**: The upward velocity impulse applied to Kiro when the player triggers the jump input.
- **Score**: The count of pipe pairs Kiro has successfully passed through in the current game session.
- **High_Score**: The highest Score achieved across all game sessions, persisted in browser local storage.
- **Game_Loop**: The recurring update cycle that advances physics, scrolls pipes, detects collisions, and redraws the canvas.
- **Canvas**: The HTML5 `<canvas>` element on which all game visuals are rendered.
- **HUD**: The heads-up display bar at the bottom of the screen showing Score and High_Score.
- **Renderer**: The component responsible for drawing all visual elements on the Canvas each frame.
- **Physics_Engine**: The component responsible for applying Gravity to Kiro and updating Kiro's position each frame.
- **Input_Handler**: The component responsible for detecting player input (click, tap, spacebar) and triggering a Flap.
- **Collision_Detector**: The component responsible for detecting when Kiro intersects a Pipe, the floor, or the ceiling.
- **Pipe_Manager**: The component responsible for generating, scrolling, and recycling Pipe pairs.
- **Score_Manager**: The component responsible for incrementing Score and persisting High_Score.
- **Audio_Manager**: The component responsible for playing sound effects.

---

## Requirements

### Requirement 1: Game Initialization

**User Story:** As a player, I want the game to load and display a start state in my browser, so that I can begin playing without any installation.

#### Acceptance Criteria

1. THE Game SHALL run entirely in a single HTML file, using only vanilla HTML, CSS, and JavaScript with no external dependencies or server.
2. WHEN the Game is loaded in a browser, THE Renderer SHALL display the Canvas with the blue sketchy background, floating clouds, Kiro centered vertically and horizontally at the left third of the Canvas, and at least one pipe pair visible on the right side of the Canvas.
3. WHEN the Game is loaded in a browser, THE HUD SHALL display "Score: 0 | High: [High_Score]" at the bottom of the Canvas, where [High_Score] is "0" on first load with no stored score.
4. WHEN the Game is loaded in a browser, THE Game SHALL display a start prompt overlaid on the Canvas that includes instructions to tap or press Space to start, remaining visible until the player provides input.
5. THE Canvas SHALL have a fixed resolution of 480 × 640 pixels and scale to fit the browser viewport while preserving its aspect ratio, with no scrollbars displayed.
6. WHEN the Game is loaded in a browser, THE Game SHALL be in a paused state where Kiro does not move and pipes do not scroll until the player triggers the start input.
7. IF a browser does not support the HTML5 Canvas API, THEN THE Game SHALL display a message indicating that the browser is not supported.

---

### Requirement 2: Player Input and Flap Mechanics

**User Story:** As a player, I want to control Kiro by tapping, clicking, or pressing the spacebar, so that I can navigate through the pipes.

#### Acceptance Criteria

1. WHEN the player presses the spacebar, THE Input_Handler SHALL trigger a Flap.
2. WHEN the player clicks or taps the Canvas, THE Input_Handler SHALL trigger a Flap.
3. WHEN a Flap is triggered and the Game is in the start state, THE Game SHALL transition to the active playing state and begin the Game_Loop.
4. WHEN a Flap is triggered during active gameplay, THE Physics_Engine SHALL set Kiro's vertical velocity to a fixed upward impulse value that is identical for every Flap event and results in Kiro visibly moving upward on the next rendered frame.
5. WHILE Kiro is in active gameplay, THE Physics_Engine SHALL apply Gravity to Kiro's vertical velocity each frame such that Kiro's downward speed increases with each successive frame when no Flap is triggered.
6. WHEN a Flap is triggered while the Game is in the game over state, THE Input_Handler SHALL ignore the input and not trigger any state change or physics update.

---

### Requirement 3: Pipe Generation and Scrolling

**User Story:** As a player, I want an endless stream of pipe obstacles to appear from the right, so that the game presents a continuous challenge.

#### Acceptance Criteria

1. WHILE the Game is in the active playing state, THE Pipe_Manager SHALL continuously scroll all Pipes from right to left at a constant speed between 2 and 4 pixels per frame.
2. WHEN a Pipe pair exits the left edge of the Canvas, THE Pipe_Manager SHALL recycle it by repositioning it at least one pipe-width beyond the right edge of the Canvas with a newly randomized Gap vertical position.
3. THE Pipe_Manager SHALL maintain a fixed horizontal center-to-center spacing of 150–200 pixels between consecutive Pipe pairs such that at least one Pipe pair is always visible on screen.
4. THE Pipe_Manager SHALL randomize the vertical center of each Gap to a height of 120–160 pixels with its center positioned at least 60 pixels from the top and bottom edges of the Canvas.
5. THE Pipe_Manager SHALL render each Pipe as a green rectangle 40–60 pixels wide with a cap that is at least 1.25× the pipe width, positioned at the open end of each pipe.
6. THE Pipe_Manager SHALL set each pipe rectangle's width to 40–60 pixels.

---

### Requirement 4: Collision Detection and Game Over

**User Story:** As a player, I want the game to end when Kiro hits a pipe, the floor, or the ceiling, so that the game has meaningful consequences for mistakes.

#### Acceptance Criteria

1. WHEN Kiro's bounding box intersects the bounding box of any individual top or bottom pipe rectangle (excluding the gap area), THE Collision_Detector SHALL trigger a game over event.
2. WHEN Kiro's vertical position causes Kiro's bottom edge to reach or exceed the floor boundary of the Canvas, THE Collision_Detector SHALL trigger a game over event.
3. WHEN Kiro's vertical position causes Kiro's top edge to reach or go above the ceiling boundary of the Canvas, THE Collision_Detector SHALL trigger a game over event.
4. WHEN a game over event is triggered, THE Audio_Manager SHALL play the `game_over.wav` sound effect.
5. WHEN a game over event is triggered, THE Game SHALL transition to the game over state and halt the Game_Loop.
6. WHEN the Game is in the game over state, THE Renderer SHALL display a "Game Over" message centered on the Canvas and a prompt consistent with Requirement 8 (spacebar or tap/click to restart).

---

### Requirement 5: Scoring

**User Story:** As a player, I want my score to increase as I pass through pipes and my best score to be saved, so that I have a goal to beat.

#### Acceptance Criteria

1. WHEN Kiro's horizontal position passes the right edge of a Pipe pair's Gap (i.e., Kiro has fully cleared that pair), THE Score_Manager SHALL increment the Score by 1.
2. WHEN the Score is incremented, THE HUD SHALL update to reflect the new Score value within 1 rendered frame (within 16 ms).
3. WHEN a game over event is triggered and the current Score exceeds the stored High_Score, THE Score_Manager SHALL update the High_Score to equal the current Score.
4. THE Score_Manager SHALL persist the High_Score to browser local storage so that it survives page refreshes.
5. WHEN the Game is loaded, THE Score_Manager SHALL read the High_Score from browser local storage and display it alongside the current Score in the HUD.
6. IF the High_Score value in local storage is missing or is not a valid non-negative integer, THEN THE Score_Manager SHALL initialize the High_Score to 0.
7. WHEN a new game session begins (restart), THE Score_Manager SHALL reset the Score to 0 while preserving the High_Score.

---

### Requirement 6: Sound Effects

**User Story:** As a player, I want audio feedback when I flap and when the game ends, so that the game feels responsive and alive.

#### Acceptance Criteria

1. WHEN a Flap is triggered WHILE the Game is in the active playing state, THE Audio_Manager SHALL play the `jump.wav` sound effect; IF a previous instance of `jump.wav` is still playing, THE Audio_Manager SHALL restart it from the beginning rather than blocking playback.
2. WHEN a game over event is triggered, THE Audio_Manager SHALL play the `game_over.wav` sound effect.
3. IF the browser prevents autoplay of audio before user interaction, THEN THE Audio_Manager SHALL treat the very first Flap input as the qualifying user interaction event; WHEN that first Flap occurs, THE Audio_Manager SHALL unblock audio and play `jump.wav` immediately on that same flap without requiring a separate prior interaction.
4. THE Audio_Manager SHALL load sound assets from the relative path `kiro-introduction-starter-kit/assets/` within the project directory.
5. IF a sound asset fails to load, THEN THE Audio_Manager SHALL silently suppress the error and continue gameplay without audio for that asset.

---

### Requirement 7: Visual Style and Rendering

**User Story:** As a player, I want the game to look like a sketchy retro game with a ghost character, so that it has a distinct and appealing aesthetic.

#### Acceptance Criteria

1. THE Renderer SHALL draw a light blue background (hex #a8d8ea or visually equivalent) on the Canvas each frame.
2. THE Renderer SHALL draw at least three white cloud shapes at varying horizontal positions in the background layer, scrolling them at 0.5× pipe scroll speed to create a parallax effect.
3. THE Renderer SHALL draw Kiro using the sprite image at `kiro-introduction-starter-kit/assets/ghosty.png`, centered on Kiro's logical position.
4. THE Renderer SHALL rotate the Kiro sprite according to Kiro's current vertical velocity using two separate linear scale factors: WHEN vertical velocity is zero, THE Renderer SHALL render Kiro at 0° rotation; WHEN vertical velocity is at its maximum upward value, THE Renderer SHALL render Kiro at −30°; WHEN vertical velocity is at its maximum downward value, THE Renderer SHALL render Kiro at +90°.
5. THE Renderer SHALL draw all Pipes as filled green rectangles with a slightly darker green cap rectangle at the open end of each pipe.
6. THE HUD SHALL be rendered as a dark semi-transparent bar at the bottom of the Canvas, displaying "Score: [Score] | High: [High_Score]" in a legible font of at least 16px.
7. WHEN the Game is in the start state, THE Renderer SHALL display "Tap or press Space to Start" centered on the Canvas.
8. WHEN the Game is in the game over state, THE Renderer SHALL display "Game Over" and "Tap or press Space to Restart" centered on the Canvas.

---

### Requirement 8: Game Restart

**User Story:** As a player, I want to restart the game immediately after a game over, so that I can try to beat my high score without reloading the page.

#### Acceptance Criteria

1. WHEN the Game is in the game over state and the player presses the spacebar, THE Game SHALL transition to the start state and reset all game entities (Kiro position, Pipe positions, Score).
2. WHEN the Game is in the game over state and the player clicks or taps the Canvas, THE Game SHALL transition to the start state and reset all game entities.
3. WHEN the Game resets, THE Pipe_Manager SHALL reposition all Pipes to their initial layout, placing the first pipe pair at least one Canvas-width to the right of the Canvas left edge.
4. WHEN the Game resets, THE Physics_Engine SHALL reset Kiro's position to the vertical center of the Canvas and set Kiro's velocity to zero.
5. WHEN the Game resets, THE Score_Manager SHALL reset the Score to 0 and preserve the High_Score.
