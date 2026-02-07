/**
 * Perfectly Aligned - Host Controller
 * ====================================
 * Manages the main display (TV/projector screen) for the Jackbox-style
 * online multiplayer party drawing game. Communicates with the server
 * via Socket.IO to orchestrate the complete game flow.
 *
 * @module host/host
 */

// =============================================================================
// GAME CONSTANTS
// =============================================================================

const ALIGNMENT_NAMES = {
    LG: "Lawful Good", NG: "Neutral Good", CG: "Chaotic Good",
    LN: "Lawful Neutral", TN: "True Neutral", CN: "Chaotic Neutral",
    LE: "Lawful Evil", NE: "Neutral Evil", CE: "Chaotic Evil",
    U: "Judge's Choice"
};

const ALIGNMENT_EXAMPLES = {
    LG: "Superman, Captain America", NG: "Spider-Man, Wonder Woman",
    CG: "Robin Hood, Han Solo", LN: "Judge Dredd, James Bond",
    TN: "The Watcher, Tom Bombadil", CN: "Jack Sparrow, Deadpool",
    LE: "Darth Vader, Dolores Umbridge", NE: "Lord Voldemort, Sauron",
    CE: "The Joker, Cthulhu", U: "The Judge picks any alignment!"
};

const ALIGNMENT_GRID_ORDER = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];

const TOKEN_TYPES = {
    mindReader: { icon: "\uD83E\uDDE0", name: "Mind Reader", description: "Perfectly captured what the Judge was thinking!" },
    technicalMerit: { icon: "\uD83C\uDFA8", name: "Technical Merit", description: "Exceptional artistic skill and technique." },
    perfectAlignment: { icon: "\u2696\uFE0F", name: "Perfect Alignment", description: "Brilliantly embodied the alignment!" },
    plotTwist: { icon: "\uD83C\uDF00", name: "Plot Twist", description: "Surprising and creative interpretation!" }
};

const TOKEN_TYPE_KEYS = Object.keys(TOKEN_TYPES);

// =============================================================================
// GAME STATE
// =============================================================================

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
    settings: {
        selectedDecks: ['core_white'],
        timerDuration: 90,
        targetScore: 5,
        modifiersEnabled: true
    },
    currentCurser: null,
    currentModifier: null,
    tokensAwardedThisRound: []
};

let timerInterval = null;
let timerRemaining = 0;
let currentSubmissions = [];
let pendingModifierData = null;

// =============================================================================
// SOCKET CONNECTION
// =============================================================================

let socket;
try {
    socket = io();
} catch (err) {
    console.error('Failed to initialize Socket.IO:', err);
}

// =============================================================================
// DOM ELEMENT CACHE
// =============================================================================

const dom = {};

function cacheDomElements() {
    // Screens
    dom.lobbyScreen = document.getElementById('lobby-screen');
    dom.gameScreen = document.getElementById('game-screen');

    // Lobby elements
    dom.createRoomBtn = document.getElementById('create-room-btn');
    dom.roomCodeDisplay = document.getElementById('room-code-display');
    dom.roomCode = document.getElementById('room-code-value');
    dom.joinUrl = document.getElementById('room-code-join-url');
    dom.roomCodeRepeat = document.getElementById('room-code-repeat');
    dom.lobbyPlayerGrid = document.getElementById('player-lobby-list');
    dom.playerCount = document.getElementById('player-count-msg');
    dom.startGameBtn = document.getElementById('start-game-btn');
    dom.deckOptions = document.querySelector('.deck-options');
    dom.timerSelect = document.getElementById('timer-duration');
    dom.targetScoreSelect = document.getElementById('target-score');
    dom.modifiersToggle = document.getElementById('modifiers-toggle');

    // Game phases
    dom.alignmentPhase = document.getElementById('alignment-phase');
    dom.judgeChoicePhase = document.getElementById('judges-choice-section');
    dom.promptPhase = document.getElementById('prompts-phase');
    dom.drawingPhase = document.getElementById('drawing-phase');
    dom.judgingPhase = document.getElementById('judging-phase');
    dom.resultsPhase = document.getElementById('results-phase');
    dom.modifierPhase = document.getElementById('modifier-phase');
    dom.gameoverPhase = document.getElementById('gameover-phase');

    // Alignment elements
    dom.alignmentGrid = document.getElementById('alignment-grid');
    dom.rollBtn = document.getElementById('roll-dice-btn');
    dom.alignmentResult = document.getElementById('alignment-result');
    dom.alignmentResultName = document.getElementById('alignment-result-name');
    dom.alignmentDescription = document.getElementById('alignment-result-desc');
    dom.drawCardsBtn = document.getElementById('draw-cards-btn');

    // Judge choice elements
    dom.judgeChoiceGrid = document.getElementById('judges-choice-grid');

    // Prompt elements
    dom.drawPromptsBtn = document.getElementById('draw-prompts-btn');
    dom.promptCards = document.getElementById('prompt-cards-container');
    dom.confirmPromptBtn = document.getElementById('confirm-prompt-btn');
    dom.promptsAlignmentDisplay = document.getElementById('prompts-alignment-display');

    // Drawing phase elements
    dom.drawingPromptDisplay = document.getElementById('drawing-prompt');
    dom.drawingAlignmentDisplay = document.getElementById('drawing-alignment');
    dom.timerText = document.getElementById('timer-value');
    dom.endDrawingBtn = document.getElementById('end-drawing-btn');
    dom.submissionCounter = document.getElementById('submission-counter');
    dom.activeModifiers = document.getElementById('active-modifiers-list');

    // Judging phase elements
    dom.submissionGallery = document.getElementById('submissions-gallery');
    dom.judgingAlignment = document.getElementById('judging-alignment');
    dom.judgingPrompt = document.getElementById('judging-prompt');
    dom.confirmWinnerBtn = document.getElementById('confirm-winner-btn');

    // Results phase elements
    dom.resultsWinner = document.getElementById('winner-announcement');
    dom.winnerAvatar = document.getElementById('winner-avatar');
    dom.winnerName = document.getElementById('winner-name');
    dom.tokenAwards = document.getElementById('token-awards-list');
    dom.nextRoundBtn = document.getElementById('next-round-btn');

    // Modifier phase elements
    dom.modifierCurserInfo = document.getElementById('curser-display');
    dom.curserAvatar = document.getElementById('curser-avatar');
    dom.curserName = document.getElementById('curser-name');
    dom.drawCurseBtn = document.getElementById('draw-curse-btn');
    dom.skipModifiersBtn = document.getElementById('skip-curse-btn');
    dom.curseCardDisplay = document.getElementById('curse-card-display');
    dom.curseCardIcon = document.getElementById('curse-card-icon');
    dom.curseCardName = document.getElementById('curse-card-name');
    dom.curseCardDesc = document.getElementById('curse-card-desc');
    dom.curseTargetHeading = document.getElementById('curse-target-heading');
    dom.curseTargetSelection = document.getElementById('curse-target-grid');
    dom.curseActions = document.getElementById('curse-actions');
    dom.applyCurseBtn = document.getElementById('apply-curse-btn');
    dom.holdCurseBtn = document.getElementById('hold-curse-btn');

    // Scoreboard elements
    dom.scoreboard = document.getElementById('scoreboard-content');
    dom.scoreboardList = document.getElementById('scoreboard-grid');
    dom.scoreboardToggle = document.getElementById('scoreboard-toggle');

    // Game info elements
    dom.roundDisplay = document.getElementById('round-number');
    dom.judgeNameDisplay = document.getElementById('judge-name');
    dom.judgeAvatarDisplay = document.getElementById('judge-avatar');
    dom.targetScoreDisplay = document.getElementById('target-score-display');

    // Game over elements
    dom.gameOverWinner = document.getElementById('gameover-winner-name');
    dom.finalRankings = document.getElementById('final-scoreboard');
    dom.playAgainBtn = document.getElementById('play-again-btn');

    // Steal modal
    dom.stealModal = document.getElementById('steal-modal');
    dom.stealTargetList = document.getElementById('steal-target-list');
    dom.stealModalClose = document.getElementById('steal-close-btn');

    // Notification container
    dom.notificationContainer = document.getElementById('notification-container');
}

