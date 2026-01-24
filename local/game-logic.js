/**
 * Perfectly Aligned - Game Logic Module
 * ======================================
 * Clean ES6 class handling all game state and logic.
 * This module is UI-agnostic and can be used with any frontend.
 *
 * @version 4.0.0
 * @license MIT
 */

import {
    AVATARS,
    ALIGNMENTS,
    ALIGNMENT_NAMES,
    ALIGNMENT_EXAMPLES,
    ALIGNMENT_GRID_ORDER,
    TOKEN_TYPES,
    TOKEN_TYPE_KEYS,
    MODIFIERS,
    THEMED_DECKS,
    DECK_METADATA,
    GAME_DEFAULTS,
    GAME_PHASES,
    shuffleArray,
    buildPromptPool,
    getRandomElement,
    getRandomModifier,
    getRandomAlignment,
    createInitialTokenState,
    getTotalTokenCount,
    sanitizePlayerName
} from '../shared/game-data.js';

// Re-export game data for UI access
export {
    AVATARS,
    ALIGNMENTS,
    ALIGNMENT_NAMES,
    ALIGNMENT_EXAMPLES,
    ALIGNMENT_GRID_ORDER,
    TOKEN_TYPES,
    TOKEN_TYPE_KEYS,
    MODIFIERS,
    THEMED_DECKS,
    DECK_METADATA,
    GAME_DEFAULTS,
    GAME_PHASES,
    getTotalTokenCount
};

/**
 * Creates a new player object with default values
 * @param {string} name - Player's display name
 * @param {string} avatar - Player's avatar emoji
 * @param {number} index - Player's index
 * @returns {Object} Player object
 */
function createPlayer(name, avatar, index) {
    return {
        id: index,
        name: name || `Player ${index + 1}`,
        avatar: avatar || AVATARS[index % AVATARS.length],
        score: 0,
        tokens: createInitialTokenState(),
        activeModifiers: [],
        heldCurse: null,
        tempModifier: null
    };
}

/**
 * GameLogic Class
 * Manages all game state and business logic
 */
export class GameLogic {
    constructor() {
        this.reset();
        this._eventListeners = new Map();
    }

    /**
     * Reset game state to initial values
     */
    reset() {
        this.state = {
            phase: GAME_PHASES.SETUP,
            players: [],
            currentJudgeIndex: 0,
            selectedDecks: ['core_white'],
            promptPool: [],
            currentAlignment: null,
            rolledAlignment: null,
            lastAlignment: null,
            currentPrompts: [],
            selectedPrompt: null,
            targetScore: GAME_DEFAULTS.defaultTargetScore,
            roundWinner: null,
            roundNumber: 1,
            drawingTimeSeconds: GAME_DEFAULTS.defaultDrawingTime,
            timerSeconds: GAME_DEFAULTS.defaultDrawingTime,
            tokensAwardedThisRound: [],
            modifiersEnabled: true,
            pendingModifiers: []
        };
    }

    // =========================================================================
    // EVENT SYSTEM - For UI to subscribe to state changes
    // =========================================================================

    /**
     * Subscribe to game events
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    on(event, callback) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(callback);
    }

    /**
     * Unsubscribe from game events
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        if (this._eventListeners.has(event)) {
            const listeners = this._eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    _emit(event, data) {
        if (this._eventListeners.has(event)) {
            this._eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // =========================================================================
    // GETTERS - Read-only access to game state
    // =========================================================================

    get phase() { return this.state.phase; }
    get players() { return this.state.players; }
    get currentJudge() { return this.state.players[this.state.currentJudgeIndex]; }
    get currentJudgeIndex() { return this.state.currentJudgeIndex; }
    get roundNumber() { return this.state.roundNumber; }
    get currentAlignment() { return this.state.currentAlignment; }
    get rolledAlignment() { return this.state.rolledAlignment; }
    get currentPrompts() { return this.state.currentPrompts; }
    get selectedPrompt() { return this.state.selectedPrompt; }
    get targetScore() { return this.state.targetScore; }
    get drawingTimeSeconds() { return this.state.drawingTimeSeconds; }
    get timerSeconds() { return this.state.timerSeconds; }
    get roundWinner() { return this.state.roundWinner; }
    get modifiersEnabled() { return this.state.modifiersEnabled; }

    /**
     * Get players sorted by score (descending), then by token count
     * @returns {Array} Sorted array of player objects with original indices
     */
    getSortedPlayers() {
        return this.state.players
            .map((player, index) => ({
                player,
                index,
                tokenCount: getTotalTokenCount(player.tokens)
            }))
            .sort((a, b) => {
                if (b.player.score !== a.player.score) {
                    return b.player.score - a.player.score;
                }
                return b.tokenCount - a.tokenCount;
            });
    }

