/**
 * Perfectly Aligned - Host Controller
 * Manages the main game display (TV/projector screen)
 */

// Socket connection
const socket = io();

// Game state
let gameState = {
    roomCode: null,
    players: [],
    gameStarted: false,
    currentPhase: 'lobby',
    currentRound: 0,
    judge: null,
    alignment: null,
    alignmentName: null,
    prompts: [],
    selectedPrompt: null,
    submissions: [],
    winner: null,
    settings: {
        selectedDecks: ['core_white', 'creative_cyan'],
        timerDuration: 90,
        targetScore: 5
    },
    // Modifier state
    currentCurser: null,
    currentModifier: null
};

// DOM Elements
const elements = {
    // Screens
    lobbyScreen: document.getElementById('lobby-screen'),
    gameScreen: document.getElementById('game-screen'),
    gameoverScreen: document.getElementById('gameover-screen'),

    // Lobby
    createRoomBtn: document.getElementById('create-room-btn'),
    roomCodeDisplay: document.getElementById('room-code-display'),
    roomCode: document.getElementById('room-code'),
    joinUrl: document.getElementById('join-url'),
    lobbyPlayers: document.getElementById('lobby-players'),
    deckSelection: document.getElementById('deck-selection'),
    startGameArea: document.getElementById('start-game-area'),
    playerCountMsg: document.getElementById('player-count-msg'),
    startGameBtn: document.getElementById('start-game-btn'),

    // Game Header
    roundNumber: document.getElementById('round-number'),
    targetScore: document.getElementById('target-score'),
    judgeAvatar: document.getElementById('judge-avatar'),
    judgeName: document.getElementById('judge-name'),

    // Phases
    alignmentPhase: document.getElementById('alignment-phase'),
    promptsPhase: document.getElementById('prompts-phase'),
    drawingPhase: document.getElementById('drawing-phase'),
    judgingPhase: document.getElementById('judging-phase'),
    scoringPhase: document.getElementById('scoring-phase'),
    modifiersPhase: document.getElementById('modifiers-phase'),

    // Modifiers
    curserAvatar: document.getElementById('curser-avatar'),
    curserName: document.getElementById('curser-name'),
    modifierCard: document.getElementById('modifier-card'),
    modifierIcon: document.getElementById('modifier-icon'),
    modifierName: document.getElementById('modifier-name'),
    modifierDescription: document.getElementById('modifier-description'),
    drawCurseBtn: document.getElementById('draw-curse-btn'),
    useHeldCurseBtn: document.getElementById('use-held-curse-btn'),
    holdCurseBtn: document.getElementById('hold-curse-btn'),
    curseTargets: document.getElementById('curse-targets'),
    skipModifiersBtn: document.getElementById('skip-modifiers-btn'),

    // Alignment
    alignmentGrid: document.getElementById('alignment-grid'),
    alignmentResult: document.getElementById('alignment-result'),
    rolledAlignment: document.getElementById('rolled-alignment'),
    rolledAlignmentName: document.getElementById('rolled-alignment-name'),
    rollBtn: document.getElementById('roll-btn'),

    // Prompts
    phaseAlignment: document.getElementById('phase-alignment'),
    phaseAlignmentName: document.getElementById('phase-alignment-name'),
    promptsContainer: document.getElementById('prompts-container'),
    drawPromptsBtn: document.getElementById('draw-prompts-btn'),

    // Drawing
    drawingAlignment: document.getElementById('drawing-alignment'),
    drawingPrompt: document.getElementById('drawing-prompt'),
    timer: document.getElementById('timer'),
    startTimerBtn: document.getElementById('start-timer-btn'),
    stopTimerBtn: document.getElementById('stop-timer-btn'),
    submissionCount: document.getElementById('submission-count'),
    totalArtists: document.getElementById('total-artists'),

    // Judging
    judgingAlignment: document.getElementById('judging-alignment'),
    judgingPrompt: document.getElementById('judging-prompt'),
    submissionsGallery: document.getElementById('submissions-gallery'),

    // Scoring
    winnerAvatar: document.getElementById('winner-avatar'),
    winnerName: document.getElementById('winner-name'),
    tokenAwards: document.getElementById('token-awards'),
    nextRoundBtn: document.getElementById('next-round-btn'),

    // Scoreboard
    scoreboardList: document.getElementById('scoreboard-list'),

    // Game Over
    finalWinnerAvatar: document.getElementById('final-winner-avatar'),
    finalWinnerName: document.getElementById('final-winner-name'),
    finalScores: document.getElementById('final-scores'),
    playAgainBtn: document.getElementById('play-again-btn')
};