// =============================================================================
// SOUND EFFECTS
// =============================================================================

const sounds = {};

function loadSounds() {
    const soundNames = ['roll', 'timer-end', 'token-gain', 'point-gain', 'steal', 'win', 'draw'];
    soundNames.forEach(name => {
        const el = document.getElementById(`sfx-${name}`);
        if (el) {
            sounds[name] = el;
        }
    });
}

function playSound(name) {
    const sound = sounds[name];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {
            // Autoplay may be blocked; ignore
        });
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    cacheDomElements();
    loadSounds();
    setupJudgeChoiceGrid();
    setupEventListeners();
    setupSocketListeners();
});

function setupJudgeChoiceGrid() {
    if (!dom.judgeChoiceGrid) return;
    const cells = dom.judgeChoiceGrid.querySelectorAll('.judges-choice-cell');
    cells.forEach(cell => {
        const code = cell.dataset.align;
        if (code) {
            cell.addEventListener('click', () => {
                handleJudgeAlignmentClick(code, cell);
            });
        }
    });
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Create room
    if (dom.createRoomBtn) {
        dom.createRoomBtn.addEventListener('click', createRoom);
    }

    // Deck option clicks (deck-card class, not deck-option)
    if (dom.deckOptions) {
        dom.deckOptions.addEventListener('click', (e) => {
            const option = e.target.closest('.deck-card');
            if (!option) return;
            option.classList.toggle('selected');
            updateStartButtonState();
        });
    }

    // Start game
    if (dom.startGameBtn) {
        dom.startGameBtn.addEventListener('click', startGame);
    }

    // Roll alignment
    if (dom.rollBtn) {
        dom.rollBtn.addEventListener('click', rollAlignment);
    }

    // Draw prompts
    if (dom.drawPromptsBtn) {
        dom.drawPromptsBtn.addEventListener('click', drawPrompts);
    }

    // End drawing
    if (dom.endDrawingBtn) {
        dom.endDrawingBtn.addEventListener('click', endDrawing);
    }

    // Next round
    if (dom.nextRoundBtn) {
        dom.nextRoundBtn.addEventListener('click', nextRound);
    }

    // Modifier phase buttons
    if (dom.drawCurseBtn) {
        dom.drawCurseBtn.addEventListener('click', drawCurseCard);
    }

    if (dom.skipModifiersBtn) {
        dom.skipModifiersBtn.addEventListener('click', skipModifiers);
    }

    if (dom.holdCurseBtn) {
        dom.holdCurseBtn.addEventListener('click', () => {
            if (gameState.currentModifier) {
                holdCurse();
            }
        });
    }

    // Play again
    if (dom.playAgainBtn) {
        dom.playAgainBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Scoreboard toggle
    if (dom.scoreboardToggle) {
        dom.scoreboardToggle.addEventListener('click', () => {
            if (dom.scoreboard) {
                dom.scoreboard.classList.toggle('open');
            }
            const arrow = document.getElementById('scoreboard-arrow');
            if (arrow) {
                arrow.classList.toggle('open');
            }
        });
    }

    // Steal modal close
    if (dom.stealModalClose) {
        dom.stealModalClose.addEventListener('click', () => {
            closeStealModal();
        });
    }

    // Close steal modal on backdrop click
    if (dom.stealModal) {
        dom.stealModal.addEventListener('click', (e) => {
            if (e.target === dom.stealModal) {
                closeStealModal();
            }
        });
    }
}

// =============================================================================
// SOCKET LISTENERS
// =============================================================================

function setupSocketListeners() {
    // -- Room events --

    socket.on('room:playerJoined', (data) => {
        gameState.players = data.players;
        updateLobbyPlayers();
        updateStartButtonState();
        showNotification(`${data.player.name} joined!`, 'info');
    });

    socket.on('room:playerLeft', (data) => {
        gameState.players = data.players;
        updateLobbyPlayers();
        updateStartButtonState();
        updateScoreboard();
    });

    socket.on('room:playerDisconnected', (data) => {
        gameState.players = data.players;
        const player = data.players.find(p => p.id === data.playerId);
        const name = player ? player.name : 'A player';
        showNotification(`${name} disconnected`, 'warning');
        updateLobbyPlayers();
        updateScoreboard();
    });

    socket.on('room:playerReconnected', (data) => {
        showNotification(`${data.playerName} reconnected!`, 'success');
        // Request fresh state
        socket.emit('game:getState', (response) => {
            if (response.success) {
                syncFromServerState(response.gameState);
            }
        });
    });

    socket.on('room:closed', (data) => {
        showNotification(`Room closed: ${data.reason}`, 'error', 5000);
    });

    // -- Game events --

    socket.on('game:started', (state) => {
        syncFromServerState(state);
        gameState.gameStarted = true;
        showScreen('game');
        showPhase('alignment');
        updateGameUI();
        showNotification('Game started!', 'success');
    });

    socket.on('game:alignmentRolled', (data) => {
        handleAlignmentRolled(data);
    });

    socket.on('game:judgeAlignmentSelected', (data) => {
        gameState.alignment = data.alignment;
        gameState.alignmentName = data.fullName;
        updateAlignmentDisplay(data.alignment, data.fullName);
        showNotification(`Judge chose: ${data.fullName}`, 'info');

        // Transition to prompt phase after brief delay
        setTimeout(() => {
            showPhase('prompt');
            if (dom.promptsAlignmentDisplay) {
                dom.promptsAlignmentDisplay.textContent = data.fullName;
            }
            if (dom.drawPromptsBtn) {
                dom.drawPromptsBtn.disabled = false;
            }
        }, 1500);
    });

    socket.on('game:promptsDrawn', (data) => {
        handlePromptsDrawn(data);
    });

    socket.on('game:promptSelected', (data) => {
        gameState.selectedPrompt = data.prompt;
        highlightSelectedPromptCard(data.prompt);
    });

    socket.on('game:startDrawing', (data) => {
        startDrawingPhase(data);
    });

    socket.on('game:timerStarted', (data) => {
        timerRemaining = data.duration;
        updateTimerDisplay(data.duration, data.duration);
    });

    socket.on('game:timerTick', (data) => {
        timerRemaining = data.timeLeft;
        updateTimerDisplay(data.timeLeft, gameState.settings.timerDuration);
    });

    socket.on('game:timerEnd', () => {
        timerRemaining = 0;
        updateTimerDisplay(0, gameState.settings.timerDuration);
        playSound('timer-end');
        showNotification("Time's up!", 'warning');
        if (dom.endDrawingBtn) dom.endDrawingBtn.disabled = false;
    });

    socket.on('game:submissionReceived', (data) => {
        updateSubmissionCounter(data.submissionCount);
    });

    socket.on('game:submissionsCollected', (data) => {
        handleSubmissionsCollected(data);
    });

    socket.on('game:winnerSelected', (data) => {
        handleWinnerSelected(data);
    });

    socket.on('game:tokenAwarded', (data) => {
        gameState.players = data.players;
        playSound('token-gain');
        updateScoreboard();
    });

    socket.on('game:newRound', (data) => {
        handleNewRound(data);
    });

    socket.on('game:stealExecuted', (data) => {
        playSound('steal');
        showNotification(
            `${data.stealerName} stole a point from ${data.targetName}!`,
            'warning',
            4000
        );
        // Update local player scores from server data
        data.scores.forEach(scoreData => {
            const player = gameState.players.find(p => p.id === scoreData.id);
            if (player) {
                player.score = scoreData.score;
                player.tokens = scoreData.tokens;
            }
        });
        updateScoreboard();
    });

    socket.on('game:over', (data) => {
        showGameOver(data);
    });

    socket.on('game:modifierPhase', (data) => {
        showModifierPhase(data);
    });

    socket.on('game:curseCardDrawn', (data) => {
        handleCurseCardDrawn(data);
    });

    socket.on('game:curseApplied', (data) => {
        showNotification(
            `${data.modifier.icon} ${data.modifier.name} applied to ${data.targetName}!`,
            'warning',
            3000
        );
        syncFromServerState(data.gameState);
    });

    socket.on('game:curseHeld', (data) => {
        showNotification('Curse card held for later!', 'info');
        syncFromServerState(data.gameState);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        showNotification('Disconnected from server. Attempting to reconnect...', 'error', 5000);
    });

    socket.on('connect', () => {
        // If we had a room, try to reclaim host status
        if (gameState.roomCode) {
            socket.emit('host:reconnect', gameState.roomCode, (response) => {
                if (response.success) {
                    showNotification('Reconnected to room!', 'success');
                    syncFromServerState(response.gameState);
                } else {
                    // Room is gone — reset to create a new one
                    showNotification('Room expired. Please create a new room.', 'error', 5000);
                    resetToCreateRoom();
                }
            });
        }
    });

    socket.on('room:closed', () => {
        showNotification('Room has been closed.', 'error', 5000);
        resetToCreateRoom();
    });
}

/**
 * Reset the host UI back to the initial "Create Room" state.
 */
function resetToCreateRoom() {
    gameState.roomCode = null;
    gameState.players = [];
    gameState.gameStarted = false;

    if (dom.createRoomBtn) {
        dom.createRoomBtn.style.display = '';
        dom.createRoomBtn.disabled = false;
    }
    if (dom.roomCodeDisplay) {
        dom.roomCodeDisplay.classList.remove('visible');
    }
    if (dom.roomCode) {
        dom.roomCode.textContent = '----';
    }
    if (dom.joinUrl) {
        dom.joinUrl.textContent = 'Join at: /play';
    }
    if (dom.lobbyPlayerGrid) {
        dom.lobbyPlayerGrid.innerHTML = '';
    }
    if (dom.playerCount) {
        dom.playerCount.textContent = '0 / 8 players';
    }

    showScreen('lobby');
}

// =============================================================================
// SYNC HELPER
// =============================================================================

function syncFromServerState(state) {
    if (!state) return;

    gameState.roomCode = state.code || gameState.roomCode;
    gameState.players = state.players || gameState.players;
    gameState.gameStarted = state.gameStarted || false;
    gameState.currentRound = state.currentRound || 0;
    gameState.alignment = state.currentAlignment;
    gameState.alignmentName = state.currentAlignmentFullName;
    gameState.selectedPrompt = state.selectedPrompt;
    gameState.settings.targetScore = state.targetScore || state.settings?.targetScore || gameState.settings.targetScore;
    gameState.settings.timerDuration = state.settings?.timerDuration || gameState.settings.timerDuration;
    gameState.settings.modifiersEnabled = state.modifiersEnabled !== undefined ? state.modifiersEnabled : gameState.settings.modifiersEnabled;

    if (state.judge) {
        gameState.judge = state.judge;
    }

    updateGameUI();
    updateScoreboard();
}

// =============================================================================
// ROOM & LOBBY
// =============================================================================

function createRoom() {
    if (dom.createRoomBtn) dom.createRoomBtn.disabled = true;

    socket.emit('host:createRoom', (response) => {
        if (response.success) {
            gameState.roomCode = response.roomCode;
            syncFromServerState(response.gameState);

            // Show room code
            if (dom.roomCodeDisplay) {
                dom.roomCodeDisplay.classList.add('visible');
            }
            if (dom.roomCode) {
                dom.roomCode.textContent = response.roomCode;
            }
            if (dom.roomCodeRepeat) {
                dom.roomCodeRepeat.textContent = response.roomCode;
            }
            if (dom.joinUrl) {
                const url = `${window.location.origin}/play/${response.roomCode}`;
                dom.joinUrl.textContent = `Join at: ${url}`;
            }

            // Hide create button, show lobby settings
            if (dom.createRoomBtn) {
                dom.createRoomBtn.style.display = 'none';
            }

            showNotification(`Room ${response.roomCode} created!`, 'success');
        } else {
            showNotification(`Failed to create room: ${response.error}`, 'error');
            if (dom.createRoomBtn) dom.createRoomBtn.disabled = false;
        }
    });
}

function updateLobbyPlayers() {
    if (!dom.lobbyPlayerGrid) return;

    dom.lobbyPlayerGrid.innerHTML = '';

    gameState.players.forEach(player => {
        const card = document.createElement('div');
        card.classList.add('player-lobby-card');
        if (!player.connected) {
            card.classList.add('disconnected');
        }

        card.innerHTML = `
            <div class="player-lobby-avatar">${player.avatar || '\uD83C\uDFA8'}</div>
            <div class="player-lobby-name">${escapeHtml(player.name)}</div>
            ${!player.connected ? '<div class="player-status">Disconnected</div>' : ''}
        `;

        dom.lobbyPlayerGrid.appendChild(card);
    });

    if (dom.playerCount) {
        dom.playerCount.textContent = `${gameState.players.length} / 8 players`;
    }
}

function updateStartButtonState() {
    if (!dom.startGameBtn) return;
    const hasEnoughPlayers = gameState.players.length >= 3;
    const hasDecks = getSelectedDecks().length > 0;
    dom.startGameBtn.disabled = !(hasEnoughPlayers && hasDecks);

    if (!hasEnoughPlayers) {
        dom.startGameBtn.title = 'Need at least 3 players to start';
    } else if (!hasDecks) {
        dom.startGameBtn.title = 'Select at least one deck';
    } else {
        dom.startGameBtn.title = '';
    }
}

function getSelectedDecks() {
    if (!dom.deckOptions) return ['core_white'];
    const selected = dom.deckOptions.querySelectorAll('.deck-card.selected');
    const decks = [];
    selected.forEach(el => {
        if (el.dataset.deck) {
            decks.push(el.dataset.deck);
        }
    });
    return decks.length > 0 ? decks : ['core_white'];
}

function startGame() {
    const settings = {
        selectedDecks: getSelectedDecks(),
        timerDuration: dom.timerSelect ? parseInt(dom.timerSelect.value, 10) : 90,
        targetScore: dom.targetScoreSelect ? parseInt(dom.targetScoreSelect.value, 10) : 5,
        modifiersEnabled: dom.modifiersToggle ? dom.modifiersToggle.checked : true
    };

    gameState.settings = { ...gameState.settings, ...settings };

    if (dom.startGameBtn) dom.startGameBtn.disabled = true;

    socket.emit('host:startGame', settings, (response) => {
        if (!response.success) {
            showNotification(`Failed to start: ${response.error}`, 'error');
            if (dom.startGameBtn) dom.startGameBtn.disabled = false;
        }
    });
}

// =============================================================================
// SCREEN & PHASE MANAGEMENT
// =============================================================================

function showScreen(name) {
    const screens = [dom.lobbyScreen, dom.gameScreen];
    screens.forEach(screen => {
        if (screen) screen.classList.remove('active');
    });

    switch (name) {
        case 'lobby':
            if (dom.lobbyScreen) dom.lobbyScreen.classList.add('active');
            break;
        case 'game':
            if (dom.gameScreen) dom.gameScreen.classList.add('active');
            break;
        case 'gameover':
            // Game over is a phase inside game-screen
            if (dom.gameScreen) dom.gameScreen.classList.add('active');
            showPhase('gameover');
            break;
    }
}

function showPhase(name) {
    const phases = [
        dom.alignmentPhase,
        dom.judgeChoicePhase,
        dom.promptPhase,
        dom.drawingPhase,
        dom.judgingPhase,
        dom.resultsPhase,
        dom.modifierPhase,
        dom.gameoverPhase
    ];

    phases.forEach(phase => {
        if (phase) phase.classList.remove('active');
    });

    const phaseMap = {
        'alignment': dom.alignmentPhase,
        'judge-choice': dom.judgeChoicePhase,
        'prompt': dom.promptPhase,
        'drawing': dom.drawingPhase,
        'judging': dom.judgingPhase,
        'results': dom.resultsPhase,
        'modifier': dom.modifierPhase,
        'gameover': dom.gameoverPhase
    };

    const target = phaseMap[name];
    if (target) {
        target.classList.add('active');
    }

    gameState.currentPhase = name;
}

function updateGameUI() {
    // Round display
    if (dom.roundDisplay) {
        dom.roundDisplay.textContent = gameState.currentRound;
    }

    // Judge display
    const judge = gameState.judge || gameState.players.find(p => p.isJudge);
    if (judge) {
        if (dom.judgeAvatarDisplay) {
            dom.judgeAvatarDisplay.textContent = judge.avatar || '\uD83C\uDFA8';
        }
        if (dom.judgeNameDisplay) {
            dom.judgeNameDisplay.textContent = escapeHtml(judge.name);
        }
    }

    // Target score
    if (dom.targetScoreDisplay) {
        dom.targetScoreDisplay.textContent = gameState.settings.targetScore;
    }

    updateScoreboard();
}

// =============================================================================
// ALIGNMENT PHASE
// =============================================================================

function rollAlignment() {
    if (dom.rollBtn) dom.rollBtn.disabled = true;

    playSound('roll');

    // Run rolling animation: 25 iterations at 100ms
    let iteration = 0;
    const totalIterations = 25;
    const gridCells = dom.alignmentGrid ? dom.alignmentGrid.querySelectorAll('.alignment-cell') : [];

    // Clear any previous state
    gridCells.forEach(cell => {
        cell.classList.remove('rolling', 'selected', 'judges-choice');
    });

    const animInterval = setInterval(() => {
        // Clear previous rolling highlights
        gridCells.forEach(cell => cell.classList.remove('rolling'));

        // Highlight 2-4 random cells
        const count = 2 + Math.floor(Math.random() * 3);
        const indices = new Set();
        while (indices.size < count && indices.size < gridCells.length) {
            indices.add(Math.floor(Math.random() * gridCells.length));
        }
        indices.forEach(i => {
            gridCells[i].classList.add('rolling');
        });

        iteration++;
        if (iteration >= totalIterations) {
            clearInterval(animInterval);

            // Clear rolling highlights
            gridCells.forEach(cell => cell.classList.remove('rolling'));

            // Now emit to server for the actual roll result
            socket.emit('host:rollAlignment', (response) => {
                if (!response.success) {
                    showNotification(`Roll failed: ${response.error}`, 'error');
                    if (dom.rollBtn) dom.rollBtn.disabled = false;
                }
                // Result handled by game:alignmentRolled listener
            });
        }
    }, 100);
}

function handleAlignmentRolled(data) {
    const { alignment, fullName, isJudgeChoice } = data;
    gameState.alignment = alignment;
    gameState.alignmentName = fullName;

    const gridCells = dom.alignmentGrid ? dom.alignmentGrid.querySelectorAll('.alignment-cell') : [];

    // Clear animation leftovers
    gridCells.forEach(cell => cell.classList.remove('rolling', 'selected', 'judges-choice'));

    if (isJudgeChoice) {
        // Highlight entire grid with judge's choice effect
        if (dom.alignmentGrid) {
            dom.alignmentGrid.classList.add('judges-choice');
        }

        updateAlignmentResult("Judge's Choice!", "The Judge picks any alignment!");

        // Show judge choice phase (inside alignment phase)
        setTimeout(() => {
            if (dom.judgeChoicePhase) {
                dom.judgeChoicePhase.style.display = 'block';
            }
        }, 1500);
    } else {
        // Highlight the final selected cell
        gridCells.forEach(cell => {
            if (cell.dataset.align === alignment) {
                cell.classList.add('selected');
            }
        });

        updateAlignmentResult(fullName, ALIGNMENT_EXAMPLES[alignment] || '');
        updateAlignmentDisplay(alignment, fullName);

        // Enable draw prompts after delay
        setTimeout(() => {
            showPhase('prompt');
            if (dom.promptsAlignmentDisplay) {
                dom.promptsAlignmentDisplay.textContent = fullName;
            }
            if (dom.drawPromptsBtn) {
                dom.drawPromptsBtn.disabled = false;
            }
        }, 2000);
    }
}

function updateAlignmentResult(title, description) {
    if (dom.alignmentResult) {
        dom.alignmentResult.classList.add('visible');
    }
    if (dom.alignmentResultName) {
        dom.alignmentResultName.textContent = title;
    }
    if (dom.alignmentDescription) {
        dom.alignmentDescription.textContent = description;
    }
}

function updateAlignmentDisplay(alignment, fullName) {
    gameState.alignment = alignment;
    gameState.alignmentName = fullName;
}

function handleJudgeAlignmentClick(alignment, cell) {
    // Clear previous selections in judge choice grid
    if (dom.judgeChoiceGrid) {
        dom.judgeChoiceGrid.querySelectorAll('.judges-choice-cell').forEach(c => {
            c.classList.remove('selected');
        });
    }
    cell.classList.add('selected');

    socket.emit('host:selectJudgeAlignment', alignment, (response) => {
        if (!response.success) {
            showNotification(`Selection failed: ${response.error}`, 'error');
            cell.classList.remove('selected');
        }
        // Result handled by game:judgeAlignmentSelected listener
    });
}

// =============================================================================
// PROMPT PHASE
// =============================================================================

function drawPrompts() {
    if (dom.drawPromptsBtn) dom.drawPromptsBtn.disabled = true;

    socket.emit('host:drawPrompts', (response) => {
        if (!response.success) {
            showNotification(`Failed to draw prompts: ${response.error}`, 'error');
            if (dom.drawPromptsBtn) dom.drawPromptsBtn.disabled = false;
        }
        // Results handled by game:promptsDrawn listener
    });
}

function handlePromptsDrawn(data) {
    gameState.prompts = data.prompts;

    if (!dom.promptCards) return;
    dom.promptCards.innerHTML = '';

    data.prompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.classList.add('prompt-card');
        card.dataset.index = index;

        // Staggered dealing animation
        card.style.animationDelay = `${index * 200}ms`;
        card.classList.add('dealt');

        card.innerHTML = `
            <div class="prompt-card-content">
                <div class="prompt-number">#${index + 1}</div>
                <div class="prompt-text">${escapeHtml(prompt)}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            selectPrompt(index);
        });

        dom.promptCards.appendChild(card);
    });

    playSound('draw');
}

function selectPrompt(index) {
    // Disable all prompt cards
    if (dom.promptCards) {
        dom.promptCards.querySelectorAll('.prompt-card').forEach(card => {
            card.classList.add('disabled');
        });
    }

    socket.emit('host:selectPrompt', index, (response) => {
        if (!response.success) {
            showNotification(`Failed to select prompt: ${response.error}`, 'error');
            // Re-enable cards
            if (dom.promptCards) {
                dom.promptCards.querySelectorAll('.prompt-card').forEach(card => {
                    card.classList.remove('disabled');
                });
            }
        }
    });
}

function highlightSelectedPromptCard(prompt) {
    if (!dom.promptCards) return;

    dom.promptCards.querySelectorAll('.prompt-card').forEach(card => {
        const textEl = card.querySelector('.prompt-text');
        if (textEl && textEl.textContent === prompt) {
            card.classList.add('selected');
        } else {
            card.classList.add('dimmed');
        }
    });
}

// =============================================================================
// DRAWING PHASE
// =============================================================================

function startDrawingPhase(data) {
    showPhase('drawing');

    // Display prompt and alignment
    if (dom.drawingPromptDisplay) {
        dom.drawingPromptDisplay.textContent = data.prompt;
    }
    if (dom.drawingAlignmentDisplay) {
        dom.drawingAlignmentDisplay.textContent = data.alignmentFullName;
    }

    // Show active modifiers for all players
    renderActiveModifiers();

    // Reset submission counter
    updateSubmissionCounter(0);

    // Setup timer display
    const duration = data.timeLimit || gameState.settings.timerDuration;
    if (duration && duration > 0) {
        updateTimerDisplay(duration, duration);
    } else {
        if (dom.timerText) dom.timerText.textContent = 'No Timer';
    }

    if (dom.endDrawingBtn) {
        dom.endDrawingBtn.disabled = false;
    }

    // Auto-start timer
    startTimer();

    gameState.selectedPrompt = data.prompt;
}

function renderActiveModifiers() {
    if (!dom.activeModifiers) return;
    dom.activeModifiers.innerHTML = '';

    const modifiedPlayers = gameState.players.filter(
        p => p.activeModifiers && p.activeModifiers.length > 0 && !p.isJudge
    );

    if (modifiedPlayers.length === 0) {
        dom.activeModifiers.style.display = 'none';
        return;
    }

    dom.activeModifiers.style.display = '';
    modifiedPlayers.forEach(player => {
        player.activeModifiers.forEach(mod => {
            const modEl = document.createElement('div');
            modEl.classList.add('active-modifier');
            modEl.innerHTML = `
                <span class="modifier-icon">${mod.icon || '\u26A0\uFE0F'}</span>
                <span class="modifier-target">${escapeHtml(player.name)}</span>
                <span class="modifier-name">${escapeHtml(mod.name)}</span>
                <span class="modifier-desc">${escapeHtml(mod.description)}</span>
            `;
            dom.activeModifiers.appendChild(modEl);
        });
    });
}

function startTimer() {
    const duration = gameState.settings.timerDuration;
    if (!duration || duration <= 0) return;

    socket.emit('host:startTimer', duration, (response) => {
        if (!response.success) {
            showNotification('Failed to start timer', 'error');
        }
    });
}

function updateTimerDisplay(timeLeft, totalDuration) {
    if (dom.timerText) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        dom.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Warning class when low
        if (timeLeft <= 10 && timeLeft > 0) {
            dom.timerText.classList.add('warning');
        } else {
            dom.timerText.classList.remove('warning');
        }

        if (timeLeft <= 0) {
            dom.timerText.classList.add('expired');
        } else {
            dom.timerText.classList.remove('expired');
        }
    }
}

function updateSubmissionCounter(count) {
    if (!dom.submissionCounter) return;
    const nonJudgePlayers = gameState.players.filter(p => !p.isJudge);
    const total = nonJudgePlayers.length;
    dom.submissionCounter.textContent = `${count} / ${total} drawings submitted`;
}

function endDrawing() {
    if (dom.endDrawingBtn) dom.endDrawingBtn.disabled = true;

    socket.emit('host:endDrawing', (response) => {
        if (!response.success) {
            showNotification('Failed to end drawing phase', 'error');
            if (dom.endDrawingBtn) dom.endDrawingBtn.disabled = false;
        }
        // Results handled by game:submissionsCollected listener
    });
}

// =============================================================================
// JUDGING PHASE
// =============================================================================

function handleSubmissionsCollected(data) {
    currentSubmissions = data.submissions || [];
    showPhase('judging');
    renderSubmissionGallery(currentSubmissions);
}

function renderSubmissionGallery(submissions) {
    if (!dom.submissionGallery) return;
    dom.submissionGallery.innerHTML = '';

    if (submissions.length === 0) {
        dom.submissionGallery.innerHTML = '<div class="no-submissions">No drawings were submitted this round.</div>';
        return;
    }

    submissions.forEach((sub, index) => {
        const card = document.createElement('div');
        card.classList.add('submission-card');
        card.dataset.playerId = sub.playerId;

        // Staggered reveal animation
        card.style.animationDelay = `${index * 150}ms`;
        card.classList.add('revealing');

        card.innerHTML = `
            <div class="submission-drawing">
                <img src="${sub.drawing}" alt="Drawing by ${escapeHtml(sub.playerName)}" />
            </div>
            <div class="submission-info">
                <span class="submission-avatar">${sub.playerAvatar || '\uD83C\uDFA8'}</span>
                <span class="submission-name">${escapeHtml(sub.playerName)}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            selectWinner(sub.playerId);
        });

        dom.submissionGallery.appendChild(card);
    });
}

