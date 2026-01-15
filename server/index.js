/**
 * Perfectly Aligned - Jackbox-style Multiplayer Server
 * Main server file with Express and Socket.IO
 * Includes security hardening and best practices
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const logger = require('./logger');
const GameManager = require('./game/GameManager');

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with security settings
const io = new Server(httpServer, {
    cors: {
        origin: config.NODE_ENV === 'production'
            ? config.CORS_ORIGINS
            : '*', // Allow all in development
        methods: ['GET', 'POST']
    },
    maxHttpBufferSize: config.SOCKET_MAX_HTTP_BUFFER_SIZE,
    pingTimeout: config.SOCKET_PING_TIMEOUT,
    pingInterval: config.SOCKET_PING_INTERVAL
});

// Initialize game manager
const gameManager = new GameManager();

// ==================== MIDDLEWARE ====================

// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            mediaSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false // Allow embedding for game display
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// ==================== RATE LIMITING ====================

// Simple in-memory rate limiter for socket events
const rateLimiters = new Map();

function checkRateLimit(socketId, eventName) {
    const key = `${socketId}:${eventName}`;
    const now = Date.now();
    const windowMs = config.RATE_LIMIT_WINDOW_MS;
    const maxEvents = config.RATE_LIMIT_MAX_EVENTS;

    if (!rateLimiters.has(key)) {
        rateLimiters.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    const limiter = rateLimiters.get(key);

    if (now > limiter.resetTime) {
        limiter.count = 1;
        limiter.resetTime = now + windowMs;
        return true;
    }

    limiter.count++;
    return limiter.count <= maxEvents;
}

// Cleanup old rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, limiter] of rateLimiters.entries()) {
        if (now > limiter.resetTime + 60000) { // Clean up entries older than 1 minute
            rateLimiters.delete(key);
        }
    }
}, 60000);

// ==================== ROUTES ====================

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

// Health check endpoint
app.get('/health', (req, res) => {
    const stats = gameManager.getStats();
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        stats
    });
});

// API endpoint to check room status
app.get('/api/room/:code', (req, res) => {
    const room = gameManager.getRoom(req.params.code.toUpperCase());
    if (room) {
        res.json({
            exists: true,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            gameStarted: room.gameStarted,
            canJoin: room.canJoin()
        });
    } else {
        res.json({ exists: false });
    }
});

// ==================== SOCKET.IO CONNECTION ====================

io.on('connection', (socket) => {
    logger.info('Socket', 'New connection', { socketId: socket.id });

    // Rate limit wrapper
    const rateLimitedHandler = (eventName, handler) => {
        return (...args) => {
            if (!checkRateLimit(socket.id, eventName)) {
                logger.warn('Socket', 'Rate limit exceeded', { socketId: socket.id, event: eventName });
                const callback = args[args.length - 1];
                if (typeof callback === 'function') {
                    callback({ success: false, error: 'Rate limit exceeded' });
                }
                return;
            }
            handler(...args);
        };
    };

    // ==================== HOST EVENTS ====================

    // Host creates a new room
    socket.on('host:createRoom', rateLimitedHandler('host:createRoom', (callback) => {
        const { room, hostToken } = gameManager.createRoom(socket.id);
        socket.join(room.code);
        socket.roomCode = room.code;
        socket.hostToken = hostToken;
        socket.isHost = true;

        logger.info('Room', 'Created', { roomCode: room.code, hostId: socket.id });

        callback({
            success: true,
            roomCode: room.code,
            hostToken, // Send token to client for authentication
            gameState: room.getState()
        });
    }));

    // Verify host authorization
    const verifyHost = (callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return null;
        }
        if (!socket.isHost || !socket.hostToken) {
            callback({ success: false, error: 'Not authorized' });
            return null;
        }
        // Verify host token
        const validRoomCode = gameManager.validateHostToken(socket.hostToken);
        if (validRoomCode !== socket.roomCode) {
            callback({ success: false, error: 'Invalid host token' });
            return null;
        }
        return room;
    };

    // Host starts the game
    socket.on('host:startGame', rateLimitedHandler('host:startGame', (settings, callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.startGame(settings);
        if (result.success) {
            io.to(room.code).emit('game:started', room.getState());
        }
        callback(result);
    }));

    // Host rolls alignment
    socket.on('host:rollAlignment', rateLimitedHandler('host:rollAlignment', (callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.rollAlignment();
        if (result.success) {
            io.to(room.code).emit('game:alignmentRolled', {
                alignment: result.alignment,
                fullName: result.fullName
            });
        }
        callback(result);
    }));

    // Host draws prompts
    socket.on('host:drawPrompts', rateLimitedHandler('host:drawPrompts', (callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.drawPrompts();
        if (result.success) {
            io.to(room.code).emit('game:promptsDrawn', {
                prompts: result.prompts
            });
        }
        callback(result);
    }));

    // Host selects a prompt
    socket.on('host:selectPrompt', rateLimitedHandler('host:selectPrompt', (promptIndex, callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.selectPrompt(promptIndex);
        if (result.success) {
            io.to(room.code).emit('game:promptSelected', {
                prompt: result.prompt,
                alignment: room.currentAlignment,
                alignmentFullName: room.currentAlignmentFullName
            });

            // Notify players to start drawing
            io.to(room.code).emit('game:startDrawing', {
                prompt: result.prompt,
                alignment: room.currentAlignment,
                alignmentFullName: room.currentAlignmentFullName,
                timeLimit: room.settings.timerDuration
            });
        }
        callback(result);
    }));

    // Host starts the timer
    socket.on('host:startTimer', rateLimitedHandler('host:startTimer', (duration, callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        room.startTimer(duration, (timeLeft) => {
            io.to(room.code).emit('game:timerTick', { timeLeft });
        }, () => {
            io.to(room.code).emit('game:timerEnd');
            room.collectSubmissions();
            io.to(room.code).emit('game:submissionsCollected', {
                submissions: room.getSubmissionsForJudging()
            });
        });

        io.to(room.code).emit('game:timerStarted', { duration });
        callback({ success: true });
    }));

    // Host selects winner
    socket.on('host:selectWinner', rateLimitedHandler('host:selectWinner', (playerId, callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.selectWinner(playerId);
        if (result.success) {
            io.to(room.code).emit('game:winnerSelected', {
                winnerId: playerId,
                winnerName: result.winnerName,
                scores: room.getScores(),
                players: room.getPlayersPublicData() // Include player data for avatar lookup
            });
        }
        callback(result);
    }));

    // Host awards tokens
    socket.on('host:awardTokens', rateLimitedHandler('host:awardTokens', (tokenAwards, callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.awardTokens(tokenAwards);
        if (result.success) {
            io.to(room.code).emit('game:tokensAwarded', {
                awards: tokenAwards,
                players: room.getPlayersPublicData()
            });
        }
        callback(result);
    }));

    // Host advances to next round
    socket.on('host:nextRound', rateLimitedHandler('host:nextRound', (callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.advanceRound();
        if (result.success) {
            if (result.gameOver) {
                io.to(room.code).emit('game:over', {
                    winner: result.winner,
                    finalScores: room.getScores()
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
    }));

    // Host kicks player
    socket.on('host:kickPlayer', rateLimitedHandler('host:kickPlayer', (playerId, callback) => {
        const room = verifyHost(callback);
        if (!room) return;

        const result = room.removePlayer(playerId);
        if (result.success) {
            // Find and disconnect the player's socket
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerSocket) {
                playerSocket.emit('player:kicked');
                playerSocket.leave(room.code);
            }

            io.to(room.code).emit('room:playerLeft', {
                playerId,
                players: room.getPlayersPublicData()
            });
        }
        callback(result);
    }));

    // ==================== PLAYER EVENTS ====================

    // Player joins a room
    socket.on('player:joinRoom', rateLimitedHandler('player:joinRoom', (data, callback) => {
        const { roomCode, playerName, avatar } = data;
        const room = gameManager.getRoom(roomCode?.toUpperCase());

        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        if (!room.canJoin()) {
            return callback({ success: false, error: 'Room is full or game has started' });
        }

        // Sanitize player name (basic server-side validation)
        const sanitizedName = String(playerName || '').trim().substring(0, config.MAX_NAME_LENGTH);
        if (sanitizedName.length < 1) {
            return callback({ success: false, error: 'Invalid player name' });
        }

        const result = room.addPlayer(socket.id, sanitizedName, avatar);
        if (result.success) {
            socket.join(room.code);
            socket.roomCode = room.code;
            socket.playerId = socket.id;
            socket.isHost = false;

            // Generate reconnection token
            const reconnectToken = gameManager.generateReconnectToken(socket.id, room.code, sanitizedName);

            logger.info('Room', 'Player joined', { roomCode: room.code, playerName: sanitizedName });

            // Notify everyone in the room
            io.to(room.code).emit('room:playerJoined', {
                player: result.player,
                players: room.getPlayersPublicData()
            });

            callback({
                success: true,
                playerId: socket.id,
                reconnectToken, // Send token for secure reconnection
                gameState: room.getState()
            });
        } else {
            callback(result);
        }
    }));

    // Player submits drawing
    socket.on('player:submitDrawing', rateLimitedHandler('player:submitDrawing', (drawingData, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        const result = room.submitDrawing(socket.id, drawingData);
        if (result.success) {
            // Notify host that a submission was received
            io.to(room.code).emit('game:submissionReceived', {
                playerId: socket.id,
                submissionCount: room.getSubmissionCount()
            });
        }
        callback(result);
    }));

    // Player uses steal ability
    socket.on('player:steal', rateLimitedHandler('player:steal', (targetPlayerId, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        const result = room.executeSteal(socket.id, targetPlayerId);
        if (result.success) {
            io.to(room.code).emit('game:stealExecuted', {
                stealerId: socket.id,
                stealerName: result.stealerName,
                targetId: targetPlayerId,
                targetName: result.targetName,
                scores: room.getScores()
            });

            // Check if steal caused a win
            if (result.gameOver) {
                io.to(room.code).emit('game:over', {
                    winner: result.winner,
                    finalScores: room.getScores()
                });
            }
        }
        callback(result);
    }));

    // Player reconnects using secure token
    socket.on('player:reconnect', rateLimitedHandler('player:reconnect', (data, callback) => {
        const { reconnectToken, roomCode, playerName } = data;

        // First try token-based reconnection (secure)
        if (reconnectToken) {
            const tokenData = gameManager.validateReconnectToken(reconnectToken);
            if (tokenData) {
                const room = gameManager.getRoom(tokenData.roomCode);
                if (room) {
                    const result = room.reconnectPlayer(tokenData.playerId, socket.id, tokenData.playerName);
                    if (result.success) {
                        socket.join(room.code);
                        socket.roomCode = room.code;
                        socket.playerId = socket.id;
                        socket.isHost = false;

                        logger.info('Room', 'Player reconnected via token', { roomCode: room.code, playerName: tokenData.playerName });

                        io.to(room.code).emit('room:playerReconnected', {
                            playerId: socket.id,
                            playerName: tokenData.playerName
                        });

                        return callback({
                            success: true,
                            gameState: room.getState()
                        });
                    }
                }
            }
        }

        // Fallback to name-based reconnection (less secure, for backwards compatibility)
        if (roomCode && playerName) {
            const room = gameManager.getRoom(roomCode.toUpperCase());
            if (room) {
                const result = room.reconnectPlayer(null, socket.id, playerName);
                if (result.success) {
                    socket.join(room.code);
                    socket.roomCode = room.code;
                    socket.playerId = socket.id;
                    socket.isHost = false;

                    logger.info('Room', 'Player reconnected via name', { roomCode: room.code, playerName });

                    io.to(room.code).emit('room:playerReconnected', {
                        playerId: socket.id,
                        playerName
                    });

                    return callback({
                        success: true,
                        gameState: room.getState()
                    });
                }
            }
        }

        callback({ success: false, error: 'Reconnection failed' });
    }));

    // ==================== COMMON EVENTS ====================

    // Get current game state
    socket.on('game:getState', rateLimitedHandler('game:getState', (callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }
        callback({ success: true, gameState: room.getState() });
    }));

    // Chat message (optional)
    socket.on('chat:message', rateLimitedHandler('chat:message', (message) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (room) {
            // Sanitize message
            const sanitizedMessage = String(message || '').trim().substring(0, 200);
            if (sanitizedMessage.length > 0) {
                io.to(room.code).emit('chat:message', {
                    playerId: socket.id,
                    message: sanitizedMessage,
                    timestamp: Date.now()
                });
            }
        }
    }));

    // Handle disconnection
    socket.on('disconnect', () => {
        logger.info('Socket', 'Disconnected', { socketId: socket.id });

        if (socket.roomCode) {
            const room = gameManager.getRoom(socket.roomCode);
            if (room) {
                if (socket.isHost) {
                    // Host disconnected - end the room
                    logger.info('Room', 'Host disconnected, closing room', { roomCode: room.code });
                    io.to(room.code).emit('room:closed', { reason: 'Host disconnected' });
                    gameManager.removeRoom(socket.roomCode);
                } else {
                    // Player disconnected
                    room.setPlayerDisconnected(socket.id);
                    io.to(room.code).emit('room:playerDisconnected', {
                        playerId: socket.id,
                        players: room.getPlayersPublicData()
                    });
                }
            }
        }
    });
});

// ==================== GRACEFUL SHUTDOWN ====================

function gracefulShutdown(signal) {
    logger.info('Server', `${signal} received, starting graceful shutdown`);

    // Stop accepting new connections
    httpServer.close(() => {
        logger.info('Server', 'HTTP server closed');

        // Clean up game manager
        gameManager.shutdown();

        // Close all socket connections
        io.close(() => {
            logger.info('Server', 'Socket.IO server closed');
            process.exit(0);
        });
    });

    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
        logger.error('Server', 'Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==================== START SERVER ====================

httpServer.listen(config.PORT, () => {
    logger.info('Server', 'Started', { port: config.PORT, env: config.NODE_ENV });

    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   Perfectly Aligned - Multiplayer Server                  ║
    ║                                                           ║
    ║   Host a game:   http://localhost:${config.PORT}/host              ║
    ║   Join a game:   http://localhost:${config.PORT}/play              ║
    ║   Health check:  http://localhost:${config.PORT}/health            ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, io };
