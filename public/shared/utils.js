/**
 * Shared Utilities - Client-side
 * Contains security functions and shared helpers
 */

// ==================== SECURITY UTILITIES ====================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create a text element safely (no innerHTML)
 * @param {string} tag - The HTML tag name
 * @param {string} text - The text content
 * @param {string} className - Optional class name
 * @returns {HTMLElement}
 */
function createTextElement(tag, text, className = '') {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
}

/**
 * Validate that a string is a valid base64 PNG data URL
 * @param {string} dataUrl - The data URL to validate
 * @returns {boolean}
 */
function isValidPngDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string') return false;
    if (!dataUrl.startsWith('data:image/png;base64,')) return false;

    // Check that the base64 part is valid
    const base64Part = dataUrl.substring(22);
    if (base64Part.length === 0) return false;

    // Basic base64 validation
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(base64Part);
}

/**
 * Validate avatar filename (only allow known avatars)
 * @param {string} avatar - The avatar filename
 * @returns {string} - The validated avatar or default
 */
function validateAvatar(avatar) {
    const validAvatars = [
        'alienlady_avatar.png',
        'dadskeletonts_avatar.png',
        'chessqueen_avatar.png'
    ];
    return validAvatars.includes(avatar) ? avatar : validAvatars[0];
}

// ==================== UI UTILITIES ====================

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {number} duration - Duration in ms (default 3000)
 */
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, duration);
}

/**
 * Format seconds to MM:SS display
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ==================== CONSTANTS ====================

const GAME_CONSTANTS = {
    MAX_PLAYERS: 8,
    MIN_PLAYERS: 3,
    MAX_NAME_LENGTH: 10,
    ROOM_CODE_LENGTH: 4,
    DEFAULT_TIMER_DURATION: 90,
    DEFAULT_TARGET_SCORE: 5,
    LARGE_GAME_TARGET_SCORE: 3,
    LARGE_GAME_THRESHOLD: 6,
    ALIGNMENT_FLICKER_COUNT: 15,
    MAX_DRAWING_SIZE_BYTES: 500000, // 500KB
    NOTIFICATION_DURATION: 3000,
    RECONNECT_DELAY: 3000
};

// Export for module usage if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        createTextElement,
        isValidPngDataUrl,
        validateAvatar,
        showNotification,
        formatTime,
        GAME_CONSTANTS
    };
}