// Sound effects
const sounds = {
    roll: document.getElementById('sfx-roll'),
    timerEnd: document.getElementById('sfx-timer-end'),
    tokenGain: document.getElementById('sfx-token-gain'),
    pointGain: document.getElementById('sfx-point-gain'),
    steal: document.getElementById('sfx-steal'),
    win: document.getElementById('sfx-win'),
    draw: document.getElementById('sfx-draw')
};

function playSound(name) {
    const sound = sounds[name];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// ==================== INITIALIZATION ====================

function init() {
    setupEventListeners();
    setupSocketListeners();
}

function setupEventListeners() {
    // Lobby
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.startGameBtn.addEventListener('click', startGame);

    // Deck selection
    document.querySelectorAll('.deck-option').forEach(option => {
        option.addEventListener('click', () => toggleDeck(option));
    });

    // Game controls
    elements.rollBtn.addEventListener('click', rollAlignment);
    elements.drawPromptsBtn.addEventListener('click', drawPrompts);
    elements.startTimerBtn.addEventListener('click', () => startTimer(gameState.settings.timerDuration));
    elements.stopTimerBtn.addEventListener('click', stopTimer);
    elements.nextRoundBtn.addEventListener('click', nextRound);
    elements.playAgainBtn.addEventListener('click', () => location.reload());
}

function setupSocketListeners() {
    // Room events
    socket.on('room:playerJoined', handlePlayerJoined);
    socket.on('room:playerLeft', handlePlayerLeft);
    socket.on('room:playerDisconnected', handlePlayerDisconnected);
    socket.on('room:playerReconnected', handlePlayerReconnected);

    // Game events
    socket.on('game:started', handleGameStarted);
    socket.on('game:alignmentRolled', handleAlignmentRolled);
    socket.on('game:promptsDrawn', handlePromptsDrawn);
    socket.on('game:promptSelected', handlePromptSelected);
    socket.on('game:timerStarted', handleTimerStarted);
    socket.on('game:timerTick', handleTimerTick);
    socket.on('game:timerEnd', handleTimerEnd);
    socket.on('game:submissionReceived', handleSubmissionReceived);
    socket.on('game:submissionsCollected', handleSubmissionsCollected);
    socket.on('game:winnerSelected', handleWinnerSelected);
    socket.on('game:tokensAwarded', handleTokensAwarded);
    socket.on('game:newRound', handleNewRound);
    socket.on('game:stealExecuted', handleStealExecuted);
    socket.on('game:over', handleGameOver);

    // Modifier events
    socket.on('game:modifierPhase', handleModifierPhase);
    socket.on('game:curseCardDrawn', handleCurseCardDrawn);
    socket.on('game:curseApplied', handleCurseApplied);
    socket.on('game:curseHeld', handleCurseHeld);

    // Connection events
    socket.on('connect', () => console.log('Connected to server'));
    socket.on('disconnect', () => console.log('Disconnected from server'));
}

// ==================== ROOM MANAGEMENT ====================

function createRoom() {
    socket.emit('host:createRoom', (response) => {
        if (response.success) {
            gameState.roomCode = response.roomCode;
            updateRoomDisplay();
            elements.createRoomBtn.style.display = 'none';
            elements.roomCodeDisplay.style.display = 'flex';
            elements.deckSelection.style.display = 'block';
            elements.startGameArea.style.display = 'block';
        } else {
            alert('Failed to create room: ' + response.error);
        }
    });
}

function updateRoomDisplay() {
    elements.roomCode.textContent = gameState.roomCode;
    const baseUrl = window.location.origin;
    elements.joinUrl.textContent = `${baseUrl}/play`;
}

function toggleDeck(option) {
    option.classList.toggle('selected');
    updateSelectedDecks();
}

function updateSelectedDecks() {
    gameState.settings.selectedDecks = [];
    document.querySelectorAll('.deck-option.selected').forEach(option => {
        gameState.settings.selectedDecks.push(option.dataset.deck);
    });
}

// ==================== LOBBY ====================

function handlePlayerJoined(data) {
    gameState.players = data.players;
    updateLobbyPlayers();
    updateStartButton();
}

function handlePlayerLeft(data) {
    gameState.players = data.players;
    updateLobbyPlayers();
    updateScoreboard();
    updateStartButton();
}

function handlePlayerDisconnected(data) {
    gameState.players = data.players;
    updateLobbyPlayers();
    updateScoreboard();
}

function handlePlayerReconnected(data) {
    const player = gameState.players.find(p => p.id === data.playerId);
    if (player) {
        player.connected = true;
    }
    updateLobbyPlayers();
    updateScoreboard();
}

function updateLobbyPlayers() {
    elements.lobbyPlayers.innerHTML = '';
    gameState.players.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = `player-card ${player.connected ? '' : 'disconnected'}`;
        playerEl.innerHTML = `
            <div class="player-avatar" style="background-image: url('/assets/images/avatars/${player.avatar}')"></div>
            <span class="player-name">${player.name}</span>
        `;
        elements.lobbyPlayers.appendChild(playerEl);
    });
}

