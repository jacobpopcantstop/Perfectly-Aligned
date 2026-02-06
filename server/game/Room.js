import {
    AVATARS, ALIGNMENTS, ALIGNMENT_NAMES, ALIGNMENT_EXAMPLES, ALIGNMENT_GRID_ORDER,
    TOKEN_TYPES, TOKEN_TYPE_KEYS, MODIFIERS,
    THEMED_DECKS, GAME_DEFAULTS,
    shuffleArray, getRandomElement, createInitialTokenState, getTotalTokenCount,
    sanitizePlayerName, buildPromptPool, getRandomModifier
} from '../../shared/game-data.js';

export default class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = [];
        this.maxPlayers = 8;
        this.minPlayers = 3;

        this.gameStarted = false;
        this.gamePhase = 'lobby';
        this.currentRound = 0;
        this.judgeIndex = 0;

        this.modifiersEnabled = true;
        this.pendingModifiers = [];
        this.currentCurser = null;

        this.currentAlignment = null;
        this.currentAlignmentFullName = null;
        this.currentPrompts = [];
        this.selectedPrompt = null;
        this.submissions = new Map();
        this.selectedWinner = null;

        this.availableCards = [];
        this.lastAlignment = null;
        this.recentAlignments = [];

        this.settings = {
            selectedDecks: ['core_white', 'creative_cyan'],
            timerDuration: 90,
            targetScore: 5
        };

        this.timer = null;
        this.timerDuration = 0;

        this.createdAt = Date.now();
        this.lastActivity = Date.now();
    }

    canJoin() {
        return !this.gameStarted && this.players.length < this.maxPlayers;
    }

    addPlayer(socketId, name, avatar) {
        if (!this.canJoin()) {
            return { success: false, error: 'Cannot join room' };
        }

        const sanitized = sanitizePlayerName(name, 20);
        if (!sanitized) {
            return { success: false, error: 'Invalid name' };
        }

        if (this.players.some(p => p.name.toLowerCase() === sanitized.toLowerCase())) {
            return { success: false, error: 'Name already taken' };
        }

        const usedAvatars = this.players.map(p => p.avatar);
        if (!avatar || usedAvatars.includes(avatar)) {
            avatar = AVATARS.find(a => !usedAvatars.includes(a)) || AVATARS[0];
        }

        const player = {
            id: socketId,
            name: sanitized,
            avatar,
            score: 0,
            tokens: createInitialTokenState(),
            connected: true,
            isJudge: false,
            activeModifiers: [],
            heldCurse: null
        };

        this.players.push(player);
        this.lastActivity = Date.now();

        return { success: true, player };
    }

    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1) {
            return { success: false, error: 'Player not found' };
        }

        this.players.splice(index, 1);
        this.lastActivity = Date.now();

        if (this.judgeIndex >= this.players.length) {
            this.judgeIndex = 0;
        }

        return { success: true };
    }

    setPlayerDisconnected(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.connected = false;
            this.lastActivity = Date.now();
        }
    }

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

    startGame(settings = {}) {
        if (this.players.length < this.minPlayers) {
            return { success: false, error: `Need at least ${this.minPlayers} players` };
        }

        if (settings.selectedDecks) this.settings.selectedDecks = settings.selectedDecks;
        if (settings.timerDuration !== undefined) this.settings.timerDuration = settings.timerDuration;
        if (settings.targetScore) this.settings.targetScore = settings.targetScore;

        this.availableCards = buildPromptPool(this.settings.selectedDecks);

        this.gameStarted = true;
        this.gamePhase = 'alignment';
        this.currentRound = 1;
        this.judgeIndex = 0;
        this.updateJudge();
        this.lastActivity = Date.now();

        return { success: true };
    }

    updateJudge() {
        this.players.forEach((p, i) => {
            p.isJudge = (i === this.judgeIndex);
        });
    }

    getCurrentJudge() {
        return this.players[this.judgeIndex];
    }

    rollAlignment() {
        if (this.gamePhase !== 'alignment') {
            return { success: false, error: 'Wrong phase' };
        }

        let alignment = getRandomElement(ALIGNMENTS);
        for (let i = 0; i < 5 && alignment === this.lastAlignment; i++) {
            alignment = getRandomElement(ALIGNMENTS);
        }

        this.lastAlignment = alignment;
        this.recentAlignments.push(alignment);
        this.currentAlignment = alignment;
        this.currentAlignmentFullName = ALIGNMENT_NAMES[alignment];

        const isJudgeChoice = alignment === 'U';
        this.gamePhase = isJudgeChoice ? 'judge_choice' : 'prompts';
        this.lastActivity = Date.now();

        return {
            success: true,
            alignment: this.currentAlignment,
            fullName: this.currentAlignmentFullName,
            isJudgeChoice
        };
    }

    selectJudgeAlignment(alignment) {
        if (this.gamePhase !== 'judge_choice') {
            return { success: false, error: 'Wrong phase' };
        }

        this.currentAlignment = alignment;
        this.currentAlignmentFullName = ALIGNMENT_NAMES[alignment];
        this.gamePhase = 'prompts';
        this.lastActivity = Date.now();

        return {
            success: true,
            alignment: this.currentAlignment,
            fullName: this.currentAlignmentFullName
        };
    }

    drawPrompts() {
        if (this.gamePhase !== 'prompts') {
            return { success: false, error: 'Wrong phase' };
        }

        if (this.availableCards.length < 3) {
            return { success: false, error: 'Not enough cards left' };
        }

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

    selectPrompt(promptIndex) {
        if (this.gamePhase !== 'prompts') {
            return { success: false, error: 'Wrong phase' };
        }

        if (promptIndex < 0 || promptIndex >= this.currentPrompts.length) {
            return { success: false, error: 'Invalid prompt index' };
        }

        this.selectedPrompt = this.currentPrompts[promptIndex];

        const cardIndex = this.availableCards.indexOf(this.selectedPrompt);
        if (cardIndex > -1) {
            this.availableCards.splice(cardIndex, 1);
        }

        this.gamePhase = 'drawing';
        this.submissions.clear();
        this.lastActivity = Date.now();

        return { success: true, prompt: this.selectedPrompt };
    }

    startTimer(duration, onTick, onComplete) {
        this.clearTimer();
        this.timerDuration = duration;

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

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

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

    getSubmissionCount() {
        return this.submissions.size;
    }

    collectSubmissions() {
        this.gamePhase = 'judging';
        this.lastActivity = Date.now();
    }

    getSubmissionsForJudging() {
        return shuffleArray(Array.from(this.submissions.values()));
    }

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

        const gameOver = player.score >= this.settings.targetScore;

        return { success: true, winnerName: player.name, gameOver };
    }

    awardToken(playerId, tokenType) {
        if (!TOKEN_TYPES[tokenType]) {
            return { success: false, error: 'Invalid token type' };
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        player.tokens[tokenType] += 1;
        this.lastActivity = Date.now();

        return { success: true };
    }

    getPlayerTokenTotal(player) {
        return getTotalTokenCount(player.tokens);
    }

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

    executeSteal(stealerId, targetId) {
        const stealer = this.players.find(p => p.id === stealerId);
        const target = this.players.find(p => p.id === targetId);

        if (!stealer || !target) {
            return { success: false, error: 'Player not found' };
        }

        const totalTokens = this.getPlayerTokenTotal(stealer);
        if (totalTokens < 3) {
            return { success: false, error: 'Not enough tokens (need 3)' };
        }

        if (target.score < 1) {
            return { success: false, error: 'Target has no points' };
        }

        this.deductTokens(stealer, 3);
        target.score--;
        stealer.score++;
        this.lastActivity = Date.now();

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

    checkForModifierPhase() {
        if (!this.modifiersEnabled) {
            return { hasModifierPhase: false };
        }

        const lowestScore = Math.min(...this.players.map(p => p.score));
        const leaderScore = Math.max(...this.players.map(p => p.score));

        if (lowestScore === leaderScore && this.currentRound === 1) {
            return { hasModifierPhase: false };
        }

        const lastPlacePlayers = this.players
            .map((player, index) => ({ player, index }))
            .filter(({ player, index }) => player.score === lowestScore && index !== this.judgeIndex);

        if (lastPlacePlayers.length === 0) {
            return { hasModifierPhase: false };
        }

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

    drawCurseCard() {
        if (this.gamePhase !== 'modifiers') {
            return { success: false, error: 'Wrong phase' };
        }

        const modifier = getRandomModifier();
        this.lastActivity = Date.now();

        return { success: true, modifier };
    }

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

        this.pendingModifiers.push({
            curserIndex: this.currentCurser ? this.currentCurser.index : null,
            targetIndex,
            modifier
        });

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

    advanceRound() {
        const winner = this.players.find(p => p.score >= this.settings.targetScore);
        if (winner) {
            this.gamePhase = 'gameOver';
            return { success: true, gameOver: true, winner };
        }

        this.currentRound++;
        this.judgeIndex = (this.judgeIndex + 1) % this.players.length;
        this.updateJudge();

        this.players.forEach(player => {
            player.activeModifiers = [];
        });

        this.pendingModifiers.forEach(({ targetIndex, modifier }) => {
            if (this.players[targetIndex]) {
                this.players[targetIndex].activeModifiers.push(modifier);
            }
        });
        this.pendingModifiers = [];
        this.currentCurser = null;

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

    getScores() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            score: p.score,
            tokens: { ...p.tokens }
        }));
    }

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

    cleanup() {
        this.clearTimer();
    }
}