function selectWinner(playerId) {
    // Highlight selected and disable all
    if (dom.submissionGallery) {
        dom.submissionGallery.querySelectorAll('.submission-card').forEach(card => {
            card.classList.add('disabled');
            if (card.dataset.playerId === playerId) {
                card.classList.add('winner');
            }
        });
    }

    socket.emit('host:selectWinner', playerId, (response) => {
        if (!response.success) {
            showNotification(`Failed to select winner: ${response.error}`, 'error');
            // Re-enable cards
            if (dom.submissionGallery) {
                dom.submissionGallery.querySelectorAll('.submission-card').forEach(card => {
                    card.classList.remove('disabled', 'winner');
                });
            }
        }
        // Result handled by game:winnerSelected listener
    });
}

// =============================================================================
// RESULTS / SCORING PHASE
// =============================================================================

function handleWinnerSelected(data) {
    playSound('point-gain');

    // Update local scores
    data.scores.forEach(scoreData => {
        const player = gameState.players.find(p => p.id === scoreData.id);
        if (player) {
            player.score = scoreData.score;
            player.tokens = scoreData.tokens;
        }
    });

    if (data.gameOver) {
        // Game over handled by game:over event
        return;
    }

    showResultsPhase(data);
}

function showResultsPhase(data) {
    showPhase('results');

    // Reset tokens tracking for this round
    gameState.tokensAwardedThisRound = [];

    // Show winner announcement
    const winner = gameState.players.find(p => p.id === data.winnerId);
    if (dom.winnerAvatar) {
        dom.winnerAvatar.textContent = winner ? (winner.avatar || '\uD83C\uDFA8') : '\uD83C\uDFC6';
    }
    if (dom.winnerName) {
        dom.winnerName.textContent = escapeHtml(data.winnerName);
    }

    // Generate token award UI for each non-judge player
    renderTokenAwards();

    // Enable next round button
    if (dom.nextRoundBtn) {
        dom.nextRoundBtn.disabled = false;
    }

    updateScoreboard();
}

