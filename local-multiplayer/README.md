# Perfectly Aligned - Local Multiplayer Edition

A single-screen, local multiplayer version of Perfectly Aligned! Play the full game on one device, perfect for parties, family gatherings, or casual play sessions.

## 🎮 How to Play

### Setup

1. **Open the Game**: Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge)
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
- All submitted drawings are displayed (with player names)
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

- ✅ **No Server Required**: Runs entirely in the browser
- ✅ **Single Screen**: Everyone plays on one device
- ✅ **Full Drawing Tools**: Color picker, brush sizes, undo, and clear
- ✅ **All Game Mechanics**: Complete alignment system, prompts, and scoring
- ✅ **Token System**: Award achievement tokens for exceptional drawings
- ✅ **Multiple Decks**: Choose from 3 themed prompt decks
- ✅ **Customizable**: Set player count and target score
- ✅ **Mobile Friendly**: Works on tablets and phones with touch support
- ✅ **Pass-and-Play**: Simple turn-based gameplay

## 🎯 Tips for Best Experience

1. **Use a Tablet or Large Screen**: Makes drawing easier for everyone
2. **Set a Timer**: Keep drawing rounds moving (use a phone timer)
3. **Read Prompts Aloud**: Judge should announce the prompt so everyone hears it
4. **Be Creative**: There's no "right" answer - have fun with interpretations!
5. **Discuss Submissions**: Talk about each drawing before the Judge picks the winner
6. **Use Touch Screen**: For the best drawing experience, use a device with a touchscreen

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

- **Left Click + Drag** (Desktop): Draw
- **Touch + Drag** (Mobile/Tablet): Draw
- **Color Picker**: Click to choose any color
- **Brush Size Slider**: Adjust from 1px to 20px
- **Clear Button**: Erase entire canvas
- **Undo Button**: Remove last stroke

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
