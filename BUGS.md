# Perfectly Aligned — Bug Audit

Full glitch audit of the codebase as of the current `master` branch.
Organized by severity. Each entry includes the file + line reference and a description of the problem.

---

## 🔴 Critical — Game-breaking

### 1. `player:skipCurse` crashes host with `TypeError` on judge name
**Files:** `server/index.js:899`, `host.js:1486`

`room.advanceRound()` returns `{ success, gameOver, winner }` — it never includes a `judge` property. When the curser skips the curse phase from their phone, `player:skipCurse` calls `advanceRound()` and then emits `game:newRound` with `judge: roundResult.judge` (which is `undefined`).

The host's `handleNewRound` handler then does:
```js
showNotification(`Round ${data.round} - ${data.judge.name} is the Judge!`);
```
This throws `TypeError: Cannot read properties of undefined (reading 'name')`, crashing the host's game script.

**Fix:** In `server/index.js:player:skipCurse`, replace `roundResult.judge` with `room.getCurrentJudge()`.

---

### 2. Disconnecting player during drawing phase never triggers auto-end
**File:** `server/index.js:1097–1102`

Auto-end fires inside `player:submitDrawing` when `submissionCount >= totalExpected`. But if a player disconnects *after* all other non-judge players have already submitted, the auto-end check is never re-triggered. The drawing phase gets stuck — submissions are never collected and the host has to manually press "End Drawing".

**Scenario:** Room has judge + Player A + Player B. Player A submits. Player B disconnects. `totalExpected` was 2 at Player A's submit time, count was 1 — no auto-end. Player B is now disconnected and will never submit. Game freezes.

**Fix:** In the `disconnect` handler, after calling `room.setPlayerDisconnected()`, re-check whether all remaining connected non-judge players have submitted and fire auto-end if so.

---

### 3. Reconnecting player during `modifiers` phase loses curse controls
**File:** `player.js:2408–2411`

When the curser reconnects during the modifier phase, `handleGameState` shows:
```js
case 'modifiers':
    showScreen('waiting');
    updateWaitingMessage('Modifier phase in progress...');
    break;
```
No curse UI is shown, and `playerState.isCurser` is `false`. The curser cannot draw a curse card, apply, hold, or skip. The modifier phase is now stuck — no one can advance it.

**Fix:** In `handleGameState` for the `modifiers` case, check if `room.currentCurser.id === playerState.playerId` and re-invoke `showCurserControls()` with the stored state.

---

## 🟠 High — Significant gameplay defects

### 4. Reconnecting player during drawing phase has no timer info
**Files:** `player.js:2358–2383`, `player.js:715–729`

When a player reconnects during the drawing phase, `handleGameState` correctly shows the drawing screen and restores the prompt, but `playerState.timerDuration` is never restored from the game state. The `game:timerTick` handler uses `playerState.timerDuration || 90` as a fallback, which will be wrong if the game was set to a different timer length. The timer bar progress will be visually off for the reconnected player.

**Fix:** Restore `playerState.timerDuration` from `state.settings.timerDuration` in `handleGameState`.

---

### 5. Auto-submit on timer expiry sends a blank canvas
**File:** `player.js:743–745`

When the timer ends, `game:timerEnd` fires `submitDrawing()` automatically for any player who hasn't submitted. There is no check for whether the canvas has any content. A player who hadn't started drawing yet will submit a plain white rectangle, which looks like a bug to the judge.

**Fix:** Before calling `submitDrawing()` on auto-expiry, check if `drawingHistory.length > 0`. If empty, either skip the submit or show a brief "0 seconds!" state before submitting.

---

### 6. `GameManager.registerPlayer()` is never called — player map is dead code
**Files:** `server/game/GameManager.js:90–99`, `server/index.js` (no calls)

`GameManager` has a full `playerRoomMap` system with `registerPlayer`, `unregisterPlayer`, `getRoomByPlayerId`, and `getRoomCodeByPlayerId`. None of these are ever called in `server/index.js`. The server tracks which room a socket is in via `socket.roomCode` instead, making the entire player map dead code. This is low-risk now but creates confusion and diverges from the intended design.