function renderTokenAwards() {
    if (!dom.tokenAwards) return;
    dom.tokenAwards.innerHTML = '';

    const nonJudgePlayers = gameState.players.filter(p => !p.isJudge);

    nonJudgePlayers.forEach(player => {
        const playerRow = document.createElement('div');
        playerRow.classList.add('token-award-row');
        playerRow.dataset.playerId = player.id;

        let buttonsHtml = '';
        TOKEN_TYPE_KEYS.forEach(tokenType => {
            const tokenInfo = TOKEN_TYPES[tokenType];
            const isAwarded = gameState.tokensAwardedThisRound.includes(tokenType);
            const awardedToThis = gameState.tokensAwardedThisRound.find(
                t => t === tokenType
            );
            buttonsHtml += `
                <button class="token-btn ${isAwarded ? 'unavailable' : ''}"
                        data-player-id="${player.id}"
                        data-token-type="${tokenType}"
                        ${isAwarded ? 'disabled' : ''}
                        title="${tokenInfo.description}">
                    ${tokenInfo.icon} ${tokenInfo.name}
                </button>
            `;
        });

        playerRow.innerHTML = `
            <div class="token-player-info">
                <span class="token-player-avatar">${player.avatar || '\uD83C\uDFA8'}</span>
                <span class="token-player-name">${escapeHtml(player.name)}</span>
            </div>
            <div class="token-buttons">
                ${buttonsHtml}
            </div>
        `;

        dom.tokenAwards.appendChild(playerRow);
    });

    // Attach click handlers to token buttons
    dom.tokenAwards.querySelectorAll('.token-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const playerId = btn.dataset.playerId;
            const tokenType = btn.dataset.tokenType;
            awardToken(playerId, tokenType, btn);
        });
    });
}

