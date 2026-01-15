# Perfectly Aligned - Local Multiplayer Edition

A single-screen, local multiplayer version of Perfectly Aligned! Play the full game on one device, perfect for parties, family gatherings, or casual play sessions.

## 📦 Versions Available

### 🎨 V3.0 - Physical Drawing Edition ⭐ **RECOMMENDED**
**Files:** `index-v3.html` + `game-v3.js`

🎯 **Draw on REAL paper!** Everyone draws simultaneously with actual pens/pencils while the app manages game flow and timing.

**Perfect for:** Party games, family gatherings, anyone who prefers physical drawing over touchscreens!

**Why V3?**
- ✅ Everyone draws at the same time (much faster!)
- ✅ Better drawing quality (real pens > touchscreen)
- ✅ More social and natural party game experience
- ✅ No device passing or waiting for turns
- ✅ Works great on a TV or projected screen

---

### 💻 V2.0 - Enhanced Digital Drawing
**Files:** `index-v2.html` + `game-v2.js`

Full-featured digital drawing with eraser, color palette, line smoothing, timer, token spending, and more. Pass device to each player for their turn.

**Best for:** Digital-only play, no physical materials available

---

### 📱 V1.0 - Original Release
**Files:** `index.html` + `game.js`

Simple digital drawing version with basic tools. Stable and straightforward.

**Best for:** Minimalists, testing the game

---

**See [CHANGELOG.md](CHANGELOG.md) for complete version comparison and feature details.**

## 🎮 How to Play

> **Note:** Instructions below apply to all versions. V3 (Physical Drawing) uses real paper instead of digital canvas!

### What You Need (V3 Physical Drawing)

Before starting V3, make sure you have:
- 📄 **Paper** for each player (multiple sheets recommended)
- ✏️ **Pens, pencils, or markers** for everyone
- 📱 **A device** to display the app (tablet, laptop, TV, projector)
- 👥 **3-8 players** ready to have fun!

### Setup

1. **Open the Game**:
   - **V3 (Recommended):** Open `index-v3.html` in any browser
   - **V2:** Open `index-v2.html` in any browser
   - **V1:** Open `index.html` in any browser
2. **Set Player Count**: Choose how many players (3-8) will be playing
3. **Enter Player Names**: Type in each player's name
4. **Select Card Decks**:
   - **Core Mix**: Family-friendly scenarios and dilemmas
   - **Creative & Pop Culture**: Lists and pop culture references
   - **Hypothetical & Taboo (17+)**: "What if" scenarios and adult content
5. **Set Target Score**: Choose how many points needed to win (3-7)
6. **Start Game!**: Click the start button to begin

### Game Flow

#### 1. Judge Phase
- One player is designated as the **Judge** each round (rotates every round)
- The Judge's avatar is highlighted with a gold border
- Judge **rolls the alignment** (Lawful/Neutral/Chaotic × Good/Neutral/Evil)
- Judge **draws 3 prompt cards** and selects one

#### 2. Drawing Phase

**V3 (Physical Drawing):**
- 🎨 All **non-judge players** draw **SIMULTANEOUSLY** on physical paper
- ⏱️ Timer displays on screen for everyone to see
- 📝 Everyone draws their interpretation at the same time
- ✅ When done, click "Ready to Judge" button

**V1 & V2 (Digital Drawing):**
- All **non-judge players** take turns drawing on the shared canvas
- **Pass the device** to each player for their turn
- Each player interprets the prompt through the lens of the rolled alignment
- Use the drawing tools:
  - **Color Picker**: Choose your drawing color
  - **Brush Size**: Adjust the thickness of your lines
  - **Clear**: Start over from scratch
  - **Undo**: Remove your last stroke
- Click **Submit Drawing** when done

#### 3. Judging Phase

**V3 (Physical Drawing):**
- 📝 Players hold up or pass around their **physical paper drawings**
- The **Judge** looks at each drawing
- Judge clicks the **player's name** on screen to select winner

