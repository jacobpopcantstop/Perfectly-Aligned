/**
 * Room - Manages a single game room with all players and game state
 */

const { THEMED_DECKS, ALIGNMENTS, ALIGNMENT_FULL_NAMES, TOKEN_TYPES, MODIFIERS, AVATARS } = require('./constants');

class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = [];
        this.maxPlayers = 8;
        this.minPlayers = 3;

        // Game state
        this.gameStarted = false;
        this.gamePhase = 'lobby'; // lobby, alignment, prompts, drawing, judging, scoring, modifiers, gameOver
        this.currentRound = 0;
        this.judgeIndex = 0;

        // Modifier/curse state
        this.modifiersEnabled = true;
        this.pendingModifiers = []; // {curserIndex, targetIndex, modifier}
        this.currentCurser = null; // Player who can assign curse this round

        // Round state
        this.currentAlignment = null;
        this.currentAlignmentFullName = null;
        this.currentPrompts = [];
        this.selectedPrompt = null;
        this.submissions = new Map();
        this.selectedWinner = null;

        // Deck
        this.availableCards = [];

        // Settings
        this.settings = {
            selectedDecks: ['core_white', 'creative_cyan'],
            timerDuration: 90,
            targetScore: 5
        };

        // Timer
        this.timer = null;
        this.timerStartTime = null;
        this.timerDuration = 0;

        // Activity tracking
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
    }

    /**
     * Check if a player can join
     */
    canJoin() {
        return !this.gameStarted && this.players.length < this.maxPlayers;
    }

    /**
     * Add a player to the room
     */
    addPlayer(socketId, name, avatar) {
        if (!this.canJoin()) {
            return { success: false, error: 'Cannot join room' };
        }

        // Check for duplicate names
        if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            return { success: false, error: 'Name already taken' };
        }

        // Assign avatar if not provided or if taken
        const usedAvatars = this.players.map(p => p.avatar);
        if (!avatar || usedAvatars.includes(avatar)) {
            avatar = AVATARS.find(a => !usedAvatars.includes(a)) || AVATARS[0];
        }

        const player = {
            id: socketId,
            name: name.substring(0, 10), // Max 10 chars
            avatar,
            score: 0,
            tokens: {
                mindReader: 0,
                technicalMerit: 0,
                perfectAlignment: 0,
                plotTwist: 0
            },
            connected: true,
            isJudge: false,
            activeModifiers: [], // Current round curses
            heldCurse: null // Curse held for next round
        };

        this.players.push(player);
        this.lastActivity = Date.now();

        return { success: true, player };
    }

    /**
     * Remove a player from the room
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1) {
            return { success: false, error: 'Player not found' };
        }

        this.players.splice(index, 1);
        this.lastActivity = Date.now();

        // Adjust judge index if necessary
        if (this.judgeIndex >= this.players.length) {
            this.judgeIndex = 0;
        }

        return { success: true };
    }

    /**
     * Mark player as disconnected (but keep them in game)
     */
    setPlayerDisconnected(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.connected = false;
            this.lastActivity = Date.now();
        }
    }

    /**
     * Reconnect a player
     */
    reconnectPlayer(oldId, newId, name) {
        const player = this.players.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (player) {
            player.id = newId;
            player.connected = true;
            this.lastActivity = Date.now();
            return { success: true, player };
        }
        return { success: false, error: 'Player not found' };
    }

    /**
     * Start the game
     */
    startGame(settings = {}) {
        if (this.players.length < this.minPlayers) {
            return { success: false, error: `Need at least ${this.minPlayers} players` };
        }

        // Apply settings
        if (settings.selectedDecks) this.settings.selectedDecks = settings.selectedDecks;
        if (settings.timerDuration) this.settings.timerDuration = settings.timerDuration;
        if (settings.targetScore) this.settings.targetScore = settings.targetScore;

        // Set target score based on player count
        if (!settings.targetScore) {
            this.settings.targetScore = this.players.length >= 6 ? 3 : 5;
        }

        // Build deck from selected decks
        this.availableCards = [];
        this.settings.selectedDecks.forEach(deckKey => {
            if (THEMED_DECKS[deckKey]) {
                this.availableCards = this.availableCards.concat(THEMED_DECKS[deckKey]);
            }
        });

        // Shuffle deck
        this.shuffleArray(this.availableCards);

        this.gameStarted = true;
        this.gamePhase = 'alignment';
        this.currentRound = 1;
        this.judgeIndex = 0;
        this.updateJudge();
        this.lastActivity = Date.now();

        return { success: true };
    }

    /**
     * Update which player is the judge
     */
    updateJudge() {
        this.players.forEach((p, i) => {
            p.isJudge = (i === this.judgeIndex);
        });
    }

    /**
     * Get current judge
     */
    getCurrentJudge() {
        return this.players[this.judgeIndex];
    }

    /**
     * Roll alignment
     */
    rollAlignment() {
        if (this.gamePhase !== 'alignment') {
            return { success: false, error: 'Wrong phase' };
        }

        const randomIndex = Math.floor(Math.random() * ALIGNMENTS.length);
        this.currentAlignment = ALIGNMENTS[randomIndex];
        this.currentAlignmentFullName = ALIGNMENT_FULL_NAMES[this.currentAlignment];
        this.gamePhase = 'prompts';
        this.lastActivity = Date.now();

        return {
            success: true,
            alignment: this.currentAlignment,
            fullName: this.currentAlignmentFullName
        };
    }

    /**
     * Draw prompts
     */
    drawPrompts() {
        if (this.gamePhase !== 'prompts') {
            return { success: false, error: 'Wrong phase' };
        }

        if (this.availableCards.length < 3) {
            return { success: false, error: 'Not enough cards left' };
        }

        // Draw 3 random prompts
        this.currentPrompts = [];
        const indices = new Set();
        while (indices.size < 3) {
            indices.add(Math.floor(Math.random() * this.availableCards.length));
        }

        indices.forEach(i => {
            this.currentPrompts.push(this.availableCards[i]);
        });

        this.lastActivity = Date.now();

        return { success: true, prompts: this.currentPrompts };
    }

    /**
     * Select a prompt
     */
    selectPrompt(promptIndex) {
        if (this.gamePhase !== 'prompts') {
            return { success: false, error: 'Wrong phase' };
        }

        if (promptIndex < 0 || promptIndex >= this.currentPrompts.length) {
            return { success: false, error: 'Invalid prompt index' };
        }

        this.selectedPrompt = this.currentPrompts[promptIndex];

        // Remove the selected prompt from available cards
        const cardIndex = this.availableCards.indexOf(this.selectedPrompt);
        if (cardIndex > -1) {
            this.availableCards.splice(cardIndex, 1);
        }

        this.gamePhase = 'drawing';
        this.submissions.clear();
        this.lastActivity = Date.now();

        return { success: true, prompt: this.selectedPrompt };
    }

    /**
     * Start timer
     */
    startTimer(duration, onTick, onComplete) {
        this.clearTimer();
        this.timerDuration = duration;
        this.timerStartTime = Date.now();

        let remaining = duration;
        this.timer = setInterval(() => {
            remaining--;
            if (onTick) onTick(remaining);

            if (remaining <= 0) {
                this.clearTimer();
                if (onComplete) onComplete();
            }
        }, 1000);
    }

    /**
     * Clear timer
     */
    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Submit drawing
     */
    submitDrawing(playerId, drawingData) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (player.isJudge) {
            return { success: false, error: 'Judge cannot submit' };
        }

        this.submissions.set(playerId, {
            playerId,
            playerName: player.name,
            playerAvatar: player.avatar,
            drawing: drawingData,
            timestamp: Date.now()
        });

        this.lastActivity = Date.now();

        return { success: true };
    }

    /**
     * Get submission count
     */
    getSubmissionCount() {
        return this.submissions.size;
    }

    /**
     * Collect all submissions and move to judging phase
     */
    collectSubmissions() {
        this.gamePhase = 'judging';
        this.lastActivity = Date.now();
    }

    /**
     * Get submissions for judging (anonymized order)
     */
    getSubmissionsForJudging() {
        const submissions = Array.from(this.submissions.values());
        this.shuffleArray(submissions);
        return submissions;
    }

    /**
     * Select winner
     */
    selectWinner(playerId) {
        if (this.gamePhase !== 'judging') {
            return { success: false, error: 'Wrong phase' };
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        player.score += 1;
        this.selectedWinner = playerId;
        this.gamePhase = 'scoring';
        this.lastActivity = Date.now();

        return { success: true, winnerName: player.name };
    }

    /**
     * Award tokens
     */
    awardTokens(tokenAwards) {
        // tokenAwards: { playerId: tokenType, ... }
        const awardedTypes = new Set();

        for (const [playerId, tokenType] of Object.entries(tokenAwards)) {
            // Each token type can only be awarded once per round
            if (awardedTypes.has(tokenType)) continue;

            const player = this.players.find(p => p.id === playerId);
            if (player && TOKEN_TYPES[tokenType]) {
                player.tokens[tokenType]++;
                awardedTypes.add(tokenType);
            }
        }

        this.lastActivity = Date.now();
        return { success: true };
    }

    /**
     * Check if modifier phase should happen
     */
    checkForModifierPhase() {
        if (!this.modifiersEnabled) {
            return { hasModifierPhase: false };
        }

        // Find lowest score
        const lowestScore = Math.min(...this.players.map(p => p.score));
        const leaderScore = Math.max(...this.players.map(p => p.score));

        // Find all players in last place (excluding judge)
        const lastPlacePlayers = this.players
            .map((player, index) => ({ player, index }))
            .filter(({ player, index }) => player.score === lowestScore && index !== this.judgeIndex);

        // Only give curse if there's actually a last place
        // Skip on round 1 if everyone is tied at 0
        if (lowestScore === leaderScore && this.currentRound === 1) {
            return { hasModifierPhase: false };
        }

        // Skip if no valid last place players
        if (lastPlacePlayers.length === 0) {
            return { hasModifierPhase: false };
        }

        // Pick ONE random player from last place to curse
        const curserData = lastPlacePlayers[Math.floor(Math.random() * lastPlacePlayers.length)];
        this.currentCurser = curserData;

        this.gamePhase = 'modifiers';
        this.lastActivity = Date.now();

        return {
            hasModifierPhase: true,
            curser: curserData.player,
            curserIndex: curserData.index,
            hasHeldCurse: !!curserData.player.heldCurse,
            heldCurse: curserData.player.heldCurse
        };
    }

    /**
     * Draw a random curse card
     */
    drawCurseCard() {
        if (this.gamePhase !== 'modifiers') {
            return { success: false, error: 'Wrong phase' };
        }

        const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
        this.lastActivity = Date.now();

        return { success: true, modifier };
    }

    /**
     * Apply curse to a target player
     */
    applyCurse(targetIndex, modifier) {
        if (this.gamePhase !== 'modifiers') {
            return { success: false, error: 'Wrong phase' };
        }

        const target = this.players[targetIndex];
        if (!target) {
            return { success: false, error: 'Target not found' };
        }

        if (targetIndex === this.judgeIndex) {
            return { success: false, error: 'Cannot curse the judge' };
        }

        if (this.currentCurser && targetIndex === this.currentCurser.index) {
            return { success: false, error: 'Cannot curse yourself' };
        }

        // Add to pending modifiers (will be applied next round)
        this.pendingModifiers.push({
            curserIndex: this.currentCurser ? this.currentCurser.index : null,
            targetIndex,
            modifier
        });

        // Clear held curse if player used it
        if (this.currentCurser) {
            this.currentCurser.player.heldCurse = null;
        }

        this.lastActivity = Date.now();

        return {
            success: true,
            targetName: target.name,
            modifier
        };
    }

    /**
     * Hold curse for later
     */
    holdCurse(modifier) {
        if (this.gamePhase !== 'modifiers') {
            return { success: false, error: 'Wrong phase' };
        }

        if (!this.currentCurser) {
            return { success: false, error: 'No curser set' };
        }

        this.currentCurser.player.heldCurse = modifier;
        this.lastActivity = Date.now();

        return { success: true };
    }

    /**
     * Skip modifier phase and advance to next round
     */
    skipModifierPhase() {
        return this.advanceRound();
    }

    /**
     * Advance to next round
     */
    advanceRound() {
        // Check if someone won
        const winner = this.players.find(p => p.score >= this.settings.targetScore);
        if (winner) {
            this.gamePhase = 'gameOver';
            return { success: true, gameOver: true, winner };
        }

        // Next round
        this.currentRound++;
        this.judgeIndex = (this.judgeIndex + 1) % this.players.length;
        this.updateJudge();

        // Clear all active modifiers from previous round
        this.players.forEach(player => {
            player.activeModifiers = [];
        });

        // Apply pending modifiers (curses from last round)
        this.pendingModifiers.forEach(({ targetIndex, modifier }) => {
            if (this.players[targetIndex]) {
                this.players[targetIndex].activeModifiers.push(modifier);
            }
        });
        this.pendingModifiers = [];
        this.currentCurser = null;

        // Reset round state
        this.currentAlignment = null;
        this.currentAlignmentFullName = null;
        this.currentPrompts = [];
        this.selectedPrompt = null;
        this.submissions.clear();
        this.selectedWinner = null;

        this.gamePhase = 'alignment';
        this.lastActivity = Date.now();

        return { success: true, gameOver: false };
    }

    /**
     * Execute steal
     */
    executeSteal(stealerId, targetId) {
        const stealer = this.players.find(p => p.id === stealerId);
        const target = this.players.find(p => p.id === targetId);

        if (!stealer || !target) {
            return { success: false, error: 'Player not found' };
        }

        // Check if stealer has enough tokens
        const totalTokens = this.getPlayerTokenTotal(stealer);
        if (totalTokens < 3) {
            return { success: false, error: 'Not enough tokens (need 3)' };
        }

        if (target.score < 1) {
            return { success: false, error: 'Target has no points' };
        }

        // Deduct 3 tokens
        this.deductTokens(stealer, 3);

        // Transfer point
        target.score--;
        stealer.score++;
        this.lastActivity = Date.now();

        // Check win condition
        const winner = this.players.find(p => p.score >= this.settings.targetScore);
        if (winner) {
            this.gamePhase = 'gameOver';
            return {
                success: true,
                stealerName: stealer.name,
                targetName: target.name,
                gameOver: true,
                winner
            };
        }

        return {
            success: true,
            stealerName: stealer.name,
            targetName: target.name,
            gameOver: false
        };
    }

    /**
     * Get total tokens for a player
     */
    getPlayerTokenTotal(player) {
        return Object.values(player.tokens).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Deduct tokens from a player
     */
    deductTokens(player, count) {
        let remaining = count;
        for (const type of Object.keys(player.tokens)) {
            if (remaining <= 0) break;
            const available = player.tokens[type];
            const deduct = Math.min(remaining, available);
            player.tokens[type] -= deduct;
            remaining -= deduct;
        }
        return remaining === 0;
    }

    /**
     * Get scores
     */
    getScores() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            tokens: { ...p.tokens }
        }));
    }

    /**
     * Get public player data (for other players to see)
     */
    getPlayersPublicData() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            score: p.score,
            tokens: { ...p.tokens },
            totalTokens: this.getPlayerTokenTotal(p),
            connected: p.connected,
            isJudge: p.isJudge,
            activeModifiers: p.activeModifiers || [],
            heldCurse: p.heldCurse || null
        }));
    }

    /**
     * Get full game state
     */
    getState() {
        return {
            code: this.code,
            gameStarted: this.gameStarted,
            gamePhase: this.gamePhase,
            currentRound: this.currentRound,
            targetScore: this.settings.targetScore,
            players: this.getPlayersPublicData(),
            judge: this.getCurrentJudge(),
            currentAlignment: this.currentAlignment,
            currentAlignmentFullName: this.currentAlignmentFullName,
            currentPrompts: this.currentPrompts,
            selectedPrompt: this.selectedPrompt,
            submissionCount: this.submissions.size,
            selectedWinner: this.selectedWinner,
            settings: this.settings,
            modifiersEnabled: this.modifiersEnabled,
            currentCurser: this.currentCurser ? {
                playerId: this.currentCurser.player.id,
                playerName: this.currentCurser.player.name,
                playerAvatar: this.currentCurser.player.avatar,
                index: this.currentCurser.index,
                hasHeldCurse: !!this.currentCurser.player.heldCurse,
                heldCurse: this.currentCurser.player.heldCurse
            } : null
        };
    }

    /**
     * Shuffle array in place
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Clean up room resources
     */
    cleanup() {
        this.clearTimer();
    }
}

module.exports = Room;