function awardToken(playerId, tokenType, buttonEl) {
    // Check if this token type was already awarded this round
    if (gameState.tokensAwardedThisRound.includes(tokenType)) {
        showNotification('This token type was already awarded this round.', 'warning');
        return;
    }

    buttonEl.disabled = true;

    socket.emit('host:awardToken', { playerId, tokenType }, (response) => {
        if (response.success) {
            // Mark as awarded
            gameState.tokensAwardedThisRound.push(tokenType);
            buttonEl.classList.add('awarded');
            buttonEl.disabled = true;

            // Grey out same token type for other players
            if (dom.tokenAwards) {
                dom.tokenAwards.querySelectorAll(`.token-btn[data-token-type="${tokenType}"]`).forEach(otherBtn => {
                    if (otherBtn !== buttonEl) {
                        otherBtn.classList.add('unavailable');
                        otherBtn.disabled = true;
                    }
                });
            }
        } else {
            showNotification(`Failed to award token: ${response.error}`, 'error');
            buttonEl.disabled = false;
        }
    });
}

// =============================================================================
// NEXT ROUND / MODIFIERS
// =============================================================================

function nextRound() {
    if (dom.nextRoundBtn) dom.nextRoundBtn.disabled = true;

    // Check for modifier phase first
    socket.emit('host:checkModifiers', (response) => {
        if (response.hasModifierPhase) {
            // Modifier phase will be shown via game:modifierPhase event
            return;
        }

        // No modifier phase, advance directly
        socket.emit('host:nextRound', (roundResponse) => {
            if (!roundResponse.success) {
                showNotification(`Failed to advance round: ${roundResponse.error}`, 'error');
                if (dom.nextRoundBtn) dom.nextRoundBtn.disabled = false;
            }
            // Results handled by game:newRound or game:over listeners
        });
    });
}

