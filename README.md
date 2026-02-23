# Perfectly Aligned

**The creative drawing game for ethically dubious people!**

A Jackbox-style online multiplayer party game where players compete to create the best interpretation of prompts through the lens of D&D alignment. One player hosts the game on a main screen (TV/projector), while others join using their phones or devices.

## How to Play

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Host a game:** Open `http://localhost:3000/host` on your main screen (TV/projector)

4. **Players join:** Go to `http://localhost:3000/play` on phones/tablets and enter the room code

### Game Flow

1. **Setup:** The host creates a room and gets a 4-letter code. Players join using this code.

2. **Each Round:**
   - A rotating **Judge** rolls a random **alignment** (Lawful Good, Chaotic Evil, etc.)
   - The Judge draws 3 **prompt cards** and picks one
   - All other players have limited time to **draw** their interpretation
   - The Judge reviews submissions and picks the **winner**
   - Optional **tokens** can be awarded for special achievements

3. **Winning:** First player to reach the target score wins!

### Special Mechanics

- **Tokens:** Can be spent on re-rolling prompts (1 token) or stealing points from other players (3 tokens)
- **Judge's Choice:** Rolling "U" lets the Judge pick any alignment they want

## Alignment System

| Row | Lawful | Neutral | Chaotic |
|-----|--------|---------|---------|
| Good | LG (Superman) | NG (Spider-Man) | CG (Robin Hood) |
| Neutral | LN (Judge Dredd) | TN (The Watcher) | CN (Jack Sparrow) |
| Evil | LE (Darth Vader) | NE (Voldemort) | CE (The Joker) |

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** Vanilla JavaScript, HTML5 Canvas
- **Real-time:** WebSocket connections for instant updates

## Project Structure

```
Perfectly-Aligned/
├── server/                 # Backend
│   ├── index.js           # Express + Socket.IO server
│   └── game/
│       ├── GameManager.js # Manages all rooms
│       ├── Room.js        # Individual game room logic
│       └── constants.js   # Game data
├── public/                 # Frontend
│   ├── host/              # Host/main screen view
│   ├── player/            # Player phone controller
│   ├── shared/            # Shared styles/scripts
│   └── assets/            # Images, audio
└── package.json
```

## Development

```bash
# Run with auto-restart on changes
npm run dev

# Standard run
npm start
```

### Environment Variables

Copy `.env.example` and configure as needed:

- `PORT` - Server port (default: `3000`)
- `ALLOWED_ORIGINS` - Comma-separated allowlist for Socket.IO origins
- `MAX_DRAWING_DATA_URL_LENGTH` - Maximum accepted drawing payload size (characters)
- `RATE_LIMIT_WINDOW_MS` - Socket event rate-limit window in milliseconds
- `JOIN_RATE_LIMIT` - Max `player:joinRoom` calls per window per socket
- `RECONNECT_RATE_LIMIT` - Max `player:reconnect` calls per window per socket
- `SUBMIT_RATE_LIMIT` - Max `player:submitDrawing` calls per window per socket

### Health Check

- `GET /healthz` returns process uptime and room stats for deployment health probes.

### Render Deployment

- A Render Blueprint file is included at `render.yaml`.

### Support Links (Buy + Donate)

- Edit `public/assets/config/links.js` to set:
  - `interestFormUrl` (your physical card game interest form)
  - `donateUrl` (your PayPal donation URL)
- These links are shown on the landing page, host lobby, and player join screen.

## Card Decks

- **Core Mix:** General scenarios, dilemmas, historical events
- **Creative & Pop:** Pop culture, creative lists, fictional scenarios
- **Hypothetical & Taboo (17+):** "What if" scenarios, adult content

## Contributing

Feel free to add more prompts to `server/game/constants.js` or create new avatar images!

## License

MIT
