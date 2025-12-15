/**
 * Room - Manages a single game room with all players and game state
 */

const { THEMED_DECKS, ALIGNMENTS, ALIGNMENT_FULL_NAMES, TOKEN_TYPES, AVATARS } = require('./constants');

class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = [];
        this.spectators = []; // Watch-only participants
        this.maxPlayers = 8;
        this.minPlayers = 3;

        // Game state
        this.gameStarted = false;
        this.gamePhase = 'lobby'; // lobby, alignment, prompts, drawing, judging, voting, scoring, gameOver
        this.currentRound = 0;
        this.judgeIndex = 0;

        // Round state
        this.currentAlignment = null;
        this.currentAlignmentFullName = null;
        this.currentPrompts = [];
        this.selectedPrompt = null;
        this.submissions = new Map();
        this.votes = new Map(); // For voting mode
        this.selectedWinner = null;

        // Deck
        this.availableCards = [];

        // Settings
        this.settings = {
            selectedDecks: ['core_white', 'creative_cyan'],
            timerDuration: 90,
            targetScore: 5,
            allowStealing: true,
            votingMode: false // Everyone votes instead of judge picking
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
            isJudge: false
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
     * Add a spectator
     */
    addSpectator(socketId, name) {
        const spectator = {
            id: socketId,
            name: name || `Spectator ${this.spectators.length + 1}`,
            joinedAt: Date.now()
        };
        this.spectators.push(spectator);
        this.lastActivity = Date.now();
        return { success: true, spectator };
    }

    /**
     * Remove a spectator
     */
    removeSpectator(socketId) {
        const index = this.spectators.findIndex(s => s.id === socketId);
        if (index > -1) {
            this.spectators.splice(index, 1);
        }
    }

    /**
     * Get spectator count
     */
    getSpectatorCount() {
        return this.spectators.length;
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
        if (typeof settings.allowStealing === 'boolean') this.settings.allowStealing = settings.allowStealing;
        if (typeof settings.votingMode === 'boolean') this.settings.votingMode = settings.votingMode;

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

        // If "U" (Judge's Choice), stay in alignment phase for judge to select
        if (this.currentAlignment !== 'U') {
            this.gamePhase = 'prompts';
        }

        this.lastActivity = Date.now();

        return {
            success: true,
            alignment: this.currentAlignment,
            fullName: this.currentAlignmentFullName,
            isJudgesChoice: this.currentAlignment === 'U'
        };
    }

    /**
     * Set alignment (for Judge's Choice)
     */
    setAlignment(alignment) {
        if (this.currentAlignment !== 'U') {
            return { success: false, error: 'Not in Judge\'s Choice mode' };
        }

        if (!ALIGNMENTS.includes(alignment) || alignment === 'U') {
            return { success: false, error: 'Invalid alignment' };
        }

        this.currentAlignment = alignment;
        this.currentAlignmentFullName = ALIGNMENT_FULL_NAMES[alignment];
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
     * Submit drawing or text
     */
    submitDrawing(playerId, submissionData) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (player.isJudge) {
            return { success: false, error: 'Judge cannot submit' };
        }

        // Handle both old format (string) and new format (object with type)
        let type = 'drawing';
        let content = submissionData;

        if (typeof submissionData === 'object' && submissionData.type) {
            type = submissionData.type;
            content = submissionData.content;
        }

        this.submissions.set(playerId, {
            playerId,
            playerName: player.name,
            playerAvatar: player.avatar,
            type,
            content,
            drawing: type === 'drawing' ? content : null, // Backwards compatibility
            text: type === 'text' ? content : null,
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
     * Collect all submissions and move to judging/voting phase
     */
    collectSubmissions() {
        this.gamePhase = this.settings.votingMode ? 'voting' : 'judging';
        this.votes.clear();
        this.lastActivity = Date.now();
    }

    /**
     * Submit a vote (for voting mode)
     */
    submitVote(voterId, submissionPlayerId) {
        if (this.gamePhase !== 'voting') {
            return { success: false, error: 'Not in voting phase' };
        }

        const voter = this.players.find(p => p.id === voterId);
        if (!voter) {
            return { success: false, error: 'Voter not found' };
        }

        // Can't vote for your own submission
        if (voterId === submissionPlayerId) {
            return { success: false, error: 'Cannot vote for yourself' };
        }

        // Check if the submission exists
        if (!this.submissions.has(submissionPlayerId)) {
            return { success: false, error: 'Invalid submission' };
        }

        this.votes.set(voterId, submissionPlayerId);
        this.lastActivity = Date.now();

        return { success: true, voteCount: this.votes.size };
    }

    /**
     * Get vote count
     */
    getVoteCount() {
        return this.votes.size;
    }

    /**
     * Get expected voter count (players who submitted)
     */
    getExpectedVoterCount() {
        return this.submissions.size;
    }

    /**
     * Tally votes and determine winner
     */
    tallyVotes() {
        if (this.gamePhase !== 'voting') {
            return { success: false, error: 'Not in voting phase' };
        }

        // Count votes for each submission
        const voteCounts = new Map();
        for (const submissionId of this.submissions.keys()) {
            voteCounts.set(submissionId, 0);
        }

        for (const votedFor of this.votes.values()) {
            voteCounts.set(votedFor, (voteCounts.get(votedFor) || 0) + 1);
        }

        // Find winner (most votes, tie goes to first alphabetically by player name)
        let maxVotes = -1;
        let winnerId = null;

        for (const [playerId, count] of voteCounts.entries()) {
            if (count > maxVotes) {
                maxVotes = count;
                winnerId = playerId;
            } else if (count === maxVotes && winnerId) {
                // Tie-breaker: alphabetically
                const currentWinner = this.players.find(p => p.id === winnerId);
                const challenger = this.players.find(p => p.id === playerId);
                if (challenger && currentWinner && challenger.name < currentWinner.name) {
                    winnerId = playerId;
                }
            }
        }

        if (!winnerId) {
            return { success: false, error: 'No votes cast' };
        }

        const winner = this.players.find(p => p.id === winnerId);
        winner.score += 1;
        this.selectedWinner = winnerId;
        this.gamePhase = 'scoring';
        this.lastActivity = Date.now();

        return {
            success: true,
            winnerId,
            winnerName: winner.name,
            voteCounts: Object.fromEntries(voteCounts)
        };
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
        if (!this.settings.allowStealing) {
            return { success: false, error: 'Stealing is disabled in this game' };
        }

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
            isJudge: p.isJudge
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
            settings: this.settings
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