function handleNewRound(data) {
    gameState.currentRound = data.round;
    gameState.judge = data.judge;

    if (data.gameState) {
        syncFromServerState(data.gameState);
    }

    // Reset UI for new round
    resetRoundUI();

    showPhase('alignment');
    updateGameUI();
    showNotification(`Round ${data.round} - ${data.judge.name} is the Judge!`, 'info');
}

function resetRoundUI() {
    // Clear alignment grid highlights
    if (dom.alignmentGrid) {
        dom.alignmentGrid.classList.remove('judges-choice');
        dom.alignmentGrid.querySelectorAll('.alignment-cell').forEach(cell => {
            cell.classList.remove('rolling', 'selected', 'judges-choice');
        });
    }

    // Hide judges choice section
    if (dom.judgeChoicePhase) {
        dom.judgeChoicePhase.style.display = 'none';
    }

    // Reset alignment result
    if (dom.alignmentResult) {
        dom.alignmentResult.classList.remove('visible');
    }
    if (dom.alignmentResultName) {
        dom.alignmentResultName.textContent = '---';
    }
    if (dom.alignmentDescription) {
        dom.alignmentDescription.textContent = '---';
    }

    // Re-enable roll button
    if (dom.rollBtn) dom.rollBtn.disabled = false;

    // Reset prompt cards - restore placeholders
    if (dom.promptCards) {
        dom.promptCards.querySelectorAll('.prompt-card').forEach(card => {
            card.textContent = '\u00A0';
            card.classList.remove('selected', 'dimmed', 'dealing', 'disabled');
        });
    }
    if (dom.drawPromptsBtn) dom.drawPromptsBtn.disabled = true;
    if (dom.confirmPromptBtn) dom.confirmPromptBtn.disabled = true;

    // Reset timer
    if (dom.timerText) {
        dom.timerText.textContent = '--';
        dom.timerText.classList.remove('warning', 'expired');
    }

    // Reset submission gallery
    if (dom.submissionGallery) dom.submissionGallery.innerHTML = '';

    // Reset results
    if (dom.winnerAvatar) dom.winnerAvatar.textContent = '\uD83C\uDFA8';
    if (dom.winnerName) dom.winnerName.textContent = '---';
    if (dom.tokenAwards) dom.tokenAwards.innerHTML = '';

    // Reset modifier phase
    if (dom.curseCardDisplay) dom.curseCardDisplay.style.display = 'none';
    if (dom.curseTargetSelection) dom.curseTargetSelection.innerHTML = '';

    // Reset tracking
    currentSubmissions = [];
    gameState.tokensAwardedThisRound = [];
    gameState.currentModifier = null;
    pendingModifierData = null;
}