    /**
     * Get players with active modifiers (cursed players)
     * @returns {Array} Array of {player, index} for cursed players
     */
    getCursedPlayers() {
        return this.state.players
            .map((player, index) => ({ player, index }))
            .filter(({ player }) => player.activeModifiers && player.activeModifiers.length > 0);
    }

    /**
     * Get players in last place (lowest score)
     * @returns {Array} Array of {player, index} for last place players
     */
    getLastPlacePlayers() {
        const lowestScore = Math.min(...this.state.players.map(p => p.score));
        return this.state.players
            .map((player, index) => ({ player, index }))
            .filter(({ player }) => player.score === lowestScore);
    }

    /**
     * Check if a player can steal a point (has enough tokens)
     * @param {number} playerIndex - Index of the player
     * @returns {boolean}
     */
    canPlayerSteal(playerIndex) {
        const player = this.state.players[playerIndex];
        if (!player || playerIndex === this.state.currentJudgeIndex) return false;
        return getTotalTokenCount(player.tokens) >= GAME_DEFAULTS.tokensToSteal;
    }

    /**
     * Check if judge can reroll prompts
     * @returns {boolean}
     */
    canJudgeReroll() {
        const judge = this.currentJudge;
        return getTotalTokenCount(judge.tokens) >= GAME_DEFAULTS.tokensToReroll;
    }

    /**
     * Get valid steal targets for a player
     * @param {number} stealerIndex - Index of the stealing player
     * @returns {Array} Array of {player, index} for valid targets
     */
    getStealTargets(stealerIndex) {
        return this.state.players
            .map((player, index) => ({ player, index }))
            .filter(({ player, index }) => index !== stealerIndex && player.score > 0);
    }

    /**
     * Check if a token type has been awarded this round
     * @param {string} tokenType - Token type key
     * @returns {boolean}
     */
    isTokenAwarded(tokenType) {
        return this.state.tokensAwardedThisRound.includes(tokenType);
    }

    // =========================================================================
    // GAME SETUP
    // =========================================================================

    /**
     * Initialize game with players and settings
     * @param {Object} config - Game configuration
     * @param {Array<{name: string, avatar: string}>} config.players - Player configs
     * @param {Array<string>} config.decks - Selected deck keys
     * @param {number} config.targetScore - Points needed to win
     * @param {number} config.drawingTime - Seconds for drawing phase
     * @param {boolean} config.modifiersEnabled - Whether curse cards are active
     * @returns {Object} Result with success status and any errors
     */
    initializeGame({ players, decks, targetScore, drawingTime, modifiersEnabled = true }) {
        // Validate player count
        if (players.length < GAME_DEFAULTS.minPlayers ||
            players.length > GAME_DEFAULTS.maxPlayers) {
            return {
                success: false,
                error: `Player count must be between ${GAME_DEFAULTS.minPlayers} and ${GAME_DEFAULTS.maxPlayers}`
            };
        }

        // Validate decks
        if (!decks || decks.length === 0) {
            return { success: false, error: 'At least one deck must be selected' };
        }

        const validDecks = decks.filter(d => THEMED_DECKS[d]);
        if (validDecks.length === 0) {
            return { success: false, error: 'No valid decks selected' };
        }

        // Reset state and configure game
        this.reset();

        // Create player objects
        this.state.players = players.map((p, i) => createPlayer(
            sanitizePlayerName(p.name) || `Player ${i + 1}`,
            p.avatar || AVATARS[i % AVATARS.length],
            i
        ));

        // Set game options
        this.state.selectedDecks = validDecks;
        this.state.promptPool = buildPromptPool(validDecks);
        this.state.targetScore = targetScore || GAME_DEFAULTS.defaultTargetScore;
        this.state.drawingTimeSeconds = drawingTime ?? GAME_DEFAULTS.defaultDrawingTime;
        this.state.modifiersEnabled = modifiersEnabled;

        // Random starting judge
        this.state.currentJudgeIndex = Math.floor(Math.random() * this.state.players.length);

        this._emit('gameInitialized', { players: this.state.players });
        return { success: true };
    }

