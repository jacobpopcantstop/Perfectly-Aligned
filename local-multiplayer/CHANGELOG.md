# Changelog - Perfectly Aligned Local Multiplayer

## Version 3.0 (Physical Drawing Edition) - 2026-01-15

### 🎨 Complete Redesign: Paper and Pen Party Game!

**Major Philosophy Change:** Removed ALL digital drawing! Players now draw on real paper with actual pens/pencils. The app purely manages game flow, timing, and scoring.

#### Why Physical Drawing?

1. **Faster Gameplay** - Everyone draws simultaneously (no device passing!)
2. **Better Quality** - Real pens produce better drawings than touchscreens
3. **More Social** - Natural party game experience
4. **True Local Multiplayer** - Everyone participates at once
5. **No Technical Barriers** - Anyone can use paper and pen

### 🎯 What Changed from V2

#### Removed Features
- ❌ Digital canvas (completely removed)
- ❌ Drawing tools (pencil, eraser, colors, brush sizes)
- ❌ Pass-and-play turns (now simultaneous)
- ❌ Drawing submissions/storage
- ❌ Visual judging (no drawings displayed on screen)

#### New Features
- ✅ **Physical Drawing Instructions** - Clear prompts to draw on paper
- ✅ **Simultaneous Drawing** - All non-judge players draw at the same time
- ✅ **Materials Checklist** - Reminds players to have paper and pens ready
- ✅ **Group Timer** - Single countdown for everyone drawing together
- ✅ **Name-Only Judging** - Judge clicks player names (drawings shown physically)
- ✅ **Flexible Timer Options** - 1-3 minutes or manual (no timer)
- ✅ **Simplified Interface** - Focus on game management, not drawing tools

#### Retained Features (from V2)
- ✅ Token spending (re-roll prompts, steal points)
- ✅ Judge's Choice alignment selection
- ✅ Anonymous judging mode
- ✅ Round counter
- ✅ All alignment and prompt systems
- ✅ Scoreboard with steal buttons
- ✅ Input validation

### 📋 How V3 Works

1. **Setup Phase** - Players enter names, app reminds them to grab paper and pens
2. **Judge Phase** - Judge rolls alignment and selects prompt (on screen)
3. **Drawing Phase** - ALL players draw simultaneously on physical paper (timer shows on screen)
4. **Judging Phase** - Players hold up drawings, judge clicks winner's name on screen
5. **Results Phase** - Winner announced, tokens awarded, next round begins

### 🎮 Perfect For

- **Party Games** - Fast, social, natural experience
- **Family Gatherings** - Everyone has paper and pen
- **Casual Play** - No learning curve for drawing tools
- **Large Groups** - Everyone participates simultaneously
- **Traditional Gamers** - Prefer physical materials

### 📦 File Size Comparison

- **V1**: 40KB (digital drawing, pass-and-play)
- **V2**: 60KB (enhanced digital drawing)
- **V3**: 35KB (physical drawing, simpler code!)

---

## Version 2.0 (Enhanced Edition) - 2026-01-15

### 🎉 Major New Features

#### Token Spending System
- **Re-roll Prompts**: Judge can spend 1 token to draw 3 new prompt cards
- **Steal Points**: Any player can spend 3 tokens to steal 1 point from another player
- Steal button appears on scoreboard when player has 3+ tokens
- Modal interface for selecting steal target
- Automatic win detection after stealing