**Fix:** Either wire up `registerPlayer(socket.id, room.code)` in the join/reconnect handlers and use `getRoomByPlayerId` in disconnect handling, or remove the dead methods.

---

### 7. Curser target indices can be stale after player removal
**Files:** `Room.js:480–481`, `Room.js:506–542`, `player.js:2164–2186`

`checkForModifierPhase()` stores `currentCurser = { player, index }` where `index` is the player's array position at check time. The player-facing curse target list (`showPlayerCurseTargets`) also iterates over the snapshot in `curserModifierData.gameState.players`.

If a player is kicked or disconnects between when `checkForModifierPhase` runs and when `applyCurse` is called, the stored `curserIndex` and any target `index` sent by the curser could now refer to a different player than intended. In `applyCurse`, the self-curse check `targetIndex === this.currentCurser.index` could pass when it should fail, or fail when it should pass.

**Fix:** Store players by ID rather than index throughout the curse flow. Use `targetId` instead of `targetIndex` in `applyCurse`.

---

### 8. Token reroll is documented but not implemented
**Files:** `README.md:40`, no matching socket event in `server/index.js`

The README states: *"Tokens: Can be spent on re-rolling prompts (1 token)"*. There is no `player:rerollPrompts` (or equivalent) event handler on the server, no UI for it in `player.js`, and no token deduction logic for rerolling. Players accumulate tokens with no way to spend them on this stated mechanic (steal is the only spend path).

**Fix:** Implement a `player:rerollPrompts` event that (a) requires 1 token and judge role, (b) deducts the token, (c) calls `room.drawPrompts()` again and emits `game:promptsDrawn`.

---

## 🟡 Medium — UX / logic issues

### 9. `handleNewRound` on host assumes `data.judge` is always present
**File:** `host.js:1486`

```js
showNotification(`Round ${data.round} - ${data.judge.name} is the Judge!`);
```

If `data.judge` is ever `null` or `undefined` (e.g. judge disconnects between `advanceRound` and the event being received), this silently breaks the notification. It's safe for normal play but will break in edge cases (and definitely breaks via the `player:skipCurse` path — see bug #1).

**Fix:** Guard with `data.judge ? data.judge.name : 'Unknown'`.

---

### 10. Player disconnecting during drawing doesn't update submission counter on host
**File:** `server/index.js:1097–1102`, `host.js:1180–1184`

The host's submission counter (`updateSubmissionCounter`) calculates total expected players from `gameState.players.filter(p => !p.isJudge)` — it doesn't filter by `connected`. So if a player disconnects mid-round, the counter still shows their slot in the denominator. The host sees "1 / 3" when there are only 2 connected players left, and thinks one more drawing is coming.

**Fix:** Filter `connected === true` in `updateSubmissionCounter`, or have the server send an updated `totalExpected` with `room:playerDisconnected` events during the drawing phase.

---

### 11. Lobby player count hardcoded to "8" on host screen
**File:** `host.js:691`

```js
dom.playerCount.textContent = `${gameState.players.length} / 8 players`;
```

`maxPlayers` is stored on the Room object but never sent to the host's frontend. If `Room.maxPlayers` is ever changed, the host UI will still say "/ 8".

**Fix:** Include `maxPlayers` in `room.getState()` and use `gameState.maxPlayers` in the display.

---

### 12. `modifiers` phase reconnect shows blank state for non-curser players too
**File:** `player.js:2408–2411`

When a non-curser player reconnects during the modifier phase, they see "Modifier phase in progress..." with no indication of what's happening, who the curser is, or how long to wait. The host has all this info but the player screen gives zero context.

**Fix:** Include curser name in the waiting message: `"${curserName} is choosing a curse..."`.

---

### 13. Drawing history is lost on reconnect — blank canvas shown
**File:** `player.js:2377–2378`

When a player reconnects mid-drawing, `handleGameState` calls `clearCanvas()`, wiping any partial drawing the player had before disconnecting. Since strokes are only tracked client-side in `drawingHistory`, there's no way to restore them from the server. The player has to start over with a blank canvas.

This is an inherent limitation of the client-side-only drawing model. However, there is no messaging that tells the player their drawing was lost.