    /**
     * Start a new round
     */
    startNewRound() {
        this.state.roundWinner = null;
        this.state.currentAlignment = null;
        this.state.rolledAlignment = null;
        this.state.currentPrompts = [];
        this.state.selectedPrompt = null;
        this.state.tokensAwardedThisRound = [];

        // Clear active modifiers from previous round
        this.state.players.forEach(player => {
            player.activeModifiers = [];
        });

        // Apply pending modifiers from last round
        this.state.pendingModifiers.forEach(({ targetIndex, modifier }) => {
            this.state.players[targetIndex].activeModifiers.push(modifier);
        });
        this.state.pendingModifiers = [];

        this.state.phase = GAME_PHASES.JUDGE_ROLL;

        this._emit('roundStarted', {
            roundNumber: this.state.roundNumber,
            judge: this.currentJudge,
            judgeIndex: this.state.currentJudgeIndex,
            cursedPlayers: this.getCursedPlayers()
        });
    }

    // =========================================================================
    // ALIGNMENT PHASE
    // =========================================================================

    /**
     * Roll for alignment
     * @returns {Object} Roll result with alignment code and full info
     */
    rollAlignment() {
        let alignment;
        let attempts = 0;

        // Try to avoid same alignment as last round
        do {
            alignment = getRandomAlignment(true);
            attempts++;
        } while (alignment === this.state.lastAlignment && attempts < 5);

        this.state.rolledAlignment = alignment;
        this.state.currentAlignment = alignment;
        this.state.lastAlignment = alignment;

        const isJudgeChoice = alignment === 'U';
        this.state.phase = isJudgeChoice ? GAME_PHASES.JUDGE_CHOICE : GAME_PHASES.JUDGE_ROLL;

        const result = {
            alignment,
            name: ALIGNMENT_NAMES[alignment],
            examples: ALIGNMENT_EXAMPLES[alignment],
            isJudgeChoice
        };

        this._emit('alignmentRolled', result);
        return result;
    }

    /**
     * Judge selects an alignment (when U is rolled)
     * @param {string} alignment - Selected alignment code
     * @returns {Object} Selection result
     */
    selectJudgeAlignment(alignment) {
        if (this.state.rolledAlignment !== 'U') {
            return { success: false, error: 'Judge choice not available' };
        }

        if (!ALIGNMENT_GRID_ORDER.includes(alignment)) {
            return { success: false, error: 'Invalid alignment' };
        }

        this.state.currentAlignment = alignment;
        this.state.phase = GAME_PHASES.PROMPT_SELECTION;

        const result = {
            success: true,
            alignment,
            name: ALIGNMENT_NAMES[alignment],
            examples: ALIGNMENT_EXAMPLES[alignment]
        };

        this._emit('judgeAlignmentSelected', result);
        return result;
    }

    // =========================================================================
    // PROMPT PHASE
    // =========================================================================

    /**
     * Draw prompts for the judge to choose from
     * @returns {Object} Draw result with prompts array
     */
    drawPrompts() {
        if (this.state.rolledAlignment === 'U' && this.state.currentAlignment === 'U') {
            return { success: false, error: 'Must select alignment first' };
        }

        const prompts = [];
        const available = [...this.state.promptPool];

        for (let i = 0; i < GAME_DEFAULTS.promptsPerDraw && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            prompts.push(available[index]);
            available.splice(index, 1);
        }

        this.state.currentPrompts = prompts;
        this.state.phase = GAME_PHASES.PROMPT_SELECTION;

        this._emit('promptsDrawn', { prompts });
        return { success: true, prompts };
    }