**V1 & V2 (Digital Drawing):**
- All submitted drawings are displayed on screen (with player names)
- The **Judge** reviews each drawing
- Judge clicks on their favorite to select the winner

#### 4. Results & Tokens
- The winner gets **1 point** added to their score
- Judge can award **bonus achievement tokens**:
  - 🧠 **Mind Reader**: Close match to Judge's thought
  - 🎨 **Technical Merit**: Exceptional artistic skill
  - ⚖️ **Perfect Alignment**: Brilliant alignment capture
  - 🌀 **Plot Twist**: Surprising/unexpected interpretation
- Tokens can be used for special actions (future feature)

#### 5. Next Round
- Judge role passes to the next player
- Repeat until someone reaches the target score!

### The 9 Alignments

```
           Lawful              Neutral             Chaotic
Good       LG (Superman)       NG (Spider-Man)     CG (Robin Hood)
Neutral    LN (Judge Dredd)    TN (The Watcher)    CN (Jack Sparrow)
Evil       LE (Darth Vader)    NE (Voldemort)      CE (The Joker)
Special    U (Judge's Choice) - Judge picks any alignment
```

## ✨ Features

### Core Features (All Versions)
- ✅ **No Server Required**: Runs entirely in the browser
- ✅ **Single Screen**: Everyone plays on one device
- ✅ **All Game Mechanics**: Complete alignment system, prompts, and scoring
- ✅ **Token System**: Award achievement tokens for exceptional drawings
- ✅ **Multiple Decks**: Choose from 3 themed prompt decks (200+ prompts)
- ✅ **Customizable**: Set player count (3-8) and target score (3-7)
- ✅ **Mobile Friendly**: Works on tablets and phones with touch support

### V3.0 Physical Drawing Features 🎨 **NEW!**
- ✅ **Real Paper Drawing**: Everyone draws on physical paper with pens
- ✅ **Simultaneous Drawing**: All players draw at the same time (much faster!)
- ✅ **Materials Checklist**: Reminds you to have paper and pens ready
- ✅ **Group Timer**: Single countdown visible to everyone (1-3 min or manual)
- ✅ **Token Spending**: Re-roll prompts (1 token) or steal points (3 tokens)
- ✅ **Judge's Choice**: Select alignment when 'U' is rolled
- ✅ **Anonymous Judging**: Hide player names during judging
- ✅ **Round Counter**: See current round at a glance
- ✅ **Simplified Interface**: Focus on game flow, not drawing tools
- ✅ **Works on TV**: Perfect for projecting on large screens

### V2.0 Digital Drawing Features ⭐
- ✅ **Digital Canvas**: Pass-and-play with device drawing
- ✅ **Token Spending**: Re-roll prompts (1 token) or steal points (3 tokens)
- ✅ **Judge's Choice Fixed**: Select alignment when 'U' is rolled
- ✅ **Built-in Timer**: Optional 60-second countdown per player
- ✅ **Eraser Tool**: Non-destructive erasing with dedicated tool
- ✅ **Color Palette**: 10 quick-access colors (faster than color picker)
- ✅ **Line Smoothing**: Professional-quality, smooth drawing strokes
- ✅ **Anonymous Judging**: Hide player names to reduce bias
- ✅ **Skip Turn**: Players can pass if they don't want to draw
- ✅ **Round Counter**: See current round at a glance
- ✅ **Blank Canvas Warning**: Prevents accidental empty submissions
- ✅ **Input Validation**: Sanitized names, validated settings

### V1.0 Basic Features
- ✅ **Simple Digital Drawing**: Basic canvas with color picker
- ✅ **Pass-and-Play**: Turn-based gameplay
- ✅ **Undo/Clear**: Basic drawing controls

## 🎯 Tips for Best Experience

