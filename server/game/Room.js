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
        this.winningDrawings = [];

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
        this.offlineMode = false;
    }

    canJoin() {
        return !this.gameStarted && this.players.length < this.maxPlayers;
    }

    addOfflinePlayer(name, avatar) {
        if (this.players.length >= this.maxPlayers) {
            return { success: false, error: 'Room is full' };
        }
        const sanitized = sanitizePlayerName(name, 20);
        if (!sanitized) {
            return { success: false, error: 'Invalid name' };
        }
        if (this.players.some(p => p.name.toLowerCase() === sanitized.toLowerCase())) {
            return { success: false, error: 'Name already taken' };
        }
        const usedAvatars = this.players.map(p => p.avatar);
        const requestedAvatarAvailable = avatar && AVATARS.includes(avatar) && !usedAvatars.includes(avatar);
        const selectedAvatar = requestedAvatarAvailable
            ? avatar
            : (AVATARS.find(a => !usedAvatars.includes(a)) || AVATARS[0]);
        const id = 'offline_' + Math.random().toString(36).substring(2, 11);
        const player = {
            id,
            name: sanitized,
            avatar: selectedAvatar,
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

    removeOfflinePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1) {
            return { success: false, error: 'Player not found' };
        }
        this.players.splice(index, 1);
        this.lastActivity = Date.now();
        return { success: true };
    }

    addPlayer(socketId, name, avatar, reconnectToken) {
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
            reconnectToken,
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

        // Fix judge index when a player is removed
        if (this.players.length === 0) {
            this.judgeIndex = 0;
        } else if (index < this.judgeIndex) {
            // Removed player was before current judge, shift judge index back
            this.judgeIndex--;
        } else if (this.judgeIndex >= this.players.length) {
            this.judgeIndex = 0;
        }

        // Update judge flags for remaining players
        if (this.gameStarted && this.players.length > 0) {
            this.updateJudge();
        }

        return { success: true };
    }

    setPlayerAvatar(playerId, avatar) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }
        // Check if avatar is already taken by another player
        const taken = this.players.some(p => p.id !== playerId && p.avatar === avatar);
        if (taken) {
            return { success: false, error: 'Avatar already taken' };
        }
        player.avatar = avatar;
        this.lastActivity = Date.now();
        return { success: true, player };
    }

    setPlayerDisconnected(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.connected = false;
            this.lastActivity = Date.now();
        }
    }

    reconnectPlayer(newId, name, reconnectToken, nextReconnectToken) {
        const player = this.players.find(
            p => p.name.toLowerCase() === name.toLowerCase() && p.reconnectToken === reconnectToken
        );
        if (player) {
            player.id = newId;
            player.connected = true;
            player.reconnectToken = nextReconnectToken;
            this.lastActivity = Date.now();
            return { success: true, player };
        }
        return { success: false, error: 'Player not found or reconnect token invalid' };
    }

    startGame(settings = {}) {
        if (this.players.length < this.minPlayers) {
            return { success: false, error: `Need at least ${this.minPlayers} players` };
        }

        if (settings.selectedDecks) this.settings.selectedDecks = settings.selectedDecks;
        if (settings.timerDuration !== undefined) this.settings.timerDuration = settings.timerDuration;
        if (settings.targetScore !== undefined && settings.targetScore > 0) this.settings.targetScore = settings.targetScore;
        if (settings.modifiersEnabled !== undefined) this.modifiersEnabled = settings.modifiersEnabled;

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

        // Validate alignment is a known value (exclude 'U' since judge is choosing a specific one)
        if (!ALIGNMENT_NAMES[alignment] || alignment === 'U') {
            return { success: false, error: 'Invalid alignment' };
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

    getUsedAvatars() {
        return this.players.map(p => p.avatar);
    }

    submitDrawing(playerId, drawingData, caption) {
        if (this.gamePhase !== 'drawing') {
            return { success: false, error: 'Not in drawing phase' };
        }

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
            caption: caption || '',
            timestamp: Date.now()
        });

        this.lastActivity = Date.now();

        return { success: true };
    }

    getSubmissionCount() {
        return this.submissions.size;
    }

    collectSubmissions() {
        // In offline mode, create placeholder submissions for all non-judge players
        if (this.offlineMode) {
            this.players.forEach(p => {
                if (!p.isJudge) {
                    this.submissions.set(p.id, {
                        playerId: p.id,
                        playerName: p.name,
                        playerAvatar: p.avatar,
                        drawing: null,
                        caption: '',
                        timestamp: Date.now()
                    });
                }
            });
        }
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

        // Save the winning drawing for the gallery
        const submission = this.submissions.get(playerId);
        if (submission) {
            this.winningDrawings.push({
                round: this.currentRound,
                playerId: player.id,
                playerName: player.name,
                playerAvatar: player.avatar,
                drawing: submission.drawing,
                prompt: this.selectedPrompt,
                alignment: this.currentAlignmentFullName || this.currentAlignment
            });
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

        // Store by player ID instead of array index for stability across player removals
        this.pendingModifiers.push({
            curserId: this.currentCurser ? this.currentCurser.player.id : null,
            targetId: target.id,
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

        this.pendingModifiers.forEach(({ targetId, modifier }) => {
            const target = this.players.find(p => p.id === targetId);
            if (target) {
                target.activeModifiers.push(modifier);
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
            usedAvatars: this.getUsedAvatars(),
            currentAlignment: this.currentAlignment,
            currentAlignmentFullName: this.currentAlignmentFullName,
            currentPrompts: this.currentPrompts,
            selectedPrompt: this.selectedPrompt,
            submissionCount: this.submissions.size,
            selectedWinner: this.selectedWinner,
            settings: this.settings,
            modifiersEnabled: this.modifiersEnabled,
            offlineMode: this.offlineMode,
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
