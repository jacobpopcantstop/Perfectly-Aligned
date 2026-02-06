import Room from './Room.js';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_CODE_LENGTH = 4;
const MAX_CODE_GENERATION_ATTEMPTS = 100;
const DEFAULT_INACTIVE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Manages all active game rooms for the Perfectly Aligned multiplayer party game.
 * Handles room lifecycle, player-to-room mapping, and periodic cleanup of stale rooms.
 */
class GameManager {
    constructor({ inactiveTimeoutMs = DEFAULT_INACTIVE_TIMEOUT_MS } = {}) {
        this.rooms = new Map();
        this.playerRoomMap = new Map();
        this.inactiveTimeoutMs = inactiveTimeoutMs;
        this._cleanupInterval = null;
    }

    /**
     * Generate a unique 4-letter room code.
     * Letters I and O are excluded to avoid visual confusion with 1 and 0.
     * @returns {string} A unique uppercase room code.
     * @throws {Error} If a unique code cannot be generated after maximum attempts.
     */
    generateRoomCode() {
        for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
            let code = '';
            for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
                code += ROOM_CODE_CHARS.charAt(
                    Math.floor(Math.random() * ROOM_CODE_CHARS.length)
                );
            }
            if (!this.rooms.has(code)) {
                return code;
            }
        }
        throw new Error('Failed to generate a unique room code');
    }

    /**
     * Create a new game room with a unique code.
     * @param {string} hostId - Socket ID of the host creating the room.
     * @returns {Room} The newly created Room instance.
     */
    createRoom(hostId) {
        const code = this.generateRoomCode();
        const room = new Room(code, hostId);
        this.rooms.set(code, room);
        return room;
    }

    /**
     * Retrieve a room by its code (case-insensitive).
     * @param {string} code - The room code to look up.
     * @returns {Room|undefined} The Room instance, or undefined if not found.
     */
    getRoom(code) {
        if (!code) return undefined;
        return this.rooms.get(code.toUpperCase());
    }

    /**
     * Remove a room and clean up its resources.
     * Also removes all player-to-room mappings that reference this room.
     * @param {string} code - The room code to remove.
     * @returns {boolean} True if the room existed and was removed.
     */
    removeRoom(code) {
        const room = this.rooms.get(code);
        if (!room) return false;

        room.cleanup();

        for (const [playerId, roomCode] of this.playerRoomMap) {
            if (roomCode === code) {
                this.playerRoomMap.delete(playerId);
            }
        }

        this.rooms.delete(code);
        return true;
    }

    /**
     * Register a player-to-room mapping for reconnection support.
     * @param {string} playerId - The player's socket ID.
     * @param {string} roomCode - The room code the player belongs to.
     */
    registerPlayer(playerId, roomCode) {
        this.playerRoomMap.set(playerId, roomCode);
    }

    /**
     * Remove a player's room mapping.
     * @param {string} playerId - The player's socket ID.
     */
    unregisterPlayer(playerId) {
        this.playerRoomMap.delete(playerId);
    }

    /**
     * Look up which room a player belongs to.
     * @param {string} playerId - The player's socket ID.
     * @returns {Room|undefined} The Room the player is in, or undefined.
     */
    getRoomByPlayerId(playerId) {
        const code = this.playerRoomMap.get(playerId);
        return code ? this.getRoom(code) : undefined;
    }

    /**
     * Get the room code a player is mapped to.
     * @param {string} playerId - The player's socket ID.
     * @returns {string|undefined} The room code, or undefined.
     */
    getRoomCodeByPlayerId(playerId) {
        return this.playerRoomMap.get(playerId);
    }

    /**
     * Get aggregate statistics about all managed rooms.
     * @returns {{ totalRooms: number, activeGames: number, totalPlayers: number }}
     */
    getStats() {
        let activeGames = 0;
        let totalPlayers = 0;

        for (const room of this.rooms.values()) {
            totalPlayers += room.players.length;
            if (room.gameStarted) {
                activeGames++;
            }
        }

        return {
            totalRooms: this.rooms.size,
            activeGames,
            totalPlayers
        };
    }

    /**
     * Remove rooms that have been inactive longer than the configured timeout.
     * @param {number} [timeoutMs=this.inactiveTimeoutMs] - Inactivity threshold in milliseconds.
     * @returns {string[]} Array of room codes that were removed.
     */
    cleanupInactiveRooms(timeoutMs = this.inactiveTimeoutMs) {
        const now = Date.now();
        const removed = [];

        for (const [code, room] of this.rooms) {
            if (now - room.lastActivity > timeoutMs) {
                this.removeRoom(code);
                removed.push(code);
            }
        }

        return removed;
    }

    /**
     * Start a periodic cleanup interval that removes inactive rooms.
     * @param {number} [intervalMs=60000] - How often to run cleanup, in milliseconds.
     * @param {number} [timeoutMs=this.inactiveTimeoutMs] - Inactivity threshold in milliseconds.
     */
    startCleanupInterval(intervalMs = 60_000, timeoutMs = this.inactiveTimeoutMs) {
        this.stopCleanupInterval();
        this._cleanupInterval = setInterval(() => {
            this.cleanupInactiveRooms(timeoutMs);
        }, intervalMs);
    }

    /**
     * Stop the periodic cleanup interval.
     */
    stopCleanupInterval() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }
    }

    /**
     * Shut down the manager, cleaning up all rooms and stopping intervals.
     */
    shutdown() {
        this.stopCleanupInterval();
        for (const code of [...this.rooms.keys()]) {
            this.removeRoom(code);
        }
    }
}

export default GameManager;
