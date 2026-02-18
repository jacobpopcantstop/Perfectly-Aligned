/**
 * Perfectly Aligned - Main Server Entry Point
 * =============================================
 * Jackbox-style online multiplayer party drawing game.
 * Express + Socket.IO server handling room management,
 * real-time game events, and player connections.
 *
 * @module server/index
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import GameManager from './game/GameManager.js';

// ---------------------------------------------------------------------------
// ES Module __dirname equivalent
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Server Initialization
// ---------------------------------------------------------------------------
const app = express();
const httpServer = createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Socket origin not allowed by ALLOWED_ORIGINS'));
        },
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const MAX_DRAWING_DATA_URL_LENGTH = Number(process.env.MAX_DRAWING_DATA_URL_LENGTH || 1_500_000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10_000);
const JOIN_RATE_LIMIT = Number(process.env.JOIN_RATE_LIMIT || 8);
const RECONNECT_RATE_LIMIT = Number(process.env.RECONNECT_RATE_LIMIT || 12);
const SUBMIT_RATE_LIMIT = Number(process.env.SUBMIT_RATE_LIMIT || 6);
const gameManager = new GameManager();

// ---------------------------------------------------------------------------
// Static File Serving
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.redirect('/host');
});

app.get('/host', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/host/index.html'));
});

app.get('/play', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/player/index.html'));
});

app.get('/play/:roomCode', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/player/index.html'));
});

app.get('/api/room/:code', (req, res) => {
    const room = gameManager.getRoom(req.params.code.toUpperCase());
    if (room) {
        res.json({
            exists: true,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            gameStarted: room.gameStarted,
            canJoin: room.canJoin(),
            usedAvatars: room.getUsedAvatars()
        });
    } else {
        res.json({ exists: false });
    }
});

app.get('/healthz', (req, res) => {
    res.status(200).json({
        ok: true,
        uptimeSeconds: Math.floor(process.uptime()),
        roomStats: gameManager.getStats()
    });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve the room associated with a socket and verify host authorization.
 * Returns the room on success or calls the callback with an error and returns null.
 */
function getHostRoom(socket, callback) {
    const room = gameManager.getRoom(socket.roomCode);
    if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return null;
    }
    if (!socket.isHost) {
        if (typeof callback === 'function') callback({ success: false, error: 'Not authorized — host only' });
        return null;
    }
    return room;
}

/**
 * Retrieve the room associated with a socket (no host check).
 * Returns the room on success or calls the callback with an error and returns null.
 */
function getRoom(socket, callback) {
    const room = gameManager.getRoom(socket.roomCode);
    if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return null;
    }
    return room;
}

function generateReconnectToken() {
    return crypto.randomBytes(24).toString('hex');
}

function isValidDrawingPayload(drawingData) {
    if (typeof drawingData !== 'string') return false;
    if (!drawingData.startsWith('data:image/png;base64,')) return false;
    if (drawingData.length > MAX_DRAWING_DATA_URL_LENGTH) return false;
    return true;
}

function checkSocketRateLimit(socket, eventKey, maxRequests, callback) {
    if (!socket._rateLimitBuckets) {
        socket._rateLimitBuckets = new Map();
    }

    const now = Date.now();
    const bucket = socket._rateLimitBuckets.get(eventKey) || [];
    const recent = bucket.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= maxRequests) {
        callback({
            success: false,
            error: `Too many requests for ${eventKey}. Please wait a moment and try again.`
        });
        return false;
    }

    recent.push(now);
    socket._rateLimitBuckets.set(eventKey, recent);
    return true;
}

