/**
 * Server Configuration
 * Centralized configuration with environment variable support
 */

const config = {
    // Server settings
    PORT: parseInt(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // CORS settings - restrict in production
    CORS_ORIGINS: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],

    // Game settings
    MAX_PLAYERS: 8,
    MIN_PLAYERS: 3,
    MAX_NAME_LENGTH: 10,
    ROOM_CODE_LENGTH: 6, // Increased from 4 for better security
    DEFAULT_TIMER_DURATION: 90,
    DEFAULT_TARGET_SCORE: 5,
    LARGE_GAME_TARGET_SCORE: 3,
    LARGE_GAME_THRESHOLD: 6,

    // Security settings
    MAX_DRAWING_SIZE_BYTES: 500000, // 500KB max drawing size
    RATE_LIMIT_WINDOW_MS: 1000, // 1 second window
    RATE_LIMIT_MAX_EVENTS: 10, // Max events per window
    HOST_TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
    RECONNECT_TOKEN_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes

    // Room management
    ROOM_CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Check every 5 minutes
    ROOM_MAX_INACTIVE_MS: 30 * 60 * 1000, // 30 minutes inactive = cleanup

    // Socket.IO settings
    SOCKET_MAX_HTTP_BUFFER_SIZE: 1e6, // 1MB
    SOCKET_PING_TIMEOUT: 20000,
    SOCKET_PING_INTERVAL: 25000,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Freeze config to prevent accidental modification
Object.freeze(config);

module.exports = config;