// =============================================================================
// MODIFIER (CURSE) PHASE
// =============================================================================

function showModifierPhase(data) {
    pendingModifierData = data;
    showPhase('modifier');

    const curser = data.curser;
    if (dom.curserAvatar) {
        dom.curserAvatar.textContent = curser.avatar || '\uD83D\uDE08';
    }
    if (dom.curserName) {
        dom.curserName.textContent = escapeHtml(curser.name);
    }

    // Show/hide buttons
    if (dom.drawCurseBtn) {
        dom.drawCurseBtn.disabled = false;
        dom.drawCurseBtn.style.display = '';
    }

    if (dom.skipModifiersBtn) {
        dom.skipModifiersBtn.disabled = false;
    }

    // Hide curse card details and target selection until card is drawn
    if (dom.curseCardDisplay) dom.curseCardDisplay.style.display = 'none';
    if (dom.curseTargetHeading) dom.curseTargetHeading.style.display = 'none';
    if (dom.curseTargetSelection) {
        dom.curseTargetSelection.style.display = 'none';
        dom.curseTargetSelection.innerHTML = '';
    }
    if (dom.curseActions) dom.curseActions.style.display = 'none';
}

function drawCurseCard() {
    if (dom.drawCurseBtn) dom.drawCurseBtn.disabled = true;

    socket.emit('host:drawCurseCard', (response) => {
        if (!response.success) {
            showNotification(`Failed to draw curse: ${response.error}`, 'error');
            if (dom.drawCurseBtn) dom.drawCurseBtn.disabled = false;
        }
        // Result handled by game:curseCardDrawn listener
    });
}

function handleCurseCardDrawn(data) {
    const modifier = data.modifier;
    gameState.currentModifier = modifier;

    // Show curse card details
    if (dom.curseCardDisplay) dom.curseCardDisplay.style.display = '';
    if (dom.curseCardIcon) dom.curseCardIcon.textContent = modifier.icon || '\u26A0\uFE0F';
    if (dom.curseCardName) dom.curseCardName.textContent = escapeHtml(modifier.name);
    if (dom.curseCardDesc) dom.curseCardDesc.textContent = escapeHtml(modifier.description);

    // Hide draw button
    if (dom.drawCurseBtn) dom.drawCurseBtn.style.display = 'none';

    // Show actions (apply, hold, skip)
    if (dom.curseActions) dom.curseActions.style.display = '';
    if (dom.applyCurseBtn) dom.applyCurseBtn.disabled = true; // Enabled after target selected

    // Show target selection
    showCurseTargetSelection(modifier);
}

function showCurseTargetSelection(modifier) {
    if (!dom.curseTargetSelection) return;
    dom.curseTargetSelection.innerHTML = '';
    dom.curseTargetSelection.style.display = '';
    if (dom.curseTargetHeading) dom.curseTargetHeading.style.display = '';

    const curserIndex = pendingModifierData ? pendingModifierData.curserIndex : -1;
    let selectedTargetIndex = null;

    gameState.players.forEach((player, index) => {
        // Cannot target judge or self (curser)
        const isJudge = player.isJudge;
        const isCurser = index === curserIndex;

        if (isJudge || isCurser) return;

        const targetBtn = document.createElement('button');
        targetBtn.classList.add('curse-target-card');
        targetBtn.innerHTML = `
            <span class="curse-target-avatar">${player.avatar || '\uD83C\uDFA8'}</span>
            <span class="curse-target-name">${escapeHtml(player.name)}</span>
        `;

        targetBtn.addEventListener('click', () => {
            // Highlight selected target
            dom.curseTargetSelection.querySelectorAll('.curse-target-card').forEach(c => c.classList.remove('selected'));
            targetBtn.classList.add('selected');
            selectedTargetIndex = index;
            if (dom.applyCurseBtn) dom.applyCurseBtn.disabled = false;
        });

        dom.curseTargetSelection.appendChild(targetBtn);
    });

    // Setup apply curse button
    if (dom.applyCurseBtn) {
        dom.applyCurseBtn.onclick = () => {
            if (selectedTargetIndex !== null) {
                applyCurse(selectedTargetIndex, modifier);
            }
        };
    }
}

function applyCurse(targetIndex, modifier) {
    // Disable buttons
    if (dom.applyCurseBtn) dom.applyCurseBtn.disabled = true;
    if (dom.holdCurseBtn) dom.holdCurseBtn.disabled = true;

    socket.emit('host:applyCurse', { targetIndex, modifier }, (response) => {
        if (response.success) {
            // After applying, advance to next round
            setTimeout(() => {
                advanceAfterModifiers();
            }, 2000);
        } else {
            showNotification(`Failed to apply curse: ${response.error}`, 'error');
            if (dom.applyCurseBtn) dom.applyCurseBtn.disabled = false;
            if (dom.holdCurseBtn) dom.holdCurseBtn.disabled = false;
        }
    });
}

function holdCurse() {
    const modifier = gameState.currentModifier;
    if (!modifier) return;

    if (dom.holdCurseBtn) dom.holdCurseBtn.disabled = true;

    socket.emit('host:holdCurse', modifier, (response) => {
        if (response.success) {
            showNotification('Curse held for a future round!', 'info');
            // Advance to next round
            setTimeout(() => {
                advanceAfterModifiers();
            }, 1500);
        } else {
            showNotification(`Failed to hold curse: ${response.error}`, 'error');
            if (dom.holdCurseBtn) dom.holdCurseBtn.disabled = false;
        }
    });
}