// ---------------------------------------------------------------------------
// Socket.IO Connection Handling
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ======================================================================
    // HOST EVENTS
    // ======================================================================

    /**
     * host:createRoom
     * Creates a new game room and makes this socket the host.
     */
    socket.on('host:createRoom', (callback) => {
        if (typeof callback !== 'function') return;
        try {
            const room = gameManager.createRoom(socket.id);
            socket.join(room.code);
            socket.roomCode = room.code;
            socket.isHost = true;

            console.log(`[Room] Created: ${room.code} by host ${socket.id}`);

            callback({
                success: true,
                roomCode: room.code,
                gameState: room.getState()
            });
        } catch (err) {
            console.error('[host:createRoom] Error:', err.message);
            callback({ success: false, error: err.message });
        }
    });

    /**
     * host:reconnect
     * Allows a host to reclaim their room after a disconnect/reconnect.
     */
    socket.on('host:reconnect', (roomCode, callback) => {
        if (typeof callback !== 'function') return;
        if (!roomCode) {
            return callback({ success: false, error: 'Room code is required' });
        }

        const room = gameManager.getRoom(roomCode.toUpperCase());
        if (!room) {
            console.log(`[Room] Reconnect failed — room ${roomCode} not found`);
            return callback({ success: false, error: 'Room no longer exists' });
        }

        // Clear the disconnect grace timer
        if (room._hostDisconnectTimer) {
            clearTimeout(room._hostDisconnectTimer);
            room._hostDisconnectTimer = null;
        }
        room._hostReconnected = true;

        // Update the room's host ID to the new socket
        room.hostId = socket.id;
        socket.join(room.code);
        socket.roomCode = room.code;
        socket.isHost = true;

        console.log(`[Room ${room.code}] Host reconnected with new socket ${socket.id}`);

        callback({
            success: true,
            roomCode: room.code,
            gameState: room.getState()
        });
    });

    /**
     * host:startGame
     * Starts the game with the provided settings.
     */
    socket.on('host:startGame', (settings, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.startGame(settings);
        if (result.success) {
            io.to(room.code).emit('game:started', room.getState());
        }
        callback(result);
    });

    /**
     * host:rollAlignment
     * Rolls a random alignment for the current round.
     * Includes an isJudgeChoice flag when the special "U" alignment is rolled.
     */
    socket.on('host:rollAlignment', (callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.rollAlignment();
        if (result.success) {
            const isJudgeChoice = result.alignment === 'U';
            io.to(room.code).emit('game:alignmentRolled', {
                alignment: result.alignment,
                fullName: result.fullName,
                isJudgeChoice
            });
        }
        callback(result);
    });

    /**
     * host:selectJudgeAlignment
     * When "Judge's Choice" is rolled, the judge manually selects an alignment.
     */
    socket.on('host:selectJudgeAlignment', (alignment, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.selectJudgeAlignment(alignment);
        if (result.success) {
            io.to(room.code).emit('game:judgeAlignmentSelected', {
                alignment: result.alignment,
                fullName: result.fullName
            });
        }
        callback(result);
    });

    /**
     * host:drawPrompts
     * Draws a hand of prompt cards for the judge to choose from.
     */
    socket.on('host:drawPrompts', (callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.drawPrompts();
        if (result.success) {
            io.to(room.code).emit('game:promptsDrawn', {
                prompts: result.prompts
            });
        }
        callback(result);
    });

    /**
     * host:selectPrompt
     * Judge selects one of the drawn prompts. Triggers the drawing phase.
     */
    socket.on('host:selectPrompt', (index, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.selectPrompt(index);
        if (result.success) {
            io.to(room.code).emit('game:promptSelected', {
                prompt: result.prompt,
                alignment: room.currentAlignment,
                alignmentFullName: room.currentAlignmentFullName
            });

            io.to(room.code).emit('game:startDrawing', {
                prompt: result.prompt,
                alignment: room.currentAlignment,
                alignmentFullName: room.currentAlignmentFullName,
                timeLimit: room.settings.timerDuration
            });
        }
        callback(result);
    });

    /**
     * host:startTimer
     * Starts the drawing countdown timer. Emits ticks every second and
     * a completion event when the timer runs out.
     */
    socket.on('host:startTimer', (duration, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        room.startTimer(
            duration,
            (timeLeft) => {
                io.to(room.code).emit('game:timerTick', { timeLeft });
            },
            () => {
                io.to(room.code).emit('game:timerEnd');
            }
        );

        io.to(room.code).emit('game:timerStarted', { duration });
        callback({ success: true });
    });

    /**
     * host:endDrawing
     * Manually ends the drawing phase, collects all submissions.
     */
    socket.on('host:endDrawing', (callback) => {
        if (typeof callback !== 'function') return;
        const room = getHostRoom(socket, callback);
        if (!room) return;

        room.clearTimer();
        room.collectSubmissions();
        const submissions = room.getSubmissionsForJudging();

        io.to(room.code).emit('game:submissionsCollected', { submissions });
        callback({ success: true, submissions });
    });

    /**
     * host:selectWinner
     * Judge picks the winning drawing. Awards a point and checks for game over.
     */
    socket.on('host:selectWinner', (playerId, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.selectWinner(playerId);
        if (result.success) {
            const scores = room.getScores();
            const winner = room.players.find(
                (p) => p.score >= room.settings.targetScore
            );
            const gameOver = !!winner;

            io.to(room.code).emit('game:winnerSelected', {
                winnerId: playerId,
                winnerName: result.winnerName,
                scores,
                gameOver
            });

            if (gameOver) {
                io.to(room.code).emit('game:over', {
                    winner,
                    finalScores: scores,
                    winningDrawings: room.winningDrawings
                });
            }
        }
        callback(result);
    });

    /**
     * host:awardToken
     * Awards a single bonus token to a player.
     */
    socket.on('host:awardToken', (data, callback) => {
        if (typeof callback !== 'function') return;
        const room = getHostRoom(socket, callback);
        if (!room) return;

        if (!data || typeof data !== 'object') {
            return callback({ success: false, error: 'Invalid request data' });
        }
        const { playerId, tokenType } = data;
        const result = room.awardToken(playerId, tokenType);
        if (result.success) {
            io.to(room.code).emit('game:tokenAwarded', {
                playerId,
                tokenType,
                players: room.getPlayersPublicData()
            });
        }
        callback(result);
    });

    /**
     * host:nextRound
     * Advances the game to the next round, or ends it if someone has won.
     */
    socket.on('host:nextRound', (callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.advanceRound();
        if (result.success) {
            if (result.gameOver) {
                io.to(room.code).emit('game:over', {
                    winner: result.winner,
                    finalScores: room.getScores(),
                    winningDrawings: room.winningDrawings
                });
            } else {
                io.to(room.code).emit('game:newRound', {
                    round: room.currentRound,
                    judge: room.getCurrentJudge(),
                    gameState: room.getState()
                });
            }
        }
        callback(result);
    });

    /**
     * host:checkModifiers
     * Checks whether a modifier (curse) phase should occur this round.
     */
    socket.on('host:checkModifiers', (callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.checkForModifierPhase();
        if (result.hasModifierPhase) {
            io.to(room.code).emit('game:modifierPhase', {
                curser: result.curser,
                curserIndex: result.curserIndex,
                hasHeldCurse: result.hasHeldCurse,
                heldCurse: result.heldCurse,
                gameState: room.getState()
            });
        }
        callback(result);
    });

    /**
     * host:drawCurseCard
     * Draws a random curse card for the modifier phase.
     */
    socket.on('host:drawCurseCard', (callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.drawCurseCard();
        if (result.success) {
            io.to(room.code).emit('game:curseCardDrawn', {
                modifier: result.modifier
            });
        }
        callback(result);
    });

    /**
     * host:applyCurse
     * Applies a drawn curse card to a target player.
     */
    socket.on('host:applyCurse', (data, callback) => {
        if (typeof callback !== 'function') return;
        const room = getHostRoom(socket, callback);
        if (!room) return;

        if (!data || typeof data !== 'object') {
            return callback({ success: false, error: 'Invalid request data' });
        }
        const { targetIndex, modifier } = data;
        const result = room.applyCurse(targetIndex, modifier);
        if (result.success) {
            io.to(room.code).emit('game:curseApplied', {
                targetName: result.targetName,
                modifier: result.modifier,
                gameState: room.getState()
            });
        }
        callback(result);
    });

    /**
     * host:holdCurse
     * Holds a curse card to use in a future round instead of applying it now.
     */
    socket.on('host:holdCurse', (modifier, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.holdCurse(modifier);
        if (result.success) {
            io.to(room.code).emit('game:curseHeld', {
                gameState: room.getState()
            });
        }
        callback(result);
    });

    /**
     * host:kickPlayer
     * Removes a player from the room and notifies them.
     */
    socket.on('host:kickPlayer', (playerId, callback) => {
        const room = getHostRoom(socket, callback);
        if (!room) return;

        const result = room.removePlayer(playerId);
        if (result.success) {
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerSocket) {
                playerSocket.emit('player:kicked', {
                    reason: 'You have been removed from the game by the host.'
                });
                playerSocket.leave(room.code);
                playerSocket.roomCode = null;
            }

            io.to(room.code).emit('room:playerLeft', {
                playerId,
                players: room.getPlayersPublicData()
            });

            console.log(`[Room ${room.code}] Player kicked: ${playerId}`);
        }
        callback(result);
    });

    /**
     * host:stealForPlayer
     * Host triggers a steal on behalf of a player (from the scoreboard UI).
     */
    socket.on('host:stealForPlayer', (data, callback) => {
        if (typeof callback !== 'function') return;
        const room = getHostRoom(socket, callback);
        if (!room) return;

        if (!data || typeof data !== 'object') {
            return callback({ success: false, error: 'Invalid request data' });
        }
        const { stealerId, targetId } = data;

        const result = room.executeSteal(stealerId, targetId);
        if (result.success) {
            io.to(room.code).emit('game:stealExecuted', {
                stealerId,
                stealerName: result.stealerName,
                targetId,
                targetName: result.targetName,
                scores: room.getScores()
            });

            if (result.gameOver) {
                io.to(room.code).emit('game:over', {
                    winner: result.winner,
                    finalScores: room.getScores(),
                    winningDrawings: room.winningDrawings
                });
            }
        }
        callback(result);
    });

    // ======================================================================
    // PLAYER EVENTS
    // ======================================================================

    /**
     * player:joinRoom
     * A player joins an existing room by code and name.
     */
    socket.on('player:joinRoom', (data, callback) => {
        if (typeof callback !== 'function') return;
        if (!checkSocketRateLimit(socket, 'player:joinRoom', JOIN_RATE_LIMIT, callback)) return;
        if (!data || typeof data !== 'object') {
            return callback({ success: false, error: 'Invalid request data' });
        }
        const { roomCode, playerName, avatar } = data;

        if (!roomCode || !playerName) {
            return callback({ success: false, error: 'Room code and player name are required' });
        }

        const room = gameManager.getRoom(roomCode.toUpperCase());
        if (!room) {
            const activeRooms = [...gameManager.rooms.keys()];
            console.log(`[player:joinRoom] Room "${roomCode.toUpperCase()}" not found. Active rooms: [${activeRooms.join(', ')}]`);
            return callback({ success: false, error: 'Room not found. Make sure the host has created a room and the code is correct.' });
        }

        if (!room.canJoin()) {
            return callback({ success: false, error: 'Room is full or game has already started' });
        }

        const reconnectToken = generateReconnectToken();
        const result = room.addPlayer(socket.id, playerName, avatar, reconnectToken);
        if (result.success) {
            socket.join(room.code);
            socket.roomCode = room.code;
            socket.playerId = socket.id;
            socket.isHost = false;

            console.log(`[Room ${room.code}] Player joined: ${playerName} (${socket.id})`);

            io.to(room.code).emit('room:playerJoined', {
                player: {
                    id: result.player.id,
                    name: result.player.name,
                    avatar: result.player.avatar
                },
                players: room.getPlayersPublicData()
            });

            callback({
                success: true,
                playerId: socket.id,
                reconnectToken,
                gameState: room.getState()
            });
        } else {
            callback(result);
        }
    });

    /**
     * player:selectAvatar
     * A player in the lobby changes their avatar.
     */
    socket.on('player:selectAvatar', (data, callback) => {
        if (typeof callback !== 'function') return;
        const room = getRoom(socket, callback);
        if (!room) return;

        const { avatar } = data || {};
        if (!avatar) {
            return callback({ success: false, error: 'Avatar is required' });
        }

        const result = room.setPlayerAvatar(socket.id, avatar);
        if (result.success) {
            // Emit a silent update (not room:playerJoined) to avoid spurious notifications
            io.to(room.code).emit('room:playerUpdated', {
                player: result.player,
                players: room.getPlayersPublicData()
            });
        }
        callback(result);
    });

    /**
     * player:submitDrawing
     * A player submits their drawing for the current round.
     */
    socket.on('player:submitDrawing', (data, callback) => {
        if (typeof callback !== 'function') return;
        if (!checkSocketRateLimit(socket, 'player:submitDrawing', SUBMIT_RATE_LIMIT, callback)) return;
        const room = getRoom(socket, callback);
        if (!room) return;

        // Support both old format (raw drawingData) and new format ({ drawing, caption })
        const drawing = data && data.drawing ? data.drawing : data;
        const caption = data && data.caption ? data.caption : '';

        if (!isValidDrawingPayload(drawing)) {
            return callback({ success: false, error: 'Invalid drawing data' });
        }

        const result = room.submitDrawing(socket.id, drawing, caption);
        if (result.success) {
            const nonJudgePlayers = room.players.filter(p => !p.isJudge && p.connected);
            const submissionCount = room.getSubmissionCount();
            const totalExpected = nonJudgePlayers.length;

            io.to(room.code).emit('game:submissionReceived', {
                playerId: socket.id,
                submissionCount,
                totalExpected
            });

            // Auto-end drawing phase when all connected non-judge players have submitted
            if (submissionCount >= totalExpected && totalExpected > 0 && room.gamePhase === 'drawing') {
                room.clearTimer();
                room.collectSubmissions();
                const submissions = room.getSubmissionsForJudging();
                io.to(room.code).emit('game:submissionsCollected', { submissions });
            }
        }
        callback(result);
    });

    /**
     * judge:selectWinner
     * The judge selects a winner from their player device.
     */
    socket.on('judge:selectWinner', (playerId, callback) => {
        if (typeof callback !== 'function') return;
        const room = getRoom(socket, callback);
        if (!room) return;

        // Verify this player is the judge
        const judge = room.players.find(p => p.id === socket.id);
        if (!judge || !judge.isJudge) {
            return callback({ success: false, error: 'Only the judge can select a winner' });
        }

        const result = room.selectWinner(playerId);
        if (result.success) {
            const scores = room.getScores();
            const winner = room.players.find(
                (p) => p.score >= room.settings.targetScore
            );
            const gameOver = !!winner;

            io.to(room.code).emit('game:winnerSelected', {
                winnerId: playerId,
                winnerName: result.winnerName,
                scores,
                gameOver
            });

            if (gameOver) {
                io.to(room.code).emit('game:over', {
                    winner,
                    finalScores: scores,
                    winningDrawings: room.winningDrawings
                });
            }
        }
        callback(result);
    });

    /**
     * player:steal
     * A player spends tokens to steal a point from another player.
     */
    socket.on('player:steal', (targetPlayerId, callback) => {
        const room = getRoom(socket, callback);
        if (!room) return;

        const result = room.executeSteal(socket.id, targetPlayerId);
        if (result.success) {
            io.to(room.code).emit('game:stealExecuted', {
                stealerId: socket.id,
                stealerName: result.stealerName,
                targetId: targetPlayerId,
                targetName: result.targetName,
                scores: room.getScores()
            });

            if (result.gameOver) {
                io.to(room.code).emit('game:over', {
                    winner: result.winner,
                    finalScores: room.getScores(),
                    winningDrawings: room.winningDrawings
                });
            }
        }
        callback(result);
    });

    /**
     * player:drawCurseCard
     * The curser draws a curse card from their device.
     */
    socket.on('player:drawCurseCard', (callback) => {
        if (typeof callback !== 'function') return;
        const room = getRoom(socket, callback);
        if (!room) return;

        // Verify this player is the curser
        if (!room.currentCurser || room.currentCurser.player.id !== socket.id) {
            return callback({ success: false, error: 'Only the curser can draw a curse card' });
        }

        const result = room.drawCurseCard();
        if (result.success) {
            io.to(room.code).emit('game:curseCardDrawn', {
                modifier: result.modifier
            });
        }
        callback(result);
    });

    /**
     * player:applyCurse
     * The curser applies a drawn curse card to a target from their device.
     */
    socket.on('player:applyCurse', (data, callback) => {
        if (typeof callback !== 'function') return;
        const room = getRoom(socket, callback);
        if (!room) return;

        if (!room.currentCurser || room.currentCurser.player.id !== socket.id) {
            return callback({ success: false, error: 'Only the curser can apply a curse' });
        }

        if (!data || typeof data !== 'object') {
            return callback({ success: false, error: 'Invalid request data' });
        }
        const { targetIndex, modifier } = data;
        const result = room.applyCurse(targetIndex, modifier);
        if (result.success) {
            io.to(room.code).emit('game:curseApplied', {
                targetName: result.targetName,
                modifier: result.modifier,
                gameState: room.getState()
            });
        }
        callback(result);
    });

    /**
     * player:holdCurse
     * The curser holds a curse card for a future round.
     */
    socket.on('player:holdCurse', (modifier, callback) => {
        if (typeof callback !== 'function') return;
        const room = getRoom(socket, callback);
        if (!room) return;

        if (!room.currentCurser || room.currentCurser.player.id !== socket.id) {
            return callback({ success: false, error: 'Only the curser can hold a curse' });
        }

        const result = room.holdCurse(modifier);
        if (result.success) {
            io.to(room.code).emit('game:curseHeld', {
                gameState: room.getState()
            });
        }
        callback(result);
    });

    /**
     * player:skipCurse
     * The curser skips the curse phase from their device.
     */
    socket.on('player:skipCurse', (callback) => {
        if (typeof callback !== 'function') return;
        const room = getRoom(socket, callback);
        if (!room) return;

        if (!room.currentCurser || room.currentCurser.player.id !== socket.id) {
            return callback({ success: false, error: 'Only the curser can skip' });
        }

        // Advance past modifiers
        room.gamePhase = 'scoring';
        room.currentCurser = null;
        callback({ success: true });

        // Trigger next round
        const roundResult = room.advanceRound();
        if (roundResult.success) {
            io.to(room.code).emit('game:newRound', {
                round: room.currentRound,
                judge: roundResult.judge,
                gameState: room.getState()
            });
        }
    });

    /**
     * player:reconnect
     * A disconnected player reconnects to their existing room.
     */
    socket.on('player:reconnect', (data, callback) => {
        if (typeof callback !== 'function') return;
        if (!checkSocketRateLimit(socket, 'player:reconnect', RECONNECT_RATE_LIMIT, callback)) return;
        if (!data || typeof data !== 'object') {
            return callback({ success: false, error: 'Invalid request data' });
        }
        const { roomCode, playerName, reconnectToken } = data;

        if (!roomCode || !playerName || !reconnectToken) {
            return callback({ success: false, error: 'Room code, player name, and reconnect token are required' });
        }

        const room = gameManager.getRoom(roomCode.toUpperCase());
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        const nextReconnectToken = generateReconnectToken();
        const result = room.reconnectPlayer(socket.id, playerName, reconnectToken, nextReconnectToken);
        if (result.success) {
            socket.join(room.code);
            socket.roomCode = room.code;
            socket.playerId = socket.id;
            socket.isHost = false;

            console.log(`[Room ${room.code}] Player reconnected: ${playerName} (${socket.id})`);

            io.to(room.code).emit('room:playerReconnected', {
                playerId: socket.id,
                playerName
            });

            callback({
                success: true,
                reconnectToken: nextReconnectToken,
                gameState: room.getState()
            });
        } else {
            callback(result);
        }
    });

    // ======================================================================
    // JUDGE EVENTS (player who is the judge can control game from their device)
    // ======================================================================

    /**
     * Helper: check if the socket belongs to the current judge.
     */
    function getJudgeRoom(socket, callback) {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room) {
            if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
            return null;
        }
        const judge = room.getCurrentJudge();
        if (!judge || judge.id !== socket.id) {
            if (typeof callback === 'function') callback({ success: false, error: 'Not the current judge' });
            return null;
        }
        return room;
    }

    socket.on('judge:rollAlignment', (callback) => {
        const room = getJudgeRoom(socket, callback);
        if (!room) return;

        const result = room.rollAlignment();
        if (result.success) {
            const isJudgeChoice = result.alignment === 'U';
            io.to(room.code).emit('game:alignmentRolled', {
                alignment: result.alignment,
                fullName: result.fullName,
                isJudgeChoice
            });
        }
        callback(result);
    });

    socket.on('judge:selectJudgeAlignment', (alignment, callback) => {
        const room = getJudgeRoom(socket, callback);
        if (!room) return;

        const result = room.selectJudgeAlignment(alignment);
        if (result.success) {
            io.to(room.code).emit('game:judgeAlignmentSelected', {
                alignment: result.alignment,
                fullName: result.fullName
            });
        }
        callback(result);
    });

    socket.on('judge:drawPrompts', (callback) => {
        const room = getJudgeRoom(socket, callback);
        if (!room) return;

        const result = room.drawPrompts();
        if (result.success) {
            io.to(room.code).emit('game:promptsDrawn', {
                prompts: result.prompts
            });
        }
        callback(result);
    });

    socket.on('judge:selectPrompt', (index, callback) => {
        const room = getJudgeRoom(socket, callback);
        if (!room) return;

        const result = room.selectPrompt(index);
        if (result.success) {
            io.to(room.code).emit('game:promptSelected', {
                prompt: result.prompt,
                alignment: room.currentAlignment,
                alignmentFullName: room.currentAlignmentFullName
            });

            io.to(room.code).emit('game:startDrawing', {
                prompt: result.prompt,
                alignment: room.currentAlignment,
                alignmentFullName: room.currentAlignmentFullName,
                timeLimit: room.settings.timerDuration
            });
        }
        callback(result);
    });

    socket.on('judge:endDrawing', (callback) => {
        if (typeof callback !== 'function') return;
        const room = getJudgeRoom(socket, callback);
        if (!room) return;

        room.clearTimer();
        room.collectSubmissions();
        const submissions = room.getSubmissionsForJudging();

        io.to(room.code).emit('game:submissionsCollected', { submissions });
        callback({ success: true, submissions });
    });

    // ======================================================================
    // COMMON EVENTS
    // ======================================================================

    /**
     * game:getState
     * Returns the current game state for the socket's room.
     */
    socket.on('game:getState', (callback) => {
        const room = getRoom(socket, callback);
        if (!room) return;

        callback({ success: true, gameState: room.getState() });
    });

    /**
     * disconnect
     * Handles cleanup when a socket disconnects.
     * If the host disconnects, the room is given a grace period before closing.
     * If a player disconnects, they are marked as disconnected.
     */
    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);

        if (!socket.roomCode) return;

        const room = gameManager.getRoom(socket.roomCode);
        if (!room) return;

        if (socket.isHost) {
            console.log(`[Room ${room.code}] Host disconnected — waiting 60s before closing`);
            // Reset reconnect flag so the timer check works correctly
            room._hostReconnected = false;
            // Give the host a grace period to reconnect
            room._hostDisconnectTimer = setTimeout(() => {
                const currentRoom = gameManager.getRoom(socket.roomCode);
                if (currentRoom && !currentRoom._hostReconnected) {
                    console.log(`[Room ${room.code}] Host did not reconnect — closing room`);
                    io.to(room.code).emit('room:closed', {
                        reason: 'Host disconnected'
                    });
                    gameManager.removeRoom(socket.roomCode);
                }
            }, 60_000);
        } else {
            room.setPlayerDisconnected(socket.id);
            io.to(room.code).emit('room:playerDisconnected', {
                playerId: socket.id,
                players: room.getPlayersPublicData()
            });
        }
    });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