**Fix (short-term):** Show a notification: *"Reconnected — your in-progress drawing was lost."*
**Fix (long-term):** Persist `drawingHistory` in `localStorage` during the drawing phase so it survives a page reload/reconnect within the same session.

---

### 14. Both host and judge can select winner independently
**Files:** `server/index.js:384` (`host:selectWinner`), `server/index.js:739` (`judge:selectWinner`)

Two separate events can select the winner — one from the host TV screen, one from the judge's phone. There is no coordination between them. In normal play this is fine (one fires, the other fails with "Wrong phase"). But if both are triggered near-simultaneously for different players (race condition), the first one wins silently. The host screen and judge phone can disagree on who was selected.

**Fix:** Add a guard: once a winner-selection request is in-flight, disable the button on both host and judge UIs until `game:winnerSelected` confirms the result.

---

### 15. No re-entry protection on the host "Roll Alignment" button when judge rolls from phone
**File:** `host.js:831–846`

When the judge rolls from their phone (`judge:rollAlignment`), the host's roll button is locked (`dom.rollBtn.disabled = true`) while the animation plays. But `hostInitiatedRoll` remains `false`. A second host click mid-animation is possible because the button is only disabled after `rollAlignment()` is called from the host side — not when the `game:alignmentRolled` event arrives from a judge roll.

In `handleAlignmentRolled` for the non-host-initiated path, the button is disabled at line 901, but there's a window between the judge pressing "Roll" and the event reaching the host where the host button is still active. Double-rolls can occur in laggy conditions.

**Fix:** Disable `dom.rollBtn` immediately on `game:alignmentRolled` before running the animation.

---

## 🟢 Low — Polish / minor issues

### 16. Timer bar falls back to 90s when `timerDuration` is 0 (no-timer mode)
**File:** `player.js:717`

```js
const duration = playerState.timerDuration || 90;
```

If timer is disabled (`timerDuration = 0`), this falls back to 90 and the percentage calculation is wrong. In practice the bar isn't visible in no-timer mode, but the logic is fragile.

**Fix:** Use `const duration = playerState.timerDuration > 0 ? playerState.timerDuration : 1` or skip the bar update entirely when `timerDuration === 0`.

---

### 17. `README.md` references `server/game/constants.js` which doesn't exist
**File:** `README.md:66`, `README.md:113`

The README says:
> *"Feel free to add more prompts to `server/game/constants.js`"*
> *"└── constants.js   # Game data"*

The actual file is `shared/game-data.js`. This misleads contributors.

**Fix:** Update README to point to `shared/game-data.js`.

---

### 18. `exitFullscreen` scaling comment is misleading
**File:** `player.js:1570–1582`

The `exitFullscreen` comment says *"Update history to scale back"* but the history was already stored in main-canvas coordinates (the `fs*` handlers convert coordinates when saving to `drawingHistory`). The function actually just copies the history array without any scaling. The comment creates false confidence that scaling is happening when it isn't needed.

**Fix:** Update comment to: *"History is already in main-canvas coords; redraw from it."*

---

### 19. `curserModifierData` snapshot can be stale for target filtering
**File:** `player.js:2165`

`showPlayerCurseTargets()` uses `curserModifierData.gameState.players` (the snapshot from when `game:modifierPhase` was received) to build the target list. If players disconnect after that snapshot, disconnected players still appear as valid targets. The server's `applyCurse` will accept the selection, resulting in a curse applied to a disconnected player.

This isn't a crash but results in the curse being wasted on someone who likely won't return.

**Fix:** Fetch fresh state before showing targets, or filter out `player.connected === false` entries in `showPlayerCurseTargets`.

---

### 20. No validation that `settings.timerDuration` is a known-safe value on join
**File:** `server/index.js:344–361`

`host:startTimer` accepts any `duration` integer the host sends:
```js
room.startTimer(duration, ...)
```
There is no clamping or whitelist check. A malicious host could pass a very large number and effectively freeze the timer phase (or 0 to immediately fire `onComplete`).

**Fix:** Clamp `duration` to an allowed set (e.g. `[0, 60, 90, 120, 180]`) before passing to `room.startTimer`.

---

*Total: 20 bugs — 3 critical, 5 high, 6 medium, 6 low.*
