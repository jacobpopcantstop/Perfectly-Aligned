/**
 * Perfectly Aligned - Jackbox-style Multiplayer Server
 * Main server file with Express and Socket.IO
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameManager = require('./game/GameManager');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Initialize game manager
const gameManager = new GameManager();

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Routes
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

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // ==================== HOST EVENTS ====================

    // Host creates a new room
    socket.on('host:createRoom', (callback) => {
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
    });

    // Host starts the game
    socket.on('host:startGame', (settings, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

        const result = room.startGame(settings);
        if (result.success) {
            io.to(room.code).emit('game:started', room.getState());
        }
        callback(result);
    });

    // Host rolls alignment
    socket.on('host:rollAlignment', (callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

        const result = room.rollAlignment();
        if (result.success) {
            io.to(room.code).emit('game:alignmentRolled', {
                alignment: result.alignment,
                fullName: result.fullName
            });
        }
        callback(result);
    });

    // Host draws prompts
    socket.on('host:drawPrompts', (callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

        const result = room.drawPrompts();
        if (result.success) {
            io.to(room.code).emit('game:promptsDrawn', {
                prompts: result.prompts
            });
        }
        callback(result);
    });

    // Host selects a prompt
    socket.on('host:selectPrompt', (promptIndex, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

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
    });

    // Host starts the timer
    socket.on('host:startTimer', (duration, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

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
    });

    // Host selects winner
    socket.on('host:selectWinner', (playerId, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

        const result = room.selectWinner(playerId);
        if (result.success) {
            io.to(room.code).emit('game:winnerSelected', {
                winnerId: playerId,
                winnerName: result.winnerName,
                scores: room.getScores()
            });
        }
        callback(result);
    });

    // Host awards tokens
    socket.on('host:awardTokens', (tokenAwards, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

        const result = room.awardTokens(tokenAwards);
        if (result.success) {
            io.to(room.code).emit('game:tokensAwarded', {
                awards: tokenAwards,
                players: room.getPlayersPublicData()
            });
        }
        callback(result);
    });

    // Host advances to next round
    socket.on('host:nextRound', (callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

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
    });

    // Host kicks player
    socket.on('host:kickPlayer', (playerId, callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room || !socket.isHost) {
            return callback({ success: false, error: 'Not authorized' });
        }

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
    });

    // ==================== PLAYER EVENTS ====================

    // Player joins a room
    socket.on('player:joinRoom', (data, callback) => {
        const { roomCode, playerName, avatar } = data;
        const room = gameManager.getRoom(roomCode.toUpperCase());

        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        if (!room.canJoin()) {
            return callback({ success: false, error: 'Room is full or game has started' });
        }

        const result = room.addPlayer(socket.id, playerName, avatar);
        if (result.success) {
            socket.join(room.code);
            socket.roomCode = room.code;
            socket.playerId = socket.id;
            socket.isHost = false;

            console.log(`[Room ${room.code}] Player joined: ${playerName} (${socket.id})`);

            // Notify everyone in the room
            io.to(room.code).emit('room:playerJoined', {
                player: result.player,
                players: room.getPlayersPublicData()
            });

            callback({
                success: true,
                playerId: socket.id,
                gameState: room.getState()
            });
        } else {
            callback(result);
        }
    });

    // Player submits drawing
    socket.on('player:submitDrawing', (drawingData, callback) => {
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
    });

    // Player uses steal ability
    socket.on('player:steal', (targetPlayerId, callback) => {
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
    });

    // Player reconnects
    socket.on('player:reconnect', (data, callback) => {
        const { roomCode, playerId, playerName } = data;
        const room = gameManager.getRoom(roomCode.toUpperCase());

        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        const result = room.reconnectPlayer(playerId, socket.id, playerName);
        if (result.success) {
            socket.join(room.code);
            socket.roomCode = room.code;
            socket.playerId = socket.id;
            socket.isHost = false;

            console.log(`[Room ${room.code}] Player reconnected: ${playerName}`);

            io.to(room.code).emit('room:playerReconnected', {
                playerId: socket.id,
                playerName
            });

            callback({
                success: true,
                gameState: room.getState()
            });
        } else {
            callback(result);
        }
    });

    // ==================== COMMON EVENTS ====================

    // Get current game state
    socket.on('game:getState', (callback) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }
        callback({ success: true, gameState: room.getState() });
    });

    // Chat message (optional)
    socket.on('chat:message', (message) => {
        const room = gameManager.getRoom(socket.roomCode);
        if (room) {
            io.to(room.code).emit('chat:message', {
                playerId: socket.id,
                message,
                timestamp: Date.now()
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);

        if (socket.roomCode) {
            const room = gameManager.getRoom(socket.roomCode);
            if (room) {
                if (socket.isHost) {
                    // Host disconnected - end the room
                    console.log(`[Room ${room.code}] Host disconnected, closing room`);
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

// Start server
httpServer.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   Perfectly Aligned - Multiplayer Server                  ║
    ║                                                           ║
    ║   Host a game:   http://localhost:${PORT}/host              ║
    ║   Join a game:   http://localhost:${PORT}/play              ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, io };