#### Judge's Choice Alignment Selection
- When 'U' (Judge's Choice) is rolled, judge manually selects an alignment
- Interactive alignment grid with character examples
- "Draw Prompts" button disabled until alignment is chosen
- Fixes critical bug where game would hang on Judge's Choice roll

#### Built-in Drawing Timer
- Optional 60-second countdown timer per player
- Large, prominent timer display
- Visual warning (pulsing red) when time is running low (10 seconds)
- Auto-submit when timer reaches zero
- Can be enabled/disabled in setup screen

#### Anonymous Judging Mode
- Optional setting to hide player names during judging phase
- Names appear blurred to prevent bias
- Judge makes decisions based purely on drawing quality
- Can be toggled in setup screen

### 🎨 Drawing Improvements

#### Eraser Tool
- Toggle between pencil and eraser modes
- Eraser is 2x the brush size for efficiency
- Non-destructive erasing (doesn't leave white marks)
- Visual feedback with cursor change

#### Color Palette
- 10 preset colors for quick access (black, red, green, blue, yellow, magenta, cyan, white, orange, purple)
- Click color swatches instead of using color picker
- Selected color highlighted with gold border
- Much faster than HTML5 color picker on all devices

#### Enhanced Line Smoothing
- Quadratic curve interpolation for smoother lines
- No more jagged, pixelated strokes
- Professional-looking drawings
- Better experience on touchscreens

#### Blank Canvas Detection
- Warns user if submitting a blank/empty canvas
- Confirmation dialog prevents accidental empty submissions
- Checks all pixels for any drawing data

### ⚡ UX Enhancements

#### Skip Turn Feature
- "Skip Turn" button allows players to pass without drawing
- Useful if player doesn't want to participate in a round
- Skipped submissions marked in judging phase
- Confirmation dialog prevents accidents

#### Round Counter
- Prominent display of current round number
- Helps players track game progress
- Automatically updates each round

#### Input Validation
- Player count limited to 3-8 with validation
- Player names sanitized (removes HTML tags)
- Maximum name length of 20 characters
- Empty names default to "Player X"
- Deck selection validated (requires at least 1 deck)

#### Improved Confirmations
- Clear canvas confirmation dialog
- Blank submission warning
- Skip turn confirmation
- Re-roll prompt confirmation
- Steal point confirmation with player names

#### Better Button States
- Buttons disable when action is unavailable
- Clear visual feedback for active tools
- Re-roll button shows judge's token count
- Steal buttons only appear for players with 3+ tokens

### 🐛 Bug Fixes

1. **Fixed Judge's Choice**: No longer breaks game when 'U' alignment is rolled
2. **Fixed Canvas Scaling**: Properly handles responsive canvas sizing
3. **Fixed Touch Drawing**: Improved touch event handling for mobile
4. **Fixed Composite Operations**: Eraser properly resets blend mode
5. **Fixed Timer Memory Leak**: Clears interval when switching phases

### 🎯 Code Quality Improvements

- Added input sanitization for player names
- Better error handling with try-catch (where needed)
- Improved canvas coordinate calculation with proper scaling
- Separated rolled alignment from current alignment (for Judge's Choice)
- Better state management for tools and modes
- Cleaner phase transitions

### 📱 Mobile Improvements

- Responsive canvas that scales to screen
- Better touch event handling
- Color palette easier to use than color picker on mobile
- Timer display readable on small screens

### 🎨 Visual Enhancements

- Version badge in header
- New tool button styling
- Color palette with swatches
- Improved modal design
- Better button organization
- Warning state for timer

---

## Version 1.0 (Initial Release) - 2026-01-15

### Initial Features

#### Core Game Mechanics
- 3-8 player local multiplayer
- D&D alignment system (9 alignments + Judge's Choice)
- Turn-based judge rotation
- Point-based scoring (3-7 points to win)
- Token award system (4 token types)

#### Deck System
- 3 themed prompt decks (Core, Creative, Hypothetical)
- 200+ total prompts
- Multiple deck selection
- Shuffled prompt pool

#### Drawing Canvas
- HTML5 Canvas drawing
- Mouse and touch support
- Color picker
- Adjustable brush size (1-30px)
- Undo functionality
- Clear canvas

#### Game Flow
- Setup screen with player names
- Judge selects alignment and prompt
- Sequential pass-and-play drawing
- Judge selects winner
- Token awards
- Round-based gameplay

#### UI/UX
- Responsive grid layouts
- Modern gradient design
- Player cards with scores
- Phase-based interface
- Mobile-friendly

### Known Issues (Fixed in V2)
- Judge's Choice alignment didn't work
- No token spending mechanism
- No timer feature
- Jagged drawing lines
- No eraser tool
- No blank canvas warning
- No skip turn option

---

## Migration Guide: V1 to V2

### Breaking Changes
**None** - V2 is fully backward compatible

### New Features to Enable
1. **Timer**: Check "Enable Drawing Timer" in setup
2. **Anonymous Mode**: Check "Anonymous Judging" in setup

### File Changes
- `index.html` → Use `index-v2.html` for new features
- `game.js` → Use `game-v2.js` for new features
- V1 files remain unchanged and functional

### Recommended Settings
- **First-time players**: Enable timer (keeps game moving)
- **Competitive play**: Enable anonymous judging (reduces bias)
- **Casual play**: Disable both for relaxed gameplay

---

## Future Roadmap (V3 Ideas)

### Planned Features
- [ ] localStorage save/resume game
- [ ] Sound effects for actions
- [ ] Smooth phase transitions (animations)
- [ ] Drawing gallery (view all round submissions)
- [ ] End-game statistics (most tokens, fastest drawer, etc.)
- [ ] Export scoreboard as image
- [ ] Custom prompt creation
- [ ] Keyboard shortcuts
- [ ] Fill bucket tool
- [ ] Text tool
- [ ] Drawing layers

### Under Consideration
- [ ] AI judge mode (for testing)
- [ ] Spectator mode
- [ ] Replay system
- [ ] Achievements system
- [ ] Different game modes (speed round, team play)
- [ ] Prompt difficulty ratings
- [ ] Player profiles with stats

---

**Have feedback or found a bug?** Open an issue on GitHub!