### For V3 (Physical Drawing) - Recommended! 🎨
1. **Have Materials Ready**: Make sure everyone has paper and pens BEFORE starting
2. **Use a Large Screen**: Project on TV or use tablet so everyone can see the timer/prompts
3. **Set Appropriate Timer**: 90 seconds is perfect for most groups, 2-3 minutes for detail lovers
4. **Everyone Draws Together**: Much faster and more exciting than taking turns!
5. **Hold Up Drawings**: When judging, have everyone hold up their drawings at once
6. **Use Multiple Sheets**: Each round uses one sheet - have extras ready
7. **Enable Anonymous Mode**: Makes judging more fair when names are hidden

### For V2 (Digital Drawing) 💻
1. **Use a Tablet or Large Screen**: Makes drawing easier for everyone
2. **Enable Timer**: Keeps game moving, prevents slow players
3. **Use Touch Screen**: For the best drawing experience
4. **Use Eraser**: Fix mistakes without clearing entire drawing

### For All Versions
1. **Read Prompts Aloud**: Judge should announce the prompt so everyone hears it
2. **Be Creative**: There's no "right" answer - have fun with interpretations!
3. **Discuss Submissions**: Talk about each drawing before the Judge picks the winner
4. **Save Tokens**: Spend wisely - 3 tokens can steal a point!
5. **Try Different Decks**: Mix decks for variety, or stick to Core for family-friendly games

## 🔧 Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- HTML5 Canvas support
- Recommended: Touchscreen device for easier drawing

## 🆚 Differences from Online Version

| Feature | Online Version | Local Version |
|---------|---------------|---------------|
| **Connection** | Requires server + Socket.IO | Runs in browser only |
| **Devices** | Host screen + player phones | Single shared device |
| **Drawing** | Simultaneous on phones | Pass-and-play turns |
| **Setup** | Room codes, joining | Direct player name entry |
| **Best For** | Remote parties, large groups | Local gatherings, families |

## 🎨 Drawing Controls

### V1.0 Controls
- **Left Click + Drag** (Desktop): Draw
- **Touch + Drag** (Mobile/Tablet): Draw
- **Color Picker**: Click to choose any color
- **Brush Size Slider**: Adjust from 1px to 20px
- **Clear Button**: Erase entire canvas
- **Undo Button**: Remove last stroke

### V2.0 Controls (Enhanced) ⭐
- **Pencil/Eraser Toggle**: Switch between drawing and erasing
- **Color Palette**: Click color swatches (10 preset colors)
- **Brush Size Slider**: Adjust from 1px to 30px
- **Clear Button**: Erase entire canvas (with confirmation)
- **Undo Button**: Remove last stroke
- **Skip Turn**: Pass without drawing
- **Smooth Lines**: Automatic line smoothing for professional look
- **Timer Display**: See countdown (if enabled)

## 📱 Mobile Support

The local version is fully touch-enabled! Use your finger or stylus to draw on tablets and smartphones. The canvas responds to touch events for smooth drawing.

## 🎉 Game Variations

Try these house rules:

1. **Speed Round**: Set a 30-second timer for drawing
2. **Silent Judge**: Judge can't explain their choice
3. **Double Points**: Certain alignments worth 2 points
4. **Token Challenge**: Players can spend tokens to force prompt re-draws
5. **Team Play**: Play in pairs, with partners alternating Judge role

## 🐛 Troubleshooting

**Drawing not working?**
- Make sure JavaScript is enabled
- Try a different browser
- Check that you've clicked on the canvas before drawing

**Canvas too small?**
- The canvas is 800x600px - best viewed on tablets or desktop
- On mobile, turn landscape for more drawing space

**Game freezing?**
- Refresh the page to restart
- Check browser console for errors (F12)

## 📝 Credits

Based on **Perfectly Aligned** - the online multiplayer party game.

Local multiplayer version created for casual, offline play!

---

**Have fun and stay perfectly aligned!** 🎨⚖️✨