// Start periodic cleanup of inactive rooms
gameManager.startCleanupInterval();

httpServer.listen(PORT, () => {
    console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   ____           __          _   _                          │
  │  |  _ \\ ___ _ __|  _| ___  |_|_| |_ _  _                  │
  │  | |_) / _ \\ '__| |_ / _ \\/ __| __| | | |                 │
  │  |  __/  __/ |  |  _|  __/ (__| |_| |_| |                  │
  │  |_|   \\___|_|  |_|  \\___|\\___|\\___|\\__, |                 │
  │     _    _ _                      _ |___/                   │
  │    / \\  | (_) __ _ _ __   ___  __| |                        │
  │   / _ \\ | | |/ _\` | '_ \\ / _ \\/ _\` |                      │
  │  / ___ \\| | | (_| | | | |  __/ (_| |                        │
  │ /_/   \\_\\_|_|\\__, |_| |_|\\___|\\__,_|                       │
  │              |___/                                          │
  │                                                             │
  │  The creative party game for the morally dubious!           │
  │                                                             │
  │  Host a game:   http://localhost:${String(PORT).padEnd(5)}/host                 │
  │  Join a game:   http://localhost:${String(PORT).padEnd(5)}/play                 │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
    `);
});

function shutdown() {
    gameManager.shutdown();
    httpServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app, io };
