/**
 * Simple Structured Logger
 * Provides consistent logging format with levels
 */

const config = require('./config');

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[config.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatMessage(level, context, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        context,
        message
    };

    if (data) {
        logEntry.data = data;
    }

    return JSON.stringify(logEntry);
}

function log(level, context, message, data = null) {
    if (LOG_LEVELS[level] <= currentLevel) {
        const formatted = formatMessage(level, context, message, data);

        switch (level) {
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
        }
    }
}

const logger = {
    error: (context, message, data) => log('error', context, message, data),
    warn: (context, message, data) => log('warn', context, message, data),
    info: (context, message, data) => log('info', context, message, data),
    debug: (context, message, data) => log('debug', context, message, data)
};

module.exports = logger;