function updateStartButton() {
    const count = gameState.players.length;
    if (count < 3) {
        elements.playerCountMsg.textContent = `Waiting for players... (${count}/3 minimum)`;
        elements.startGameBtn.disabled = true;
    } else if (count >= 8) {
        elements.playerCountMsg.textContent = `Room full! (${count}/8 players)`;
        elements.startGameBtn.disabled = false;
    } else {
        elements.playerCountMsg.textContent = `${count} players ready!`;
        elements.startGameBtn.disabled = false;
    }
}

function startGame() {
    if (gameState.settings.selectedDecks.length === 0) {
        alert('Please select at least one card deck!');
        return;
    }

    socket.emit('host:startGame', gameState.settings, (response) => {
        if (!response.success) {
            alert('Failed to start game: ' + response.error);
        }
    });
}

function handleGameStarted(state) {
    gameState = { ...gameState, ...state };
    gameState.gameStarted = true;
    showScreen('game');
    updateGameUI();
    showPhase('alignment');
}

// ==================== GAME PHASES ====================

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenName}-screen`).classList.add('active');
}

function showPhase(phaseName) {
    gameState.currentPhase = phaseName;
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById(`${phaseName}-phase`).style.display = 'block';
}

function updateGameUI() {
    elements.roundNumber.textContent = gameState.currentRound;
    elements.targetScore.textContent = gameState.targetScore;

    if (gameState.judge) {
        elements.judgeAvatar.style.backgroundImage = `url('/assets/images/avatars/${gameState.judge.avatar}')`;
        elements.judgeName.textContent = gameState.judge.name;
    }

    updateScoreboard();
}

// ==================== ALIGNMENT PHASE ====================

function rollAlignment() {
    elements.rollBtn.disabled = true;
    playSound('roll');

    // Enhanced flicker animation - multiple cells at once (like local V4)
    const cells = document.querySelectorAll('.alignment-cell');
    let flickerCount = 0;
    const maxFlickers = 25;
    const flickerInterval = setInterval(() => {
        cells.forEach(c => c.classList.remove('flicker', 'rolling'));

        // Light up 2-4 random cells at once for more dramatic effect
        const numCellsToLight = 2 + Math.floor(Math.random() * 3);
        const litCells = new Set();

        while (litCells.size < numCellsToLight && litCells.size < cells.length) {
            const randomIndex = Math.floor(Math.random() * cells.length);
            litCells.add(randomIndex);
        }

        litCells.forEach(index => {
            cells[index].classList.add('rolling');
        });

        flickerCount++;

        if (flickerCount >= maxFlickers) {
            clearInterval(flickerInterval);
            cells.forEach(c => c.classList.remove('rolling'));
            socket.emit('host:rollAlignment', (response) => {
                if (!response.success) {
                    alert('Failed to roll: ' + response.error);
                    elements.rollBtn.disabled = false;
                }
            });
        }
    }, 100);
}

function handleAlignmentRolled(data) {
    const cells = document.querySelectorAll('.alignment-cell');
    const alignmentGrid = document.getElementById('alignment-grid');

    cells.forEach(c => {
        c.classList.remove('flicker', 'rolling', 'highlighted');
    });

    gameState.alignment = data.alignment;
    gameState.alignmentName = data.fullName;

    // Handle Judge's Choice ('U') with purple glow on entire grid
    if (data.alignment === 'U') {
        if (alignmentGrid) {
            alignmentGrid.classList.add('judges-choice');
        }
    } else {
        if (alignmentGrid) {
            alignmentGrid.classList.remove('judges-choice');
        }
        cells.forEach(c => {
            if (c.dataset.alignment === data.alignment) {
                c.classList.add('highlighted');
            }
        });
    }

    elements.rolledAlignment.textContent = data.alignment;
    elements.rolledAlignmentName.textContent = data.fullName;
    elements.alignmentResult.style.display = 'block';

    // Transition to prompts phase after delay
    setTimeout(() => {
        showPhase('prompts');
        elements.phaseAlignment.textContent = data.alignment;
        elements.phaseAlignmentName.textContent = data.fullName;
    }, 2000);
}

// ==================== PROMPTS PHASE ====================

function drawPrompts() {
    elements.drawPromptsBtn.disabled = true;
    playSound('draw');

    socket.emit('host:drawPrompts', (response) => {
        if (!response.success) {
            alert('Failed to draw prompts: ' + response.error);
            elements.drawPromptsBtn.disabled = false;
        }
    });
}

function handlePromptsDrawn(data) {
    gameState.prompts = data.prompts;
    elements.promptsContainer.innerHTML = '';
    elements.drawPromptsBtn.style.display = 'none';

    data.prompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.textContent = prompt;
        card.addEventListener('click', () => selectPrompt(index));
        elements.promptsContainer.appendChild(card);
    });
}

function selectPrompt(index) {
    socket.emit('host:selectPrompt', index, (response) => {
        if (!response.success) {
            alert('Failed to select prompt: ' + response.error);
        }
    });
}

function handlePromptSelected(data) {
    gameState.selectedPrompt = data.prompt;

    // Highlight selected card
    const cards = elements.promptsContainer.querySelectorAll('.prompt-card');
    cards.forEach((card, i) => {
        if (card.textContent === data.prompt) {
            card.classList.add('selected');
        } else {
            card.classList.add('disabled');
        }
    });

    // Transition to drawing phase
    setTimeout(() => {
        showPhase('drawing');
        elements.drawingAlignment.textContent = data.alignment;
        elements.drawingPrompt.textContent = data.prompt;
        elements.totalArtists.textContent = gameState.players.filter(p => !p.isJudge).length;
        elements.submissionCount.textContent = '0';
    }, 1500);
}

// ==================== DRAWING PHASE ====================

function startTimer(duration) {
    elements.startTimerBtn.disabled = true;
    elements.stopTimerBtn.disabled = false;

    socket.emit('host:startTimer', duration, (response) => {
        if (!response.success) {
            alert('Failed to start timer: ' + response.error);
            elements.startTimerBtn.disabled = false;
            elements.stopTimerBtn.disabled = true;
        }
    });
}

function stopTimer() {
    elements.stopTimerBtn.disabled = true;
    elements.startTimerBtn.disabled = false;
    // Timer will be stopped server-side when submissions are collected
}

function handleTimerStarted(data) {
    formatTimer(data.duration);
}

function handleTimerTick(data) {
    formatTimer(data.timeLeft);
}

function handleTimerEnd() {
    playSound('timerEnd');
    elements.timer.textContent = "TIME'S UP!";
    elements.startTimerBtn.disabled = true;
    elements.stopTimerBtn.disabled = true;
}

function formatTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    elements.timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleSubmissionReceived(data) {
    elements.submissionCount.textContent = data.submissionCount;
}

function handleSubmissionsCollected(data) {
    gameState.submissions = data.submissions;
    showPhase('judging');

    elements.judgingAlignment.textContent = gameState.alignment;
    elements.judgingPrompt.textContent = gameState.selectedPrompt;

    // Display submissions
    elements.submissionsGallery.innerHTML = '';
    data.submissions.forEach(submission => {
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.innerHTML = `
            <div class="submission-drawing">
                <img src="${submission.drawing}" alt="Drawing by ${submission.playerName}">
            </div>
            <div class="submission-info">
                <div class="submission-avatar" style="background-image: url('/assets/images/avatars/${submission.playerAvatar}')"></div>
                <span class="submission-name">${submission.playerName}</span>
            </div>
        `;
        card.addEventListener('click', () => selectWinner(submission.playerId));
        elements.submissionsGallery.appendChild(card);
    });
}

// ==================== JUDGING & SCORING ====================

function selectWinner(playerId) {
    socket.emit('host:selectWinner', playerId, (response) => {
        if (!response.success) {
            alert('Failed to select winner: ' + response.error);
        }
    });
}

function handleWinnerSelected(data) {
    playSound('pointGain');

    // Highlight winning submission
    const submissions = elements.submissionsGallery.querySelectorAll('.submission-card');
    submissions.forEach(card => {
        const name = card.querySelector('.submission-name').textContent;
        if (name === data.winnerName) {
            card.classList.add('winner');
        } else {
            card.classList.add('not-winner');
        }
    });

    // Update scores
    gameState.players = gameState.players.map(p => {
        const score = data.scores.find(s => s.id === p.id);
        return score ? { ...p, score: score.score, tokens: score.tokens } : p;
    });

    updateScoreboard();

    // Transition to scoring phase
    setTimeout(() => {
        showPhase('scoring');
        const winner = gameState.players.find(p => p.id === data.winnerId);
        if (winner) {
            elements.winnerAvatar.style.backgroundImage = `url('/assets/images/avatars/${winner.avatar}')`;
            elements.winnerName.textContent = winner.name;
        }
        generateTokenAwardsUI();
    }, 2000);
}

function generateTokenAwardsUI() {
    elements.tokenAwards.innerHTML = '';

    const tokenTypes = [
        { key: 'mindReader', name: 'Mind Reader', desc: "Close match to Judge's thought" },
        { key: 'technicalMerit', name: 'Technical Merit', desc: "Exceptional artistic skill" },
        { key: 'perfectAlignment', name: 'Perfect Alignment', desc: "Brilliant alignment capture" },
        { key: 'plotTwist', name: 'Plot Twist', desc: "Surprising interpretation" }
    ];

    // Create token type sections
    tokenTypes.forEach(token => {
        const section = document.createElement('div');
        section.className = 'token-section';
        section.innerHTML = `
            <div class="token-header">
                <span class="token-name">${token.name}</span>
                <span class="token-desc">${token.desc}</span>
            </div>
            <div class="token-players" data-token="${token.key}">
                ${gameState.players.filter(p => !p.isJudge).map(p => `
                    <button class="token-player-btn" data-player="${p.id}" data-token="${token.key}">
                        <div class="mini-avatar" style="background-image: url('/assets/images/avatars/${p.avatar}')"></div>
                        <span>${p.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
        elements.tokenAwards.appendChild(section);
    });

    // Add click handlers
    elements.tokenAwards.querySelectorAll('.token-player-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tokenType = btn.dataset.token;
            const playerId = btn.dataset.player;

            // Toggle selection within this token type
            const siblings = btn.parentElement.querySelectorAll('.token-player-btn');
            siblings.forEach(s => s.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

function nextRound() {
    // Collect token awards
    const tokenAwards = {};
    elements.tokenAwards.querySelectorAll('.token-player-btn.selected').forEach(btn => {
        tokenAwards[btn.dataset.player] = btn.dataset.token;
    });

    // Send token awards if any
    if (Object.keys(tokenAwards).length > 0) {
        socket.emit('host:awardTokens', tokenAwards, (response) => {
            if (response.success) {
                playSound('tokenGain');
            }
        });
    }

    // Check for modifier phase before advancing
    socket.emit('host:checkModifiers', (response) => {
        if (response.hasModifierPhase) {
            // Modifier phase will be shown via socket event
        } else {
            // No modifier phase, advance directly
            socket.emit('host:nextRound', (nextResponse) => {
                if (!nextResponse.success) {
                    alert('Failed to advance: ' + nextResponse.error);
                }
            });
        }
    });
}

// ==================== MODIFIER PHASE ====================

function handleModifierPhase(data) {
    gameState.currentCurser = data.curser;
    gameState.currentModifier = null;

    showPhase('modifiers');

    // Set curser display
    if (elements.curserAvatar) {
        elements.curserAvatar.style.backgroundImage = `url('/assets/images/avatars/${data.curser.avatar}')`;
    }
    if (elements.curserName) {
        elements.curserName.textContent = data.curser.name;
    }

    // Hide modifier card initially
    if (elements.modifierCard) {
        elements.modifierCard.style.display = 'none';
    }

    // Show/hide held curse button
    if (elements.useHeldCurseBtn) {
        if (data.hasHeldCurse && data.heldCurse) {
            elements.useHeldCurseBtn.style.display = 'inline-block';
            elements.useHeldCurseBtn.textContent = `Use Held Curse: ${data.heldCurse.icon} ${data.heldCurse.name}`;
            elements.useHeldCurseBtn.onclick = () => useHeldCurse(data.heldCurse);
        } else {
            elements.useHeldCurseBtn.style.display = 'none';
        }
    }

    // Show draw button, hide others
    if (elements.drawCurseBtn) {
        elements.drawCurseBtn.style.display = 'inline-block';
        elements.drawCurseBtn.disabled = false;
    }
    if (elements.holdCurseBtn) {
        elements.holdCurseBtn.style.display = 'none';
    }
    if (elements.curseTargets) {
        elements.curseTargets.innerHTML = '';
        elements.curseTargets.style.display = 'none';
    }
    if (elements.skipModifiersBtn) {
        elements.skipModifiersBtn.style.display = 'inline-block';
    }
}

function drawCurseCard() {
    if (elements.drawCurseBtn) {
        elements.drawCurseBtn.disabled = true;
    }

    socket.emit('host:drawCurseCard', (response) => {
        if (!response.success) {
            alert('Failed to draw curse: ' + response.error);
            if (elements.drawCurseBtn) {
                elements.drawCurseBtn.disabled = false;
            }
        }
    });
}

function handleCurseCardDrawn(data) {
    gameState.currentModifier = data.modifier;

    // Show the modifier card with animation
    if (elements.modifierCard) {
        elements.modifierCard.style.display = 'block';
        elements.modifierCard.classList.add('dealing');
        setTimeout(() => elements.modifierCard.classList.remove('dealing'), 800);
    }
    if (elements.modifierIcon) {
        elements.modifierIcon.textContent = data.modifier.icon;
    }
    if (elements.modifierName) {
        elements.modifierName.textContent = data.modifier.name;
    }
    if (elements.modifierDescription) {
        elements.modifierDescription.textContent = data.modifier.description;
    }

    // Hide draw button, show target selection
    if (elements.drawCurseBtn) {
        elements.drawCurseBtn.style.display = 'none';
    }
    if (elements.useHeldCurseBtn) {
        elements.useHeldCurseBtn.style.display = 'none';
    }
    if (elements.holdCurseBtn) {
        elements.holdCurseBtn.style.display = 'inline-block';
    }

    // Generate target buttons
    generateCurseTargets(data.modifier);
}

function generateCurseTargets(modifier) {
    if (!elements.curseTargets) return;

    elements.curseTargets.innerHTML = '<h4>Choose target:</h4>';
    elements.curseTargets.style.display = 'block';

    gameState.players.forEach((player, index) => {
        // Skip curser and judge
        if (player.id === gameState.currentCurser?.id) return;
        if (player.isJudge) return;

        const btn = document.createElement('button');
        btn.className = 'curse-target-btn';
        btn.innerHTML = `
            <div class="mini-avatar" style="background-image: url('/assets/images/avatars/${player.avatar}')"></div>
            <span>${player.name}</span>
        `;
        btn.onclick = () => applyCurseToTarget(index, modifier);
        elements.curseTargets.appendChild(btn);
    });
}

function applyCurseToTarget(targetIndex, modifier) {
    socket.emit('host:applyCurse', { targetIndex, modifier }, (response) => {
        if (!response.success) {
            alert('Failed to apply curse: ' + response.error);
        }
    });
}

function useHeldCurse(heldCurse) {
    gameState.currentModifier = heldCurse;

    // Show the modifier card
    if (elements.modifierCard) {
        elements.modifierCard.style.display = 'block';
    }
    if (elements.modifierIcon) {
        elements.modifierIcon.textContent = heldCurse.icon;
    }
    if (elements.modifierName) {
        elements.modifierName.textContent = heldCurse.name;
    }
    if (elements.modifierDescription) {
        elements.modifierDescription.textContent = heldCurse.description;
    }

    // Hide buttons, show targets
    if (elements.drawCurseBtn) {
        elements.drawCurseBtn.style.display = 'none';
    }
    if (elements.useHeldCurseBtn) {
        elements.useHeldCurseBtn.style.display = 'none';
    }
    if (elements.holdCurseBtn) {
        elements.holdCurseBtn.style.display = 'none';
    }

    generateCurseTargets(heldCurse);
}

function holdCurseForLater() {
    if (!gameState.currentModifier) return;

    socket.emit('host:holdCurse', gameState.currentModifier, (response) => {
        if (response.success) {
            showNotification(`Curse held for next round!`);
            // Advance to next round
            socket.emit('host:nextRound', (nextResponse) => {
                if (!nextResponse.success) {
                    alert('Failed to advance: ' + nextResponse.error);
                }
            });
        } else {
            alert('Failed to hold curse: ' + response.error);
        }
    });
}

function handleCurseApplied(data) {
    showNotification(`${data.targetName} has been cursed with ${data.modifier.name}!`);

    // Advance to next round after showing curse
    setTimeout(() => {
        socket.emit('host:nextRound', (response) => {
            if (!response.success) {
                alert('Failed to advance: ' + response.error);
            }
        });
    }, 2000);
}

function handleCurseHeld(data) {
    // State updated via socket, now advance
}

function skipModifierPhase() {
    socket.emit('host:skipModifiers', (response) => {
        if (!response.success) {
            alert('Failed to skip: ' + response.error);
        }
    });
}

function handleTokensAwarded(data) {
    gameState.players = data.players;
    updateScoreboard();
}

function handleNewRound(data) {
    gameState.currentRound = data.round;
    gameState.judge = data.judge;
    gameState.players = data.gameState.players;
    gameState.alignment = null;
    gameState.alignmentName = null;
    gameState.prompts = [];
    gameState.selectedPrompt = null;
    gameState.submissions = [];

    // Reset UI
    updateGameUI();
    resetPhaseUI();
    showPhase('alignment');
}

function resetPhaseUI() {
    // Alignment phase
    document.querySelectorAll('.alignment-cell').forEach(c => {
        c.classList.remove('flicker', 'highlighted', 'judges-choice');
    });
    const alignmentGrid = document.getElementById('alignment-grid');
    if (alignmentGrid) {
        alignmentGrid.classList.remove('judges-choice');
    }
    elements.alignmentResult.style.display = 'none';
    elements.rollBtn.disabled = false;

    // Prompts phase
    elements.promptsContainer.innerHTML = '';
    elements.drawPromptsBtn.style.display = 'block';
    elements.drawPromptsBtn.disabled = false;

    // Drawing phase
    elements.timer.textContent = '--:--';
    elements.startTimerBtn.disabled = false;
    elements.stopTimerBtn.disabled = true;
    elements.submissionCount.textContent = '0';

    // Judging phase
    elements.submissionsGallery.innerHTML = '';

    // Scoring phase
    elements.tokenAwards.innerHTML = '';

    // Modifiers phase
    gameState.currentCurser = null;
    gameState.currentModifier = null;
    if (elements.modifierCard) {
        elements.modifierCard.style.display = 'none';
    }
    if (elements.curseTargets) {
        elements.curseTargets.innerHTML = '';
    }
}

function handleStealExecuted(data) {
    playSound('steal');
    gameState.players = gameState.players.map(p => {
        const score = data.scores.find(s => s.id === p.id);
        return score ? { ...p, score: score.score, tokens: score.tokens } : p;
    });
    updateScoreboard();

    // Show steal notification
    showNotification(`${data.stealerName} stole a point from ${data.targetName}!`);
}

// ==================== SCOREBOARD ====================

function updateScoreboard() {
    elements.scoreboardList.innerHTML = '';

    // Sort by score descending
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);

    sorted.forEach(player => {
        const li = document.createElement('li');
        li.className = player.isJudge ? 'is-judge' : '';
        if (!player.connected) li.classList.add('disconnected');

        const totalTokens = Object.values(player.tokens || {}).reduce((a, b) => a + b, 0);

        // Check for active modifiers
        let modifierDisplay = '';
        if (player.activeModifiers && player.activeModifiers.length > 0) {
            const modIcons = player.activeModifiers.map(m => m.icon).join(' ');
            modifierDisplay = `<span class="curse-badge" title="Cursed!">${modIcons}</span>`;
        }

        // Check for held curse
        let heldCurseDisplay = '';
        if (player.heldCurse) {
            heldCurseDisplay = `<span class="held-curse-badge" title="Held: ${player.heldCurse.name}">💾${player.heldCurse.icon}</span>`;
        }

        li.innerHTML = `
            <div class="score-avatar" style="background-image: url('/assets/images/avatars/${player.avatar}')"></div>
            <span class="score-name">${player.name}</span>
            <span class="score-value">${player.score}</span>
            ${totalTokens > 0 ? `<span class="score-tokens" title="Total tokens: ${totalTokens}">${totalTokens}T</span>` : ''}
            ${modifierDisplay}
            ${heldCurseDisplay}
            ${player.isJudge ? '<span class="judge-badge">JUDGE</span>' : ''}
        `;
        elements.scoreboardList.appendChild(li);
    });
}

// ==================== GAME OVER ====================

function handleGameOver(data) {
    playSound('win');
    showScreen('gameover');

    elements.finalWinnerAvatar.style.backgroundImage = `url('/assets/images/avatars/${data.winner.avatar}')`;
    elements.finalWinnerName.textContent = data.winner.name;

    // Display final standings
    elements.finalScores.innerHTML = '';
    const sorted = data.finalScores.sort((a, b) => b.score - a.score);
    sorted.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'final-score-row';
        div.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${player.name}</span>
            <span class="score">${player.score} pts</span>
        `;
        elements.finalScores.appendChild(div);
    });
}

// ==================== UTILITIES ====================

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