    /**
     * Judge spends a token to redraw prompts
     * @returns {Object} Reroll result
     */
    rerollPrompts() {
        if (!this.canJudgeReroll()) {
            return { success: false, error: 'Not enough tokens to reroll' };
        }

        const judge = this.currentJudge;

        // Spend one token (any type, in order)
        for (const type of TOKEN_TYPE_KEYS) {
            if (judge.tokens[type] > 0) {
                judge.tokens[type]--;
                break;
            }
        }

        this._emit('tokensSpent', {
            playerIndex: this.state.currentJudgeIndex,
            amount: 1,
            reason: 'reroll'
        });

        return this.drawPrompts();
    }

    /**
     * Judge selects a prompt
     * @param {string} prompt - The selected prompt text
     * @returns {Object} Selection result
     */
    selectPrompt(prompt) {
        if (!this.state.currentPrompts.includes(prompt)) {
            return { success: false, error: 'Invalid prompt selection' };
        }

        this.state.selectedPrompt = prompt;
        this.state.phase = GAME_PHASES.DRAWING;
        this.state.timerSeconds = this.state.drawingTimeSeconds;

        this._emit('promptSelected', {
            prompt,
            alignment: this.state.currentAlignment,
            alignmentName: ALIGNMENT_NAMES[this.state.currentAlignment],
            drawingTime: this.state.drawingTimeSeconds
        });

        return { success: true, prompt };
    }

    // =========================================================================
    // TIMER MANAGEMENT (Called by UI)
    // =========================================================================

    /**
     * Update timer (called each second by UI)
     * @returns {Object} Timer state
     */
    tickTimer() {
        if (this.state.timerSeconds > 0) {
            this.state.timerSeconds--;
        }

        const isWarning = this.state.timerSeconds <= GAME_DEFAULTS.timerWarningThreshold;
        const isExpired = this.state.timerSeconds <= 0;

        this._emit('timerTick', {
            seconds: this.state.timerSeconds,
            isWarning,
            isExpired
        });

        return { seconds: this.state.timerSeconds, isWarning, isExpired };
    }

    // =========================================================================
    // JUDGING PHASE
    // =========================================================================

    /**
     * End drawing phase and start judging
     */
    startJudgingPhase() {
        this.state.phase = GAME_PHASES.JUDGING;

        // Get non-judge players
        const contestants = this.state.players
            .map((player, index) => ({ player, index }))
            .filter(({ index }) => index !== this.state.currentJudgeIndex);

        this._emit('judgingStarted', {
            contestants,
            alignment: this.state.currentAlignment,
            alignmentName: ALIGNMENT_NAMES[this.state.currentAlignment],
            prompt: this.state.selectedPrompt
        });
    }

    /**
     * Judge selects a winner
     * @param {number} winnerIndex - Index of the winning player
     * @returns {Object} Winner selection result
     */
    selectWinner(winnerIndex) {
        if (winnerIndex === this.state.currentJudgeIndex) {
            return { success: false, error: 'Judge cannot win their own round' };
        }

        if (winnerIndex < 0 || winnerIndex >= this.state.players.length) {
            return { success: false, error: 'Invalid player index' };
        }

        this.state.roundWinner = winnerIndex;
        this.state.players[winnerIndex].score++;

        const winner = this.state.players[winnerIndex];
        const isGameOver = winner.score >= this.state.targetScore;

        this.state.phase = isGameOver ? GAME_PHASES.GAME_OVER : GAME_PHASES.RESULTS;

        this._emit('winnerSelected', {
            winner,
            winnerIndex,
            newScore: winner.score,
            isGameOver
        });

        return { success: true, winner, isGameOver };
    }

