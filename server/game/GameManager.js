/**
 * GameManager - Manages all active game rooms
 */

const crypto = require('crypto');
const Room = require('./Room');
const config = require('../config');
const logger = require('../logger');

class GameManager {
    constructor() {
        this.rooms = new Map();
        this.playerRoomMap = new Map(); // Map playerId to roomCode
        this.hostTokens = new Map(); // Map hostToken to roomCode for authentication
        this.reconnectTokens = new Map(); // Map reconnectToken to player info

        // Start automatic room cleanup
        this.cleanupInterval = setInterval(
            () => this.cleanupInactiveRooms(),
            config.ROOM_CLEANUP_INTERVAL_MS
        );

        logger.info('GameManager', 'Initialized with automatic room cleanup');
    }

    /**
     * Generate a cryptographically secure room code
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (I, O, 0, 1)
        const codeLength = config.ROOM_CODE_LENGTH;
        let code;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            // Use crypto.randomBytes for secure random generation
            const randomBytes = crypto.randomBytes(codeLength);
            code = '';
            for (let i = 0; i < codeLength; i++) {
                code += chars.charAt(randomBytes[i] % chars.length);
            }
            attempts++;
        } while (this.rooms.has(code) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            logger.warn('GameManager', 'Max attempts reached for room code generation');
            // Add extra character for uniqueness
            const extraByte = crypto.randomBytes(1);
            code += chars.charAt(extraByte[0] % chars.length);
        }

        return code;
    }

    /**
     * Generate a secure host authentication token
     */
    generateHostToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate a secure reconnection token for a player
     */
    generateReconnectToken(playerId, roomCode, playerName) {
        const token = crypto.randomBytes(32).toString('hex');
        this.reconnectTokens.set(token, {
            playerId,
            roomCode,
            playerName,
            createdAt: Date.now()
        });
        return token;
    }

    /**
     * Validate and consume a reconnection token
     */
    validateReconnectToken(token) {
        const tokenData = this.reconnectTokens.get(token);
        if (!tokenData) {
            return null;
        }

        // Check if token is expired
        if (Date.now() - tokenData.createdAt > config.RECONNECT_TOKEN_EXPIRY_MS) {
            this.reconnectTokens.delete(token);
            return null;
        }

        // Token is valid - don't delete it yet, allow multiple reconnect attempts
        return tokenData;
    }

    /**
     * Create a new game room
     */
    createRoom(hostId) {
        const code = this.generateRoomCode();
        const hostToken = this.generateHostToken();
        const room = new Room(code, hostId);

        this.rooms.set(code, room);
        this.hostTokens.set(hostToken, { roomCode: code, createdAt: Date.now() });

        logger.info('GameManager', 'Room created', { roomCode: code, hostId });

        return { room, hostToken };
    }

    /**
     * Validate host token and return room code if valid
     */
    validateHostToken(token) {
        const tokenData = this.hostTokens.get(token);
        if (!tokenData) {
            return null;
        }

        // Check if token is expired
        if (Date.now() - tokenData.createdAt > config.HOST_TOKEN_EXPIRY_MS) {
            this.hostTokens.delete(token);
            return null;
        }

        return tokenData.roomCode;
    }

    /**
     * Get a room by code
     */
    getRoom(code) {
        return this.rooms.get(code?.toUpperCase());
    }

    /**
     * Remove a room
     */
    removeRoom(code) {
        const room = this.rooms.get(code);
        if (room) {
            // Clear any timers
            room.cleanup();

            // Remove associated host tokens
            for (const [token, data] of this.hostTokens.entries()) {
                if (data.roomCode === code) {
                    this.hostTokens.delete(token);
                }
            }

            // Remove associated reconnect tokens
            for (const [token, data] of this.reconnectTokens.entries()) {
                if (data.roomCode === code) {
                    this.reconnectTokens.delete(token);
                }
            }

            this.rooms.delete(code);
            logger.info('GameManager', 'Room removed', { roomCode: code });
            return true;
        }
        return false;
    }

    /**
     * Get room by player ID
     */
    getRoomByPlayerId(playerId) {
        const code = this.playerRoomMap.get(playerId);
        return code ? this.getRoom(code) : null;
    }

    /**
     * Register player to room mapping
     */
    registerPlayer(playerId, roomCode) {
        this.playerRoomMap.set(playerId, roomCode);
    }

    /**
     * Unregister player
     */
    unregisterPlayer(playerId) {
        this.playerRoomMap.delete(playerId);
    }

    /**
     * Get stats about active rooms
     */
    getStats() {
        let totalPlayers = 0;
        let activeGames = 0;

        this.rooms.forEach(room => {
            totalPlayers += room.players.length;
            if (room.gameStarted) activeGames++;
        });

        return {
            totalRooms: this.rooms.size,
            activeGames,
            totalPlayers
        };
    }

    /**
     * Clean up inactive rooms (called automatically)
     */
    cleanupInactiveRooms() {
        const now = Date.now();
        const maxInactiveMs = config.ROOM_MAX_INACTIVE_MS;
        let cleanedCount = 0;

        this.rooms.forEach((room, code) => {
            if (now - room.lastActivity > maxInactiveMs) {
                logger.info('GameManager', 'Cleaning up inactive room', { roomCode: code });
                this.removeRoom(code);
                cleanedCount++;
            }
        });

        // Also clean up expired tokens
        for (const [token, data] of this.hostTokens.entries()) {
            if (now - data.createdAt > config.HOST_TOKEN_EXPIRY_MS) {
                this.hostTokens.delete(token);
            }
        }

        for (const [token, data] of this.reconnectTokens.entries()) {
            if (now - data.createdAt > config.RECONNECT_TOKEN_EXPIRY_MS) {
                this.reconnectTokens.delete(token);
            }
        }

        if (cleanedCount > 0) {
            logger.info('GameManager', 'Cleanup complete', { cleanedRooms: cleanedCount });
        }
    }

    /**
     * Graceful shutdown - clean up all rooms
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.rooms.forEach((room, code) => {
            room.cleanup();
        });

        this.rooms.clear();
        this.hostTokens.clear();
        this.reconnectTokens.clear();
        this.playerRoomMap.clear();

        logger.info('GameManager', 'Shutdown complete');
    }
}

module.exports = GameManager;