function skipModifiers() {
    advanceAfterModifiers();
}

function advanceAfterModifiers() {
    socket.emit('host:nextRound', (response) => {
        if (!response.success) {
            showNotification(`Failed to advance round: ${response.error}`, 'error');
        }
        // Results handled by game:newRound or game:over listeners
    });
}

// =============================================================================
// SCOREBOARD
// =============================================================================

function updateScoreboard() {
    if (!dom.scoreboardList) return;
    dom.scoreboardList.innerHTML = '';

    // Sort players by score (descending), then by total tokens (descending)
    const sorted = [...gameState.players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aTokens = getTotalTokens(a);
        const bTokens = getTotalTokens(b);
        return bTokens - aTokens;
    });

    sorted.forEach((player, rank) => {
        const entry = document.createElement('div');
        entry.classList.add('scoreboard-entry');
        if (player.isJudge) entry.classList.add('is-judge');
        if (!player.connected) entry.classList.add('disconnected');
        if (player.activeModifiers && player.activeModifiers.length > 0) {
            entry.classList.add('cursed');
        }

        const totalTokens = getTotalTokens(player);
        const tokenIcons = buildTokenIcons(player.tokens);
        const canSteal = totalTokens >= 3 && !player.isJudge;

        entry.innerHTML = `
            <div class="scoreboard-rank">${rank + 1}</div>
            <div class="scoreboard-avatar">${player.avatar || '\uD83C\uDFA8'}</div>
            <div class="scoreboard-name">
                ${escapeHtml(player.name)}
                ${player.isJudge ? '<span class="judge-indicator">\uD83D\uDD28</span>' : ''}
                ${!player.connected ? '<span class="dc-indicator">\u274C</span>' : ''}
            </div>
            <div class="scoreboard-score">${player.score}</div>
            <div class="scoreboard-tokens">${tokenIcons}</div>
            ${player.activeModifiers && player.activeModifiers.length > 0
                ? `<div class="scoreboard-curses">${player.activeModifiers.map(m => `<span title="${escapeHtml(m.name)}">${m.icon || '\u26A0\uFE0F'}</span>`).join('')}</div>`
                : ''}
            ${canSteal
                ? `<button class="steal-btn" data-player-id="${player.id}" title="Spend 3 tokens to steal a point">\uD83D\uDC80 Steal</button>`
                : ''}
        `;

        dom.scoreboardList.appendChild(entry);
    });

    // Attach steal button handlers
    dom.scoreboardList.querySelectorAll('.steal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openStealModal(btn.dataset.playerId);
        });
    });
}

function getTotalTokens(player) {
    if (!player.tokens) return player.totalTokens || 0;
    return Object.values(player.tokens).reduce((sum, count) => sum + count, 0);
}

function buildTokenIcons(tokens) {
    if (!tokens) return '';
    let icons = '';
    TOKEN_TYPE_KEYS.forEach(key => {
        const count = tokens[key] || 0;
        if (count > 0) {
            icons += `<span class="token-icon" title="${TOKEN_TYPES[key].name}">${TOKEN_TYPES[key].icon}${count > 1 ? `x${count}` : ''}</span>`;
        }
    });
    return icons || '<span class="no-tokens">-</span>';
}

// =============================================================================
// STEAL MECHANIC
// =============================================================================

function openStealModal(stealerPlayerId) {
    if (!dom.stealModal) return;

    const stealer = gameState.players.find(p => p.id === stealerPlayerId);
    if (!stealer) return;

    // Build target list (players with score > 0 who are not the stealer)
    if (!dom.stealTargetList) return;
    dom.stealTargetList.innerHTML = '';

    const targets = gameState.players.filter(
        p => p.id !== stealerPlayerId && p.score > 0
    );

    if (targets.length === 0) {
        dom.stealTargetList.innerHTML = '<div class="no-targets">No valid targets (no other players with points).</div>';
    } else {
        targets.forEach(target => {
            const targetBtn = document.createElement('button');
            targetBtn.classList.add('steal-target-option');
            targetBtn.innerHTML = `
                <span class="target-avatar">${target.avatar || '\uD83C\uDFA8'}</span>
                <span class="target-name">${escapeHtml(target.name)}</span>
                <span class="target-score">Score: ${target.score}</span>
            `;
            targetBtn.addEventListener('click', () => {
                executeSteal(stealerPlayerId, target.id);
                closeStealModal();
            });
            dom.stealTargetList.appendChild(targetBtn);
        });
    }

    dom.stealModal.classList.add('visible');
}

function closeStealModal() {
    if (dom.stealModal) {
        dom.stealModal.classList.remove('visible');
    }
}

function executeSteal(fromId, targetId) {
    socket.emit('player:steal', targetId, (response) => {
        if (!response.success) {
            showNotification(`Steal failed: ${response.error}`, 'error');
        }
        // Result handled by game:stealExecuted listener
    });
}

// =============================================================================
// GAME OVER
// =============================================================================

function showGameOver(data) {
    playSound('win');
    showScreen('gameover');

    // Display winner
    if (dom.gameOverWinner && data.winner) {
        dom.gameOverWinner.textContent = `${data.winner.avatar || '\uD83D\uDC51'} ${escapeHtml(data.winner.name)} Wins!`;
    }

    // Display final rankings with medals
    if (dom.finalRankings && data.finalScores) {
        dom.finalRankings.innerHTML = '';
        const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

        const sorted = [...data.finalScores].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const aTokens = a.tokens ? Object.values(a.tokens).reduce((s, c) => s + c, 0) : 0;
            const bTokens = b.tokens ? Object.values(b.tokens).reduce((s, c) => s + c, 0) : 0;
            return bTokens - aTokens;
        });

        sorted.forEach((player, index) => {
            const row = document.createElement('div');
            row.classList.add('final-score-row');
            if (index === 0) row.classList.add('winner');

            const medal = medals[index] || `#${index + 1}`;
            const totalTokens = player.tokens
                ? Object.values(player.tokens).reduce((s, c) => s + c, 0)
                : 0;

            row.innerHTML = `
                <span class="final-rank">${medal}</span>
                <span class="final-player-avatar">${player.avatar || '\uD83C\uDFA8'}</span>
                <span class="final-player-name">${escapeHtml(player.name)}</span>
                <span class="final-player-score">${player.score} pts</span>
                <span class="final-player-tokens">${totalTokens} tokens</span>
            `;

            dom.finalRankings.appendChild(row);
        });
    }

    if (dom.playAgainBtn) {
        dom.playAgainBtn.disabled = false;
    }
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

function showNotification(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    let container = dom.notificationContainer;
    if (!container) {
        container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        dom.notificationContainer = container;
    }

    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger entrance animation
    requestAnimationFrame(() => {
        notification.classList.add('visible');
    });

    // Auto-remove
    setTimeout(() => {
        notification.classList.remove('visible');
        notification.classList.add('exiting');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, duration);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