    // =========================================================================
    // RESULTS PHASE - Token Awards
    // =========================================================================

    /**
     * Award a bonus token to a player
     * @param {number} playerIndex - Index of the player
     * @param {string} tokenType - Type of token to award
     * @returns {Object} Award result
     */
    awardToken(playerIndex, tokenType) {
        if (playerIndex === this.state.currentJudgeIndex) {
            return { success: false, error: 'Cannot award token to judge' };
        }

        if (!TOKEN_TYPE_KEYS.includes(tokenType)) {
            return { success: false, error: 'Invalid token type' };
        }

        if (this.isTokenAwarded(tokenType)) {
            return { success: false, error: `${TOKEN_TYPES[tokenType].name} already awarded this round` };
        }

        this.state.players[playerIndex].tokens[tokenType]++;
        this.state.tokensAwardedThisRound.push(tokenType);

        const player = this.state.players[playerIndex];

        this._emit('tokenAwarded', {
            playerIndex,
            player,
            tokenType,
            token: TOKEN_TYPES[tokenType]
        });

        return { success: true, player, token: TOKEN_TYPES[tokenType] };
    }

    // =========================================================================
    // STEAL MECHANIC
    // =========================================================================

    /**
     * Execute a point steal
     * @param {number} stealerIndex - Index of the stealing player
     * @param {number} victimIndex - Index of the victim player
     * @returns {Object} Steal result
     */
    executeSteal(stealerIndex, victimIndex) {
        const stealer = this.state.players[stealerIndex];
        const victim = this.state.players[victimIndex];

        if (!stealer || !victim) {
            return { success: false, error: 'Invalid player' };
        }

        if (getTotalTokenCount(stealer.tokens) < GAME_DEFAULTS.tokensToSteal) {
            return { success: false, error: 'Not enough tokens' };
        }

        if (victim.score < 1) {
            return { success: false, error: 'Victim has no points to steal' };
        }

        // Remove tokens from stealer
        let tokensRemoved = 0;
        for (const type of TOKEN_TYPE_KEYS) {
            while (stealer.tokens[type] > 0 && tokensRemoved < GAME_DEFAULTS.tokensToSteal) {
                stealer.tokens[type]--;
                tokensRemoved++;
            }
            if (tokensRemoved >= GAME_DEFAULTS.tokensToSteal) break;
        }

        // Transfer point
        victim.score--;
        stealer.score++;

        const isGameOver = stealer.score >= this.state.targetScore;
        if (isGameOver) {
            this.state.roundWinner = stealerIndex;
            this.state.phase = GAME_PHASES.GAME_OVER;
        }

        this._emit('pointStolen', {
            stealer,
            stealerIndex,
            victim,
            victimIndex,
            isGameOver
        });

        return { success: true, stealer, victim, isGameOver };
    }

    // =========================================================================
    // MODIFIER (CURSE) PHASE
    // =========================================================================

    /**
     * Check if modifier phase should occur
     * @returns {Object} Result with shouldShowModifier and curser info
     */
    checkForModifierPhase() {
        if (!this.state.modifiersEnabled) {
            return { shouldShowModifier: false };
        }

        const lowestScore = Math.min(...this.state.players.map(p => p.score));
        const leaderScore = Math.max(...this.state.players.map(p => p.score));

        // Skip if everyone is tied at the start
        if (lowestScore === leaderScore && this.state.roundNumber === 1) {
            return { shouldShowModifier: false };
        }

        const lastPlacePlayers = this.getLastPlacePlayers();
        const curser = getRandomElement(lastPlacePlayers);

        this.state.phase = GAME_PHASES.MODIFIER;

        this._emit('modifierPhaseStarted', {
            curser: curser.player,
            curserIndex: curser.index,
            hasHeldCurse: curser.player.heldCurse !== null
        });

        return {
            shouldShowModifier: true,
            curser: curser.player,
            curserIndex: curser.index,
            hasHeldCurse: curser.player.heldCurse !== null,
            heldCurse: curser.player.heldCurse
        };
    }

