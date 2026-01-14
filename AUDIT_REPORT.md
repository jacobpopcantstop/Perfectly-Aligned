# Perfectly Aligned - Security & Code Audit Report

**Audit Date:** January 14, 2026
**Auditor:** Claude Code
**Version Audited:** 2.0.0

---

## Executive Summary

Perfectly Aligned is a Jackbox-style multiplayer drawing party game built with Node.js, Express, Socket.IO, and vanilla JavaScript. The codebase is approximately 6,000 lines of code with a clean separation between server and client components.

This audit identified **23 issues** across security, code quality, performance, and architecture categories:

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 9 |
| Low | 7 |

---

## Table of Contents

1. [Security Issues](#1-security-issues)
2. [Code Quality Issues](#2-code-quality-issues)
3. [Performance Issues](#3-performance-issues)
4. [Architecture Issues](#4-architecture-issues)
5. [Logic & Bug Issues](#5-logic--bug-issues)
6. [Best Practices Violations](#6-best-practices-violations)
7. [Recommendations Summary](#7-recommendations-summary)

---

## 1. Security Issues

### 1.1 [CRITICAL] Cross-Site Scripting (XSS) via Player Names

**Location:** `public/host/host.js:247-252`, `public/player/player.js:316-322`

**Description:** Player names are inserted directly into innerHTML without sanitization, allowing malicious JavaScript execution.

```javascript
// host.js:247-252
playerEl.innerHTML = `
    <div class="player-avatar" style="background-image: url('/assets/images/avatars/${player.avatar}')"></div>
    <span class="player-name">${player.name}</span>  // UNSAFE
`;
```

**Attack Vector:** A malicious player could join with name `<img src=x onerror="alert(document.cookie)">` and execute arbitrary JavaScript on all clients.

**Impact:** Session hijacking, data theft, DOM manipulation

**Recommendation:** Use `textContent` instead of `innerHTML`, or sanitize all user input before rendering.

---

### 1.2 [CRITICAL] XSS via Drawing Submission Display

**Location:** `public/host/host.js:484-491`

**Description:** Submission drawings are rendered directly into `img src` attributes without validation that the data is actually a valid image data URL.

```javascript
// host.js:484-491
card.innerHTML = `
    <div class="submission-drawing">
        <img src="${submission.drawing}" alt="Drawing by ${submission.playerName}">
    </div>
```

**Attack Vector:** A malicious client could submit a crafted payload instead of a valid PNG data URL.

**Impact:** XSS, potential browser exploitation

**Recommendation:** Validate that `submission.drawing` starts with `data:image/png;base64,` on the server before accepting it.

---

### 1.3 [HIGH] Wide-Open CORS Configuration

**Location:** `server/index.js:14-18`

**Description:** The Socket.IO server accepts connections from any origin.

```javascript
const io = new Server(httpServer, {
    cors: {
        origin: "*",  // Accepts ALL origins
        methods: ["GET", "POST"]
    }
});
```

**Impact:** Cross-origin attacks, unauthorized game manipulation from malicious websites

**Recommendation:** Restrict CORS to specific allowed origins or use a whitelist.

---

### 1.4 [HIGH] No Rate Limiting on Socket Events

**Location:** `server/index.js` (entire socket handler)

**Description:** There is no rate limiting on any socket events. A malicious client could:
- Spam `chat:message` events
- Rapidly create rooms to exhaust server memory
- Submit drawings repeatedly

**Impact:** Denial of service, resource exhaustion

**Recommendation:** Implement rate limiting per socket for all event types.

---

### 1.5 [HIGH] No Input Validation on Drawing Data Size

**Location:** `server/game/Room.js:305-326`

**Description:** Drawing data (base64-encoded PNG) is stored without size limits.

```javascript
submitDrawing(playerId, drawingData) {
    // No validation of drawingData size
    this.submissions.set(playerId, {
        drawing: drawingData,  // Could be megabytes of data
        ...
    });
}
```

**Impact:** Memory exhaustion, denial of service

**Recommendation:** Limit drawing data size (e.g., max 500KB) and validate format.

---

### 1.6 [HIGH] Insecure Room Code Generation

**Location:** `server/game/GameManager.js:16-36`

**Description:** Room codes are only 4 characters using `Math.random()`, which is not cryptographically secure.

```javascript
generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 chars
    // Only ~331,776 possible codes (24^4)
    // Uses Math.random() - predictable
}
```

**Impact:** Room code brute-forcing, unauthorized game access

**Recommendation:**
- Use `crypto.randomBytes()` for secure random generation
- Increase code length to 6 characters
- Implement join attempt rate limiting

---

### 1.7 [HIGH] Missing Host Authentication

**Location:** `server/index.js:70-83`

**Description:** The `socket.isHost` flag is set client-side and trusted for authorization.

```javascript
socket.on('host:createRoom', (callback) => {
    // ...
    socket.isHost = true;  // Self-asserted, no verification
});
```

A sophisticated attacker could manipulate their socket to gain host privileges.

**Recommendation:** Implement proper authentication tokens for host verification.

---

### 1.8 [MEDIUM] localStorage Exposure of Player Credentials

**Location:** `public/player/player.js:241-243`

**Description:** Player session data is stored in localStorage without encryption.

```javascript
localStorage.setItem('pa_playerId', playerState.playerId);
localStorage.setItem('pa_playerName', playerState.playerName);
localStorage.setItem('pa_roomCode', playerState.roomCode);
```

**Impact:** Session data accessible to other scripts on same origin

**Recommendation:** Use sessionStorage for temporary data, or implement secure token-based sessions.

---

### 1.9 [MEDIUM] No HTTPS Enforcement

**Location:** `server/index.js`

**Description:** The server runs on plain HTTP with no HTTPS enforcement or security headers.

**Recommendation:**
- Add Helmet.js for security headers
- Implement HTTPS in production
- Add HSTS headers

---

## 2. Code Quality Issues

### 2.1 [MEDIUM] Unused Dependency

**Location:** `package.json:22`

**Description:** The `uuid` package is declared as a dependency but never used in the codebase.

```json
"dependencies": {
    "uuid": "^9.0.0"  // Never imported or used
}
```

**Recommendation:** Remove unused dependency to reduce attack surface and package size.

---

### 2.2 [LOW] Inconsistent Error Handling

**Location:** Multiple files

**Description:** Error handling is inconsistent across the codebase:
- Some callbacks return `{ success: false, error: '...' }`
- Some just return `{ success: false }`
- Client-side uses `alert()` for all errors

**Examples:**
```javascript
// Room.js:61 - Has error message
return { success: false, error: 'Cannot join room' };

// Room.js:102 - Different format
return { success: false, error: 'Player not found' };
```

**Recommendation:** Standardize error response format and implement proper error codes.

---

### 2.3 [LOW] Magic Numbers

**Location:** Multiple files

**Description:** Hardcoded numbers without named constants:

```javascript
// Room.js:12-13
this.maxPlayers = 8;
this.minPlayers = 3;

// Room.js:77
name: name.substring(0, 10),  // Why 10?

// GameManager.js:30
const maxAttempts = 100;

// host.js:330
if (flickerCount >= 15) {  // Why 15?
```

**Recommendation:** Extract magic numbers to named constants in a shared configuration.

---

### 2.4 [LOW] Code Duplication

**Location:** `host.js` and `player.js`

**Description:** Several functions are duplicated between host and player:
- `showNotification()` - identical in both files
- Timer formatting logic
- Score update logic

**Recommendation:** Move shared utilities to `shared/` directory.

---

### 2.5 [LOW] Missing JSDoc Documentation

**Location:** All JavaScript files

**Description:** While there are some comments, most functions lack proper JSDoc documentation describing parameters, return types, and behavior.

**Recommendation:** Add JSDoc comments for all public functions.

---

## 3. Performance Issues

### 3.1 [MEDIUM] Inefficient Prompt Card Drawing

**Location:** `server/game/Room.js:229-238`

**Description:** The prompt drawing algorithm is inefficient:

```javascript
drawPrompts() {
    // Creates a Set and randomly adds until size=3
    // Could have infinite loop potential with small deck
    const indices = new Set();
    while (indices.size < 3) {
        indices.add(Math.floor(Math.random() * this.availableCards.length));
    }
}
```

**Impact:** Potentially slow or infinite loop with near-empty deck

**Recommendation:** Use Fisher-Yates shuffle and slice, or check deck size before drawing.

---

### 3.2 [MEDIUM] No Room Cleanup Automation

**Location:** `server/game/GameManager.js:116-126`

**Description:** The `cleanupInactiveRooms()` method exists but is never called automatically.

```javascript
cleanupInactiveRooms(maxInactiveMinutes = 30) {
    // This method is never invoked
}
```

**Impact:** Memory leak as rooms accumulate over time

**Recommendation:** Implement periodic cleanup using `setInterval()`.

---

### 3.3 [MEDIUM] Full Game State Broadcast

**Location:** `server/index.js` (multiple emit calls)

**Description:** The full game state is broadcast on many events, including sensitive data that clients don't need.

```javascript
io.to(room.code).emit('game:newRound', {
    gameState: room.getState()  // Full state to everyone
});
```

**Impact:** Unnecessary bandwidth, potential information leakage

**Recommendation:** Send only delta updates or player-specific filtered state.

---

### 3.4 [LOW] Canvas Resize Inefficiency

**Location:** `public/player/player.js:407-424`

**Description:** Canvas resize saves and restores image data on every resize, but the restoration doesn't account for scaling.

```javascript
resizeCanvas() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Resize happens
    ctx.putImageData(imageData, 0, 0);  // Not scaled, will be clipped
}
```

**Recommendation:** Properly scale image data or redraw from history on resize.

---

### 3.5 [LOW] No Connection Pooling or Limits

**Location:** `server/index.js`

**Description:** No maximum connection limits are configured for Socket.IO.

**Recommendation:** Configure `maxHttpBufferSize` and connection limits.

---

## 4. Architecture Issues

### 4.1 [MEDIUM] Stateful Server Without Persistence

**Location:** `server/game/GameManager.js`

**Description:** All game state is stored in memory with no persistence layer. Server restart loses all active games.

**Impact:** Data loss on server restart or crash

**Recommendation:** Add Redis or database persistence for game state.

---

### 4.2 [MEDIUM] No Horizontal Scaling Support

**Location:** Server architecture

**Description:** The current architecture uses in-memory state, preventing horizontal scaling across multiple server instances.

**Recommendation:** Implement Socket.IO Redis adapter for multi-instance deployment.

---

### 4.3 [LOW] Tight Coupling Between Layers

**Location:** `server/index.js`

**Description:** Socket event handlers directly manipulate Room objects and emit events, creating tight coupling.

**Recommendation:** Implement a service layer between socket handlers and game logic.

---

## 5. Logic & Bug Issues

### 5.1 [MEDIUM] Potential Race Condition in Timer

**Location:** `server/game/Room.js:275-290`

**Description:** The timer callback could fire after the room is cleaned up, causing errors.

```javascript
startTimer(duration, onTick, onComplete) {
    this.timer = setInterval(() => {
        // This could fire after room cleanup
        if (remaining <= 0) {
            if (onComplete) onComplete();  // Room might not exist
        }
    }, 1000);
}
```

**Recommendation:** Add guard checks for room validity in timer callbacks.

---

### 5.2 [MEDIUM] Missing Winner Avatar in Results

**Location:** `public/player/player.js:636-639`

**Description:** The `getAvatarForPlayer` function returns a hardcoded placeholder.

```javascript
function getAvatarForPlayer(playerId, scores) {
    return 'alienlady_avatar.png'; // This should be improved
}
```

**Impact:** Wrong avatar displayed for winners

**Recommendation:** Include avatar in score data or maintain player lookup.

---

### 5.3 [LOW] Player Reconnection Logic Issues

**Location:** `server/game/Room.js:130-139`

**Description:** Reconnection matches by name (case-insensitive), not by ID, which could allow impersonation.

```javascript
reconnectPlayer(oldId, newId, name) {
    const player = this.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    // Anyone knowing the name could reconnect as that player
}
```

**Recommendation:** Use secure reconnection tokens instead of name matching.

---

### 5.4 [LOW] Judge Can't See Submitted Drawings

**Location:** Game flow

**Description:** The judge sees submissions only on the host screen. If they're not viewing the host screen, they have no visibility into what was submitted.

**Recommendation:** Consider showing thumbnails to judge's device during judging phase.

---

## 6. Best Practices Violations

### 6.1 [LOW] No Environment Configuration

**Location:** `server/index.js:21`

**Description:** Only PORT is configurable via environment variables. Other settings are hardcoded.

```javascript
const PORT = process.env.PORT || 3000;
// No other env config for:
// - CORS origins
// - Max players
// - Timer defaults
// - etc.
```

**Recommendation:** Use a configuration library (dotenv, config) for all settings.

---

### 6.2 [LOW] No Health Check Endpoint

**Location:** `server/index.js`

**Description:** No health check endpoint exists for load balancer or monitoring integration.

**Recommendation:** Add `/health` endpoint returning server status.

---

### 6.3 [LOW] No Graceful Shutdown

**Location:** `server/index.js`

**Description:** No handling for SIGTERM/SIGINT signals for graceful shutdown.

**Recommendation:** Implement proper shutdown handling to close connections gracefully.

---

### 6.4 [LOW] Console Logging in Production

**Location:** All server files

**Description:** Uses `console.log` throughout without a proper logging framework.

**Recommendation:** Use a structured logging library (winston, pino) with log levels.

---

## 7. Recommendations Summary

### Immediate Actions (Critical/High)

1. **Sanitize all user input** before rendering in HTML
2. **Validate drawing data** format and size on server
3. **Restrict CORS origins** to known domains
4. **Implement rate limiting** on all socket events
5. **Use crypto.randomBytes()** for room code generation
6. **Add authentication tokens** for host verification

### Short-term Improvements (Medium)

7. Remove unused `uuid` dependency
8. Implement automatic room cleanup with `setInterval()`
9. Add persistence layer (Redis/database)
10. Implement proper reconnection with secure tokens
11. Add security headers with Helmet.js
12. Fix winner avatar display bug

### Long-term Enhancements (Low)

13. Standardize error handling with error codes
14. Extract magic numbers to configuration
15. Add comprehensive JSDoc documentation
16. Implement horizontal scaling with Socket.IO Redis adapter
17. Add health check and graceful shutdown
18. Implement structured logging

---

## Appendix: Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `server/index.js` | 443 | Main server with Express and Socket.IO |
| `server/game/GameManager.js` | 130 | Room management |
| `server/game/Room.js` | 565 | Game room logic |
| `server/game/constants.js` | 169 | Game constants and prompts |
| `public/host/host.js` | 735 | Host controller |
| `public/host/index.html` | 186 | Host UI |
| `public/player/player.js` | 803 | Player controller |
| `public/player/index.html` | 199 | Player UI |
| `package.json` | 24 | Dependencies |

**Total Lines Reviewed:** ~3,254 lines of JavaScript/HTML

---

*This audit was conducted using static analysis. Runtime testing and penetration testing would provide additional findings.*
