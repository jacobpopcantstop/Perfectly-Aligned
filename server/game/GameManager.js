/**
 * GameManager - Manages all active game rooms
 */

const Room = require('./Room');

class GameManager {
    constructor() {
        this.rooms = new Map();
        this.playerRoomMap = new Map(); // Map playerId to roomCode
    }

    /**
     * Generate a unique 4-character room code
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I and O to avoid confusion
        let code;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;
        } while (this.rooms.has(code) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            // Fallback to longer code
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return code;
    }

    /**
     * Create a new game room
     */
    createRoom(hostId) {
        const code = this.generateRoomCode();
        const room = new Room(code, hostId);
        this.rooms.set(code, room);

        console.log(`[GameManager] Room created: ${code}`);
        return room;
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
            this.rooms.delete(code);
            console.log(`[GameManager] Room removed: ${code}`);
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
     * Clean up inactive rooms (call periodically)
     */
    cleanupInactiveRooms(maxInactiveMinutes = 30) {
        const now = Date.now();
        const maxInactiveMs = maxInactiveMinutes * 60 * 1000;

        this.rooms.forEach((room, code) => {
            if (now - room.lastActivity > maxInactiveMs) {
                console.log(`[GameManager] Cleaning up inactive room: ${code}`);
                this.removeRoom(code);
            }
        });
    }
}

module.exports = GameManager;