    /**
     * Draw a new curse card
     * @param {number} curserIndex - Index of the cursing player
     * @param {boolean} replacingHeld - Whether this replaces a held curse
     * @returns {Object} The drawn modifier
     */
    drawCurseCard(curserIndex, replacingHeld = false) {
        const curser = this.state.players[curserIndex];
        const modifier = getRandomModifier();

        if (replacingHeld) {
            curser.heldCurse = null;
        }

        curser.tempModifier = modifier;

        // Get valid curse targets (not self, not judge)
        const targets = this.state.players
            .map((player, index) => ({ player, index }))
            .filter(({ index }) =>
                index !== curserIndex &&
                index !== this.state.currentJudgeIndex
            );

        this._emit('curseCardDrawn', {
            curser,
            curserIndex,
            modifier,
            targets
        });

        return { modifier, targets };
    }

    /**
     * Use a held curse card
     * @param {number} curserIndex - Index of the cursing player
     * @returns {Object} The held modifier and valid targets
     */
    useHeldCurse(curserIndex) {
        const curser = this.state.players[curserIndex];
        const modifier = curser.heldCurse;

        if (!modifier) {
            return { success: false, error: 'No held curse' };
        }

        curser.heldCurse = null;
        curser.tempModifier = modifier;

        const targets = this.state.players
            .map((player, index) => ({ player, index }))
            .filter(({ index }) =>
                index !== curserIndex &&
                index !== this.state.currentJudgeIndex
            );

        this._emit('heldCurseUsed', {
            curser,
            curserIndex,
            modifier,
            targets
        });

        return { success: true, modifier, targets };
    }

    /**
     * Apply curse to a target player
     * @param {number} curserIndex - Index of the cursing player
     * @param {number} targetIndex - Index of the target player
     * @returns {Object} Curse application result
     */
    applyCurse(curserIndex, targetIndex) {
        const curser = this.state.players[curserIndex];
        const target = this.state.players[targetIndex];
        const modifier = curser.tempModifier;

        if (!modifier) {
            return { success: false, error: 'No curse to apply' };
        }

        // Add to pending modifiers (applied next round)
        this.state.pendingModifiers.push({
            curserIndex,
            targetIndex,
            modifier
        });

        curser.tempModifier = null;

        this._emit('curseApplied', {
            curser,
            curserIndex,
            target,
            targetIndex,
            modifier
        });

        return { success: true, target, modifier };
    }

    /**
     * Hold curse for next round
     * @param {number} curserIndex - Index of the cursing player
     * @returns {Object} Hold result
     */
    holdCurse(curserIndex) {
        const curser = this.state.players[curserIndex];
        curser.heldCurse = curser.tempModifier;
        curser.tempModifier = null;

        this._emit('curseHeld', {
            curser,
            curserIndex,
            modifier: curser.heldCurse
        });

        return { success: true };
    }

    // =========================================================================
    // ROUND TRANSITIONS
    // =========================================================================

    /**
     * Advance to next round
     */
    nextRound() {
        this.state.currentJudgeIndex =
            (this.state.currentJudgeIndex + 1) % this.state.players.length;
        this.state.roundNumber++;

        this._emit('nextRound', {
            roundNumber: this.state.roundNumber,
            newJudgeIndex: this.state.currentJudgeIndex
        });

        this.startNewRound();
    }

    // =========================================================================
    // GAME OVER
    // =========================================================================

    /**
     * Get final game results
     * @returns {Object} Final standings and winner info
     */
    getFinalResults() {
        const winner = this.state.players[this.state.roundWinner];
        const sortedPlayers = this.getSortedPlayers().map(({ player, index, tokenCount }, rank) => ({
            rank: rank + 1,
            player,
            index,
            tokenCount,
            medal: rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null
        }));

        return {
            winner,
            winnerIndex: this.state.roundWinner,
            standings: sortedPlayers,
            totalRounds: this.state.roundNumber
        };
    }
}

// Export singleton instance for simple usage
export const game = new GameLogic();

// Export class for testing or multiple instances
export default GameLogic;
