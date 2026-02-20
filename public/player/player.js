/**
 * Perfectly Aligned - Player Controller
 * =======================================
 * Client-side JavaScript for the player interface.
 * Handles joining rooms, drawing on canvas, submitting artwork,
 * and all real-time game interaction via Socket.IO.
 *
 * Designed for mobile-first touch input with desktop mouse fallback.
 */

/* global io */

// =============================================================================
// CONSTANTS
// =============================================================================

const AVATARS = [
    '/assets/images/avatars/alienlady.png',
    '/assets/images/avatars/cowboy.png',
    '/assets/images/avatars/cyberdude.png',
    '/assets/images/avatars/cyberlady.png',
    '/assets/images/avatars/dadskeleton.png',
    '/assets/images/avatars/elfgirl.png',
    '/assets/images/avatars/king.png',
    '/assets/images/avatars/lionguy.png',
    '/assets/images/avatars/lizardguy.png',
    '/assets/images/avatars/monster.png',
    '/assets/images/avatars/mushroomgunner.png',
    '/assets/images/avatars/sleepybuddy.png',
    '/assets/images/avatars/vampiregirl.png',
    '/assets/images/avatars/warriorqueen.png'
];
const DEFAULT_AVATAR = AVATARS[0];
const DEFAULT_AVATAR_FALLBACK = '?';

const RECONNECT_DELAY_MS = 3000;
const NOTIFICATION_DURATION_MS = 3000;
const TOKENS_REQUIRED_TO_STEAL = 3;

// Fixed canvas internal resolution (9:16 smartphone ratio)
// All drawings use this resolution regardless of device screen size
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

// =============================================================================
// PLAYER STATE
// =============================================================================

let playerState = {
    playerId: null,
    playerName: null,
    playerAvatar: null,
    roomCode: null,
    reconnectToken: null,
    connected: false,
    isJudge: false,
    score: 0,
    tokens: { mindReader: 0, technicalMerit: 0, perfectAlignment: 0, plotTwist: 0 },
    hasSubmitted: false,
    currentPhase: 'join',
    activeModifiers: [],
    heldCurse: null,
    isCurser: false,
    pendingAvatarSync: null
};

let currentAvatarIndex = 0;
let usedAvatars = [];

// =============================================================================
// DRAWING STATE
// =============================================================================

let canvas, ctx;
let isDrawing = false;
let lastX = 0, lastY = 0;
let currentColor = '#000000';
let currentSize = 8;
let drawingHistory = [];
let currentPath = [];

// =============================================================================
// SOCKET
// =============================================================================

let socket = null;
let disconnectTimer = null;

// =============================================================================
// CACHED DOM ELEMENTS
// =============================================================================

let elements = {};

function cacheElements() {
    elements = {
        // Screens
        joinScreen: document.getElementById('join-screen'),
        lobbyScreen: document.getElementById('lobby-screen'),
        waitingScreen: document.getElementById('waiting-screen'),
        drawingScreen: document.getElementById('drawing-screen'),
        submittedScreen: document.getElementById('submitted-screen'),
        judgingScreen: document.getElementById('judging-screen'),
        resultsScreen: document.getElementById('results-screen'),
        gameoverScreen: document.getElementById('gameover-screen'),
        disconnectedScreen: document.getElementById('disconnected-screen'),

        // Join form
        roomCodeInput: document.getElementById('room-code-input'),
        playerNameInput: document.getElementById('player-name-input'),
        joinButton: document.getElementById('join-btn'),
        joinError: document.getElementById('join-error'),
        avatarPreview: document.getElementById('avatar-display'),
        avatarPrevBtn: document.getElementById('avatar-prev'),
        avatarNextBtn: document.getElementById('avatar-next'),

        // Lobby
        lobbyRoomCode: document.getElementById('lobby-room-code'),
        lobbyPlayerList: document.getElementById('lobby-player-list'),

        // Waiting
        waitingMessage: document.getElementById('waiting-message'),
        waitingJudgeName: document.getElementById('waiting-judge-name'),
        waitingJudgeAvatar: document.getElementById('waiting-judge-avatar'),

        // Judge controls
        judgeControls: document.getElementById('judge-controls'),
        judgeRollBtn: document.getElementById('judge-roll-btn'),
        judgeChoiceGrid: document.getElementById('judge-choice-grid'),
        judgeDrawPromptsBtn: document.getElementById('judge-draw-prompts-btn'),
        judgePromptCards: document.getElementById('judge-prompt-cards'),
        judgeEndTimerSection: document.getElementById('judge-end-timer-section'),
        judgeEndTimerBtn: document.getElementById('judge-end-timer-btn'),
        judgeSubmissionStatus: document.getElementById('judge-submission-status'),

        // Drawing
        drawingCanvas: document.getElementById('drawing-canvas'),
        canvasContainer: document.querySelector('.canvas-container'),
        drawingPrompt: document.getElementById('draw-prompt'),
        drawingAlignment: document.getElementById('draw-alignment'),
        drawingModifiers: document.getElementById('draw-modifiers'),
        drawingTimer: document.getElementById('draw-timer-text'),
        drawingTimerBar: document.getElementById('draw-timer-bar'),
        colorButtons: document.getElementById('color-palette'),
        sizeButtons: document.getElementById('size-palette'),
        clearButton: document.getElementById('clear-btn'),
        undoButton: document.getElementById('undo-btn'),
        submitDrawingButton: document.getElementById('submit-btn'),

        // Submitted
        submittedPreview: document.getElementById('submitted-preview'),

        // Judging (judge-specific)
        judgingTitle: document.getElementById('judging-title'),
        judgeSubmissionsGallery: document.getElementById('judge-submissions-gallery'),
        judgeSubmissionsList: document.getElementById('judge-submissions-list'),
        judgeConfirmWinnerBtn: document.getElementById('judge-confirm-winner-btn'),
        judgingWaitState: document.getElementById('judging-wait-state'),

        // Results
        resultsWinner: document.getElementById('result-title'),
        resultsScore: document.getElementById('result-score'),
        resultsTokens: document.getElementById('result-tokens'),
        stealButton: document.getElementById('steal-btn'),
        stealBtnContainer: document.getElementById('steal-btn-container'),

        // Steal modal
        stealModal: document.getElementById('steal-modal'),
        stealTargetList: document.getElementById('steal-target-list'),
        stealCloseButton: document.getElementById('steal-cancel-btn'),

        // Game over
        gameoverWinner: document.getElementById('gameover-winner'),
        gameoverRank: document.getElementById('gameover-rank'),
        gameoverScores: document.getElementById('gameover-scores'),

        // Curser controls
        curserControls: document.getElementById('curser-controls'),
        playerDrawCurseBtn: document.getElementById('player-draw-curse-btn'),
        playerCurseCardDisplay: document.getElementById('player-curse-card-display'),
        playerCurseIcon: document.getElementById('player-curse-icon'),
        playerCurseName: document.getElementById('player-curse-name'),
        playerCurseDesc: document.getElementById('player-curse-desc'),
        playerCurseTargets: document.getElementById('player-curse-targets'),
        playerCurseTargetList: document.getElementById('player-curse-target-list'),
        playerCurseActions: document.getElementById('player-curse-actions'),
        playerApplyCurseBtn: document.getElementById('player-apply-curse-btn'),
        playerHoldCurseBtn: document.getElementById('player-hold-curse-btn'),
        playerSkipCurseBtn: document.getElementById('player-skip-curse-btn'),

        // Disconnected
        disconnectedReason: document.getElementById('disconnect-reason'),
        rejoinButton: document.getElementById('rejoin-btn'),

        // New game buttons
        newGameBtn: document.getElementById('new-game-btn'),
        disconnectNewGameBtn: document.getElementById('disconnect-new-game-btn'),

        // Notification container
        notificationContainer: document.getElementById('notification-container')
    };
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    cacheElements();

    // Check URL for room code: /play/XXXX
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.length === 4 && /^[A-Za-z]{4}$/.test(lastPart)) {
        if (elements.roomCodeInput) {
            elements.roomCodeInput.value = lastPart.toUpperCase();
        }
    }

    // Initialize UI elements first (no socket dependency)
    buildColorPalette();
    buildSizePalette();
    updateAvatarPreview();
    setupCanvas();

    // Then set up events and socket connection
    setupEventListeners();
    setupSocketConnection();
    setupSocketListeners();

    // Auto-reconnect: if there's a stored session from a previous page load,
    // pre-populate state so the socket connect handler triggers attemptRejoin
    const stored = getStoredSession();
    if (stored && stored.roomCode && stored.playerName) {
        playerState.roomCode = stored.roomCode;
        playerState.playerName = stored.playerName;
        playerState.playerAvatar = stored.playerAvatar;
        playerState.currentPhase = 'reconnecting';

        // Show reconnecting state
        showScreen('disconnected');
        if (elements.disconnectedReason) {
            elements.disconnectedReason.textContent = 'Reconnecting to your game...';
        }
        // Hide the "New Game" button while reconnecting
        if (elements.disconnectNewGameBtn) {
            elements.disconnectNewGameBtn.style.display = 'none';
        }

        // If already connected, attempt rejoin immediately
        if (socket && socket.connected) {
            attemptRejoin();
        }
        // Otherwise, the socket 'connect' handler will trigger attemptRejoin
    }
});

// =============================================================================
// COLOR & SIZE PALETTES
// =============================================================================

const COLORS = [
    { color: '#000000', name: 'Black' },
    { color: '#FF0000', name: 'Red' },
    { color: '#FF69B4', name: 'Pink' },
    { color: '#FF8C00', name: 'Orange' },
    { color: '#FFD700', name: 'Gold' },
    { color: '#00FF00', name: 'Green' },
    { color: '#0000FF', name: 'Blue' },
    { color: '#8B00FF', name: 'Purple' },
    { color: '#8B4513', name: 'Brown' },
    { color: '#FFFFFF', name: 'Eraser' }
];

const SIZES = [
    { size: 3, label: 'S', dotSize: 4 },
    { size: 8, label: 'M', dotSize: 8 },
    { size: 16, label: 'L', dotSize: 14 },
    { size: 28, label: 'XL', dotSize: 20 }
];

function buildColorPalette() {
    const container = elements.colorButtons;
    if (!container) return;
    container.innerHTML = '';

    COLORS.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'color-btn' + (c.name === 'Eraser' ? ' eraser' : '');
        btn.dataset.color = c.color;
        btn.style.background = c.color;
        btn.title = c.name;
        if (i === 0) btn.classList.add('active');
        container.appendChild(btn);
    });
}

function buildSizePalette() {
    const container = elements.sizeButtons;
    if (!container) return;
    container.innerHTML = '';

    SIZES.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'size-btn';
        btn.dataset.size = s.size;
        if (s.size === currentSize) btn.classList.add('active');
        const dot = document.createElement('div');
        dot.className = 'size-dot';
        dot.style.width = s.dotSize + 'px';
        dot.style.height = s.dotSize + 'px';
        btn.appendChild(dot);
        btn.appendChild(document.createTextNode(s.label));
        container.appendChild(btn);
    });
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Join button (no form element in HTML)
    if (elements.joinButton) {
        elements.joinButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleJoinSubmit(e);
        });
    }

    // Room code auto-uppercase
    if (elements.roomCodeInput) {
        elements.roomCodeInput.addEventListener('input', () => {
            elements.roomCodeInput.value = elements.roomCodeInput.value.toUpperCase();
        });
    }

    // Enter key submits join form
    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleJoinSubmit(e);
        }
    };
    if (elements.roomCodeInput) {
        elements.roomCodeInput.addEventListener('keydown', handleEnterKey);
    }
    if (elements.playerNameInput) {
        elements.playerNameInput.addEventListener('keydown', handleEnterKey);
    }

    // Avatar cycling
    if (elements.avatarPrevBtn) {
        elements.avatarPrevBtn.addEventListener('click', () => cycleAvatar(-1));
    }
    if (elements.avatarNextBtn) {
        elements.avatarNextBtn.addEventListener('click', () => cycleAvatar(1));
    }

    // Drawing tools
    if (elements.clearButton) {
        elements.clearButton.addEventListener('click', clearCanvas);
    }
    if (elements.undoButton) {
        elements.undoButton.addEventListener('click', undoStroke);
    }
    if (elements.submitDrawingButton) {
        elements.submitDrawingButton.addEventListener('click', submitDrawing);
    }

    // Color buttons
    if (elements.colorButtons) {
        elements.colorButtons.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-color]');
            if (btn) selectColor(btn);
        });
    }

    // Size buttons
    if (elements.sizeButtons) {
        elements.sizeButtons.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-size]');
            if (btn) selectSize(btn);
        });
    }

    // Fullscreen canvas
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', enterFullscreen);
    }

    // Judge end timer
    if (elements.judgeEndTimerBtn) {
        elements.judgeEndTimerBtn.addEventListener('click', () => {
            elements.judgeEndTimerBtn.disabled = true;
            elements.judgeEndTimerBtn.textContent = 'Ending...';

            // Safety timeout: reset button if no response after 5 seconds
            const safetyTimeout = setTimeout(() => {
                if (elements.judgeEndTimerBtn.textContent === 'Ending...') {
                    elements.judgeEndTimerBtn.disabled = false;
                    elements.judgeEndTimerBtn.textContent = 'End Timer - Start Judging';
                }
            }, 5000);

            socket.emit('judge:endDrawing', (response) => {
                clearTimeout(safetyTimeout);
                if (!response.success) {
                    showNotification(response.error || 'Failed to end drawing');
                    elements.judgeEndTimerBtn.disabled = false;
                    elements.judgeEndTimerBtn.textContent = 'End Timer - Start Judging';
                }
                // Result handled by game:submissionsCollected listener
            });
        });
    }

    // Steal
    if (elements.stealButton) {
        elements.stealButton.addEventListener('click', () => {
            socket.emit('game:getState', (response) => {
                if (response.success) {
                    showStealModal(response.gameState.players);
                }
            });
        });
    }
    if (elements.stealCloseButton) {
        elements.stealCloseButton.addEventListener('click', hideStealModal);
    }

    // Curser controls
    if (elements.playerDrawCurseBtn) {
        elements.playerDrawCurseBtn.addEventListener('click', () => {
            elements.playerDrawCurseBtn.disabled = true;
            elements.playerDrawCurseBtn.textContent = 'Drawing...';
            socket.emit('player:drawCurseCard', (response) => {
                if (!response.success) {
                    showNotification(response.error || 'Failed to draw curse');
                    elements.playerDrawCurseBtn.disabled = false;
                    elements.playerDrawCurseBtn.textContent = 'Draw Curse Card';
                }
            });
        });
    }
    if (elements.playerApplyCurseBtn) {
        elements.playerApplyCurseBtn.addEventListener('click', () => {
            if (curserSelectedTargetIndex === null || !curserDrawnModifier) return;
            elements.playerApplyCurseBtn.disabled = true;
            socket.emit('player:applyCurse', { targetIndex: curserSelectedTargetIndex, modifier: curserDrawnModifier }, (response) => {
                if (!response.success) {
                    showNotification(response.error || 'Failed to apply curse');
                    elements.playerApplyCurseBtn.disabled = false;
                }
            });
        });
    }
    if (elements.playerHoldCurseBtn) {
        elements.playerHoldCurseBtn.addEventListener('click', () => {
            if (!curserDrawnModifier) return;
            elements.playerHoldCurseBtn.disabled = true;
            socket.emit('player:holdCurse', curserDrawnModifier, (response) => {
                if (!response.success) {
                    showNotification(response.error || 'Failed to hold curse');
                    elements.playerHoldCurseBtn.disabled = false;
                }
            });
        });
    }
    if (elements.playerSkipCurseBtn) {
        elements.playerSkipCurseBtn.addEventListener('click', () => {
            socket.emit('player:skipCurse', (response) => {
                if (!response.success) {
                    showNotification(response.error || 'Failed to skip');
                }
            });
        });
    }

    // Rejoin
    if (elements.rejoinButton) {
        elements.rejoinButton.addEventListener('click', attemptRejoin);
    }

    // New game buttons
    if (elements.newGameBtn) {
        elements.newGameBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
    if (elements.disconnectNewGameBtn) {
        elements.disconnectNewGameBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Handle window resize for canvas
    window.addEventListener('resize', () => {
        if (canvas && playerState.currentPhase === 'drawing') {
            resizeCanvas();
        }
    });
}

// =============================================================================
// SOCKET CONNECTION
// =============================================================================

function setupSocketConnection() {
    try {
        socket = io({
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });
    } catch (err) {
        console.error('Failed to initialize Socket.IO:', err);
        showJoinError('Failed to connect to server. Please refresh the page.');
    }
}

function setupSocketListeners() {
    // ---- Connection events ----

    socket.on('connect', () => {
        playerState.connected = true;
        if (disconnectTimer) {
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
        }

        // If we were in a game, attempt rejoin
        const shouldRejoin = playerState.roomCode && playerState.playerName && playerState.currentPhase !== 'join';
        if (shouldRejoin) {
            attemptRejoin();
        } else if (playerState.pendingAvatarSync) {
            syncAvatarSelection(playerState.pendingAvatarSync);
        }
    });

    socket.on('disconnect', () => {
        playerState.connected = false;

        disconnectTimer = setTimeout(() => {
            if (!playerState.connected && playerState.currentPhase !== 'join') {
                showScreen('disconnected');
                if (elements.disconnectedReason) {
                    elements.disconnectedReason.textContent = 'Lost connection to the server. Attempting to reconnect...';
                }
            }
        }, RECONNECT_DELAY_MS);
    });

    socket.on('connect_error', () => {
        playerState.connected = false;
    });

    // ---- Room events ----

    socket.on('room:playerJoined', (data) => {
        updateLobbyPlayerList(data.players);
        if (data.player && data.player.id !== playerState.playerId) {
            showNotification(`${data.player.name} joined!`);
        }
    });

    socket.on('room:playerUpdated', (data) => {
        updateLobbyPlayerList(data.players);
    });

    socket.on('room:playerLeft', (data) => {
        updateLobbyPlayerList(data.players);
    });

    socket.on('room:playerDisconnected', (data) => {
        updateLobbyPlayerList(data.players);
    });

    socket.on('room:playerReconnected', (data) => {
        // Only notify other players, not the reconnecting player themselves
        if (data.playerId !== playerState.playerId) {
            showNotification(`${data.playerName} reconnected!`);
        }
    });

    socket.on('room:closed', (data) => {
        showScreen('disconnected');
        if (elements.disconnectedReason) {
            elements.disconnectedReason.textContent = data.reason || 'The room has been closed.';
        }
        clearLocalStorage();
    });

    socket.on('player:kicked', (data) => {
        showScreen('disconnected');
        if (elements.disconnectedReason) {
            elements.disconnectedReason.textContent = data.reason || 'You have been removed from the game.';
        }
        clearLocalStorage();
    });

    // ---- Game events ----

    socket.on('game:started', (gameState) => {
        handleGameState(gameState);
        showNotification('Game started!');
        // Show judge info
        if (gameState.judge) {
            updateJudgeDisplay(gameState.judge);
        }
    });

    socket.on('game:alignmentRolled', (data) => {
        // Store alignment info
        playerState.currentAlignment = data.alignment;
        playerState.currentAlignmentFullName = data.fullName;

        if (playerState.isJudge) {
            updateWaitingMessage(`Alignment rolled: ${data.fullName}`);
            // If judge's choice, show the choice grid
            if (data.isJudgeChoice) {
                showJudgeChoiceGrid();
            } else {
                // Alignment determined, show draw prompts button
                hideJudgeControls();
                showJudgeDrawPrompts();
            }
        } else {
            // Delay showing the result to match the host dice animation (adds suspense)
            updateWaitingMessage('Rolling alignment...');
            setTimeout(() => {
                updateWaitingMessage(`Alignment: ${data.fullName}`);
            }, 2800);
        }
    });

    socket.on('game:judgeAlignmentSelected', (data) => {
        playerState.currentAlignment = data.alignment;
        playerState.currentAlignmentFullName = data.fullName;
        updateWaitingMessage(`Judge chose: ${data.fullName}`);
        if (playerState.isJudge) {
            hideJudgeControls();
            showJudgeDrawPrompts();
        }
    });

    socket.on('game:promptsDrawn', (data) => {
        if (playerState.isJudge) {
            showJudgePromptCards(data.prompts);
        } else {
            updateWaitingMessage('The judge is choosing a prompt...');
        }
    });

    socket.on('game:promptSelected', (data) => {
        playerState.currentPrompt = data.prompt;
        playerState.currentAlignment = data.alignment;
        playerState.currentAlignmentFullName = data.alignmentFullName;
    });

    socket.on('game:startDrawing', (data) => {
        if (playerState.isJudge) {
            showScreen('waiting');
            updateWaitingMessage('Players are drawing... Sit tight, Judge!');
            hideJudgeControls();
            // Show the end timer section for the judge to track submissions
            if (elements.judgeEndTimerSection) {
                elements.judgeEndTimerSection.style.display = '';
            }
            if (elements.judgeEndTimerBtn) {
                elements.judgeEndTimerBtn.style.display = 'none';
                elements.judgeEndTimerBtn.disabled = false;
                elements.judgeEndTimerBtn.textContent = 'End Timer - Start Judging';
            }
            if (elements.judgeSubmissionStatus) {
                elements.judgeSubmissionStatus.textContent = '0 drawings received...';
            }
            return;
        }

        // Set up drawing screen
        playerState.hasSubmitted = false;
        playerState.currentPrompt = data.prompt;
        playerState.currentAlignment = data.alignment;
        playerState.currentAlignmentFullName = data.alignmentFullName;
        playerState.timerDuration = data.timeLimit;

        showScreen('drawing');

        if (elements.drawingPrompt) {
            elements.drawingPrompt.textContent = data.prompt;
        }
        if (elements.drawingAlignment) {
            elements.drawingAlignment.textContent = data.alignmentFullName || data.alignment;
        }

        // Show active modifiers
        displayActiveModifiers();

        // Reset canvas for new round
        clearCanvas();
        resizeCanvas();

        // Enable submit button
        if (elements.submitDrawingButton) {
            elements.submitDrawingButton.disabled = false;
            elements.submitDrawingButton.textContent = 'Submit Drawing';
        }

        // Reset timer display
        if (elements.drawingTimer) {
            elements.drawingTimer.textContent = data.timeLimit > 0 ? formatTime(data.timeLimit) : '';
        }
        if (elements.drawingTimerBar) {
            elements.drawingTimerBar.style.width = '100%';
            elements.drawingTimerBar.classList.remove('warning');
        }

        // Auto-enter fullscreen for a better drawing experience
        setTimeout(() => enterFullscreen(), 150);
    });

    socket.on('game:timerStarted', (data) => {
        playerState.timerDuration = data.duration;
        if (elements.drawingTimer) {
            elements.drawingTimer.textContent = formatTime(data.duration);
        }
        if (elements.drawingTimerBar) {
            elements.drawingTimerBar.style.width = '100%';
            elements.drawingTimerBar.classList.remove('warning');
        }
    });

    socket.on('game:timerTick', (data) => {
        const timeLeft = data.timeLeft;
        const duration = playerState.timerDuration || 90;
        const percentage = (timeLeft / duration) * 100;

        if (elements.drawingTimer) {
            elements.drawingTimer.textContent = formatTime(timeLeft);
        }
        if (elements.drawingTimerBar) {
            elements.drawingTimerBar.style.width = percentage + '%';
            if (timeLeft <= 10) {
                elements.drawingTimerBar.classList.add('warning');
            }
        }
    });

    socket.on('game:timerEnd', () => {
        if (elements.drawingTimer) {
            elements.drawingTimer.textContent = "TIME'S UP!";
        }
        if (elements.drawingTimerBar) {
            elements.drawingTimerBar.style.width = '0%';
        }

        // Exit fullscreen canvas if open
        if (isFullscreen) exitFullscreen();

        // Auto-submit if player hasn't submitted yet
        if (!playerState.hasSubmitted && !playerState.isJudge && playerState.currentPhase === 'drawing') {
            submitDrawing();
        }
    });

    socket.on('game:submissionReceived', (data) => {
        if (playerState.isJudge) {
            const count = data.submissionCount;
            const total = data.totalExpected || 0;
            updateWaitingMessage(`Received ${count}${total ? ' / ' + total : ''} drawing(s)...`);

            // Update judge end timer section
            if (elements.judgeSubmissionStatus) {
                elements.judgeSubmissionStatus.textContent = `${count}${total ? ' / ' + total : ''} drawings received`;
            }

            // Show end timer button when all players have submitted
            if (total > 0 && count >= total && elements.judgeEndTimerBtn) {
                elements.judgeEndTimerBtn.style.display = '';
            }
        }
    });

    socket.on('game:submissionsCollected', (data) => {
        if (isFullscreen) exitFullscreen();
        // Hide judge end timer section
        if (elements.judgeEndTimerSection) elements.judgeEndTimerSection.style.display = 'none';

        showScreen('judging');
        playerState.currentPhase = 'judging';

        if (playerState.isJudge && data && data.submissions) {
            // Judge sees the submissions and can pick a winner
            if (elements.judgingTitle) elements.judgingTitle.textContent = 'Pick the Winner!';
            if (elements.judgingWaitState) elements.judgingWaitState.style.display = 'none';
            renderJudgeSubmissions(data.submissions);
        } else {
            // Non-judge waits
            if (elements.judgingTitle) elements.judgingTitle.textContent = 'The Judge is Deciding...';
            if (elements.judgingWaitState) elements.judgingWaitState.style.display = '';
            if (elements.judgeSubmissionsGallery) elements.judgeSubmissionsGallery.style.display = 'none';
        }
    });

    socket.on('game:winnerSelected', (data) => {
        // Update local score from scores array
        const myScore = data.scores.find(s => s.id === playerState.playerId);
        if (myScore) {
            playerState.score = myScore.score;
            playerState.tokens = { ...myScore.tokens };
        }

        // If game is over, the game:over event will handle display
        if (data.gameOver) return;

        showScreen('results');

        const isWinner = data.winnerId === playerState.playerId;

        if (elements.resultsWinner) {
            if (isWinner) {
                elements.resultsWinner.textContent = 'You won this round!';
                elements.resultsWinner.classList.add('winner');
            } else {
                elements.resultsWinner.textContent = `${data.winnerName} won this round!`;
                elements.resultsWinner.classList.remove('winner');
            }
        }

        if (elements.resultsScore) {
            elements.resultsScore.textContent = `Your Score: ${playerState.score}`;
        }

        updateTokenDisplay();

        // Steal is only available when you become judge (see game:newRound)
        if (elements.stealBtnContainer) {
            elements.stealBtnContainer.style.display = 'none';
        }

    });

    socket.on('game:tokenAwarded', (data) => {
        // Update local token count from the players data
        const me = data.players.find(p => p.id === playerState.playerId);
        if (me) {
            playerState.tokens = { ...me.tokens };
            updateTokenDisplay();
        }

        if (data.playerId === playerState.playerId) {
            const tokenNames = {
                mindReader: 'Mind Reader',
                technicalMerit: 'Technical Merit',
                perfectAlignment: 'Perfect Alignment',
                plotTwist: 'Plot Twist'
            };
            showNotification(`You earned a ${tokenNames[data.tokenType] || data.tokenType} token!`);
        }
    });

    socket.on('game:newRound', (data) => {
        const gameState = data.gameState;

        // Reset round state
        playerState.hasSubmitted = false;
        playerState.currentPrompt = null;
        playerState.currentAlignment = null;
        playerState.currentAlignmentFullName = null;

        // Update judge status
        const me = gameState.players.find(p => p.id === playerState.playerId);
        if (me) {
            playerState.isJudge = me.isJudge;
            playerState.score = me.score;
            playerState.tokens = { ...me.tokens };
            playerState.activeModifiers = me.activeModifiers || [];
        }

        showScreen('waiting');

        // Show judge info
        const judge = data.judge;
        updateJudgeDisplay(judge);

        // Hide curser controls from previous phase
        hideCurserControls();

        if (playerState.isJudge) {
            updateWaitingMessage(`Round ${data.round} - You are the Judge!`);
            updateWaitingRole('judge');
            showJudgeRollButton();

            // Steal is available when you become judge
            const totalTokens = getTotalTokens();
            if (elements.stealBtnContainer) {
                elements.stealBtnContainer.style.display = totalTokens >= TOKENS_REQUIRED_TO_STEAL ? '' : 'none';
            }
        } else {
            const judgeName = judge ? judge.name : 'Someone';
            updateWaitingMessage(`Round ${data.round} - ${judgeName} is judging`);
            updateWaitingRole('player');
            hideJudgeControls();
            if (elements.stealBtnContainer) {
                elements.stealBtnContainer.style.display = 'none';
            }
        }
    });

    socket.on('game:stealExecuted', (data) => {
        // Update scores
        const myScore = data.scores.find(s => s.id === playerState.playerId);
        if (myScore) {
            playerState.score = myScore.score;
            playerState.tokens = { ...myScore.tokens };
            updateTokenDisplay();
        }

        if (data.stealerId === playerState.playerId) {
            showNotification(`You stole a point from ${data.targetName}!`);
        } else if (data.targetId === playerState.playerId) {
            showNotification(`${data.stealerName} stole a point from you!`);
        } else {
            showNotification(`${data.stealerName} stole a point from ${data.targetName}!`);
        }

    });

    socket.on('game:over', (data) => {
        showScreen('gameover');
        spawnConfetti(35);

        const winner = data.winner;
        const finalScores = data.finalScores;

        if (elements.gameoverWinner) {
            if (winner.id === playerState.playerId) {
                elements.gameoverWinner.textContent = 'You win the game!';
                elements.gameoverWinner.classList.add('winner');
            } else {
                elements.gameoverWinner.innerHTML = `${renderAvatarHtml(winner.avatar || DEFAULT_AVATAR, `${winner.name} avatar`)} ${escapeHtml(winner.name)} wins the game!`;
                elements.gameoverWinner.classList.remove('winner');
            }
        }

        // Calculate rank
        if (elements.gameoverRank && finalScores) {
            const sorted = [...finalScores].sort((a, b) => b.score - a.score);
            const myRank = sorted.findIndex(s => s.id === playerState.playerId) + 1;
            const totalPlayers = sorted.length;
            const ordinal = getOrdinal(myRank);
            elements.gameoverRank.textContent = `You finished ${ordinal} out of ${totalPlayers} players`;
        }

        // Show final scores
        if (elements.gameoverScores && finalScores) {
            const sorted = [...finalScores].sort((a, b) => b.score - a.score);
            elements.gameoverScores.innerHTML = sorted.map((s, i) => {
                const isMe = s.id === playerState.playerId;
                const rankClass = i === 0 ? 'first' : '';
                const meClass = isMe ? 'is-me' : '';
                return `<div class="score-row ${rankClass} ${meClass}">
                    <span class="score-rank">${getOrdinal(i + 1)}</span>
                    <span class="score-avatar">${renderAvatarHtml(s.avatar || DEFAULT_AVATAR, `${s.name} avatar`)}</span>
                    <span class="score-name">${escapeHtml(s.name)}</span>
                    <span class="score-value">${s.score}</span>
                </div>`;
            }).join('');
        }

        clearLocalStorage();
    });

    // ---- Modifier events ----

    socket.on('game:modifierPhase', (data) => {
        const gameState = data.gameState;

        // Update active modifiers from game state
        const me = gameState.players.find(p => p.id === playerState.playerId);
        if (me) {
            playerState.activeModifiers = me.activeModifiers || [];
            playerState.heldCurse = me.heldCurse || null;
        }

        showScreen('waiting');

        if (data.curser && data.curser.id === playerState.playerId) {
            updateWaitingMessage('You lost the round — time for revenge!');
            showCurserControls(data);
        } else {
            const curserName = data.curser ? data.curser.name : 'Someone';
            updateWaitingMessage(`${curserName} is choosing a curse...`);
            hideCurserControls();
        }

        showNotification(`Curse phase! ${data.curser ? data.curser.name : 'A player'} is cursing someone!`);
    });

    socket.on('game:curseCardDrawn', (data) => {
        if (data.modifier) {
            showNotification(`Curse drawn: ${data.modifier.icon || ''} ${data.modifier.name} — ${data.modifier.description}`);
            // If we are the curser, update our curse card display
            if (playerState.isCurser) {
                showPlayerCurseCard(data.modifier);
            }
        }
    });

    socket.on('game:curseApplied', (data) => {
        const gameState = data.gameState;

        // Update active modifiers from game state
        const me = gameState.players.find(p => p.id === playerState.playerId);
        if (me) {
            playerState.activeModifiers = me.activeModifiers || [];
            playerState.heldCurse = me.heldCurse || null;
        }

        if (me && me.activeModifiers && me.activeModifiers.length > 0) {
            const latestMod = me.activeModifiers[me.activeModifiers.length - 1];
            showNotification(`You were cursed! ${latestMod.icon || ''} ${latestMod.name}: ${latestMod.description}`);
        } else {
            showNotification(`${data.targetName} was cursed with ${data.modifier.icon || ''} ${data.modifier.name} — ${data.modifier.description}`);
        }
    });

    socket.on('game:curseHeld', (data) => {
        const gameState = data.gameState;
        const me = gameState.players.find(p => p.id === playerState.playerId);
        if (me) {
            playerState.heldCurse = me.heldCurse || null;
        }
    });
}

// =============================================================================
// AVATAR SELECTION
// =============================================================================

function fetchUsedAvatars(roomCode) {
    fetch(`/api/room/${roomCode}`)
        .then(r => r.json())
        .then(data => {
            if (data.exists && data.usedAvatars) {
                usedAvatars = data.usedAvatars;
                // If current avatar is taken, auto-skip to next available
                if (usedAvatars.includes(AVATARS[currentAvatarIndex])) {
                    cycleAvatar(1);
                } else {
                    updateAvatarPreview();
                }
            }
        })
        .catch(() => { /* ignore fetch errors */ });
}

function isAvatarImagePath(avatar) {
    return typeof avatar === 'string' && avatar.startsWith('/assets/images/avatars/');
}

function renderAvatarHtml(avatar, altText) {
    if (isAvatarImagePath(avatar)) {
        return `<span class="avatar-wrap"><img class="avatar-img" src="${escapeHtml(avatar)}" alt="${escapeHtml(altText || 'Avatar')}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';" /><span class="avatar-fallback-badge" style="display:none;">${DEFAULT_AVATAR_FALLBACK}</span></span>`;
    }
    return escapeHtml(avatar || DEFAULT_AVATAR_FALLBACK);
}

function syncAvatarSelection(avatar, onFailure) {
    if (!avatar || !socket || !socket.connected || !playerState.roomCode) return;
    socket.emit('player:selectAvatar', { avatar }, (response) => {
        if (response && response.success) {
            playerState.playerAvatar = avatar;
            playerState.pendingAvatarSync = null;
            saveToLocalStorage();
            fetchUsedAvatars(playerState.roomCode);
        } else if (typeof onFailure === 'function') {
            onFailure(response);
        }
    });
}

function cycleAvatar(direction) {
    const startIndex = currentAvatarIndex;
    const previousAvatar = AVATARS[startIndex];
    let attempts = 0;
    do {
        currentAvatarIndex = (currentAvatarIndex + direction + AVATARS.length) % AVATARS.length;
        attempts++;
    } while (usedAvatars.includes(AVATARS[currentAvatarIndex]) && AVATARS[currentAvatarIndex] !== playerState.playerAvatar && attempts < AVATARS.length);
    updateAvatarPreview();

    const newAvatar = AVATARS[currentAvatarIndex];
    playerState.playerAvatar = newAvatar;
    saveToLocalStorage();

    // In lobby, sync immediately when online, otherwise queue for reconnect.
    if (playerState.roomCode) {
        if (socket && socket.connected) {
            syncAvatarSelection(newAvatar, (response) => {
                currentAvatarIndex = AVATARS.indexOf(previousAvatar);
                if (currentAvatarIndex < 0) currentAvatarIndex = 0;
                playerState.playerAvatar = AVATARS[currentAvatarIndex];
                playerState.pendingAvatarSync = null;
                saveToLocalStorage();
                updateAvatarPreview();
                if (response && response.error) {
                    showNotification(response.error);
                }
            });
        } else {
            playerState.pendingAvatarSync = newAvatar;
            saveToLocalStorage();
        }
    }
}

function updateAvatarPreview() {
    if (elements.avatarPreview) {
        const avatar = AVATARS[currentAvatarIndex];
        const isTaken = usedAvatars.includes(avatar);
        elements.avatarPreview.innerHTML = renderAvatarHtml(avatar, 'Selected avatar');
        elements.avatarPreview.style.opacity = isTaken ? '0.3' : '1';
    }
}

// =============================================================================
// JOIN FLOW
// =============================================================================

function handleJoinSubmit(e) {
    if (e) e.preventDefault();

    const roomCode = (elements.roomCodeInput ? elements.roomCodeInput.value.trim().toUpperCase() : '');
    const playerName = (elements.playerNameInput ? elements.playerNameInput.value.trim() : '');

    // Validation
    if (!roomCode || roomCode.length !== 4) {
        showJoinError('Please enter a 4-character room code.');
        return;
    }

    if (!playerName || playerName.length < 1) {
        showJoinError('Please enter your name.');
        return;
    }

    if (playerName.length > 20) {
        showJoinError('Name must be 20 characters or less.');
        return;
    }

    // Check socket connection
    if (!socket || !socket.connected) {
        showJoinError('Connecting to server... Please try again in a moment.');
        return;
    }

    // Clear previous error
    showJoinError('');

    // Disable join button
    if (elements.joinButton) {
        elements.joinButton.disabled = true;
        elements.joinButton.textContent = 'Joining...';
    }

    // Join without avatar - server assigns default, player picks in lobby
    socket.emit('player:joinRoom', { roomCode, playerName, avatar: null }, (response) => {
        if (response.success) {
            // Save state
            playerState.playerId = response.playerId;
            playerState.playerName = playerName;
            playerState.roomCode = roomCode;
            playerState.reconnectToken = response.reconnectToken || null;

            // Get the avatar assigned by the server
            if (response.gameState && response.gameState.players) {
                const me = response.gameState.players.find(p => p.id === playerState.playerId);
                if (me) {
                    playerState.playerAvatar = me.avatar;
                    // Set the avatar index to match the server-assigned avatar
                    const idx = AVATARS.indexOf(me.avatar);
                    if (idx !== -1) currentAvatarIndex = idx;
                }
            }

            // Save to localStorage for reconnection
            saveToLocalStorage();

            // Fetch used avatars for the lobby avatar selector
            fetchUsedAvatars(roomCode);

            // Check if game is already in progress (late join after reconnect scenario)
            if (response.gameState && response.gameState.gameStarted) {
                handleGameState(response.gameState);
            } else {
                // Show lobby
                showScreen('lobby');
                if (elements.lobbyRoomCode) {
                    elements.lobbyRoomCode.textContent = roomCode;
                }
                if (response.gameState && response.gameState.players) {
                    updateLobbyPlayerList(response.gameState.players);
                }
                // Update avatar display in lobby
                updateAvatarPreview();
            }
        } else {
            showJoinError(response.error || 'Failed to join room.');
        }

        // Re-enable join button
        if (elements.joinButton) {
            elements.joinButton.disabled = false;
            elements.joinButton.textContent = 'Join Game';
        }
    });
}

function showJoinError(message) {
    if (elements.joinError) {
        elements.joinError.textContent = message;
        elements.joinError.style.display = message ? 'block' : 'none';
    }
}

// =============================================================================
// LOBBY
// =============================================================================

function updateLobbyPlayerList(players) {
    if (!elements.lobbyPlayerList) return;

    elements.lobbyPlayerList.innerHTML = players.map(p => {
        const isMe = p.id === playerState.playerId;
        const disconnectedClass = p.connected === false ? 'disconnected' : '';
        const meClass = isMe ? 'is-me' : '';
        return `<div class="lobby-player ${disconnectedClass} ${meClass}">
            <span class="lobby-player-avatar">${renderAvatarHtml(p.avatar || DEFAULT_AVATAR, `${p.name} avatar`)}</span>
            <span class="lobby-player-name">${escapeHtml(p.name)}${isMe ? ' (you)' : ''}</span>
            ${p.connected === false ? '<span class="lobby-player-status">disconnected</span>' : ''}
        </div>`;
    }).join('');

    if (elements.lobbyWaiting) {
        elements.lobbyWaiting.textContent = `${players.length} player(s) in lobby - Waiting for host to start...`;
    }
}

// =============================================================================
// CANVAS SETUP AND DRAWING
// =============================================================================

function setupCanvas() {
    canvas = elements.drawingCanvas || document.getElementById('drawing-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');

    // Touch events (passive: false to prevent scrolling while drawing)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Mouse events (for desktop testing)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', handleMouseUp);

    resizeCanvas();
}

function resizeCanvas() {
    if (!canvas || !ctx) return;

    // Use fixed internal resolution to prevent stretching across devices
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes from history
    redrawFromHistory();
}

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// ---- Touch Handlers ----

function handleTouchStart(e) {
    e.preventDefault();
    if (playerState.hasSubmitted) return;

    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;

    currentPath = [{
        fromX: coords.x,
        fromY: coords.y,
        toX: coords.x,
        toY: coords.y,
        color: currentColor,
        size: currentSize
    }];

    // Draw a dot for single tap
    draw(coords.x, coords.y, coords.x, coords.y);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing || playerState.hasSubmitted) return;

    const coords = getCanvasCoordinates(e);
    draw(lastX, lastY, coords.x, coords.y);

    currentPath.push({
        fromX: lastX,
        fromY: lastY,
        toX: coords.x,
        toY: coords.y,
        color: currentColor,
        size: currentSize
    });

    lastX = coords.x;
    lastY = coords.y;
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!isDrawing) return;

    isDrawing = false;

    if (currentPath.length > 0) {
        drawingHistory.push([...currentPath]);
        currentPath = [];
    }
}

// ---- Mouse Handlers ----

function handleMouseDown(e) {
    if (playerState.hasSubmitted) return;

    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;

    currentPath = [{
        fromX: coords.x,
        fromY: coords.y,
        toX: coords.x,
        toY: coords.y,
        color: currentColor,
        size: currentSize
    }];

    draw(coords.x, coords.y, coords.x, coords.y);
}

function handleMouseMove(e) {
    if (!isDrawing || playerState.hasSubmitted) return;

    const coords = getCanvasCoordinates(e);
    draw(lastX, lastY, coords.x, coords.y);

    currentPath.push({
        fromX: lastX,
        fromY: lastY,
        toX: coords.x,
        toY: coords.y,
        color: currentColor,
        size: currentSize
    });

    lastX = coords.x;
    lastY = coords.y;
}

function handleMouseUp() {
    if (!isDrawing) return;

    isDrawing = false;

    if (currentPath.length > 0) {
        drawingHistory.push([...currentPath]);
        currentPath = [];
    }
}

// ---- Drawing Functions ----

function draw(fromX, fromY, toX, toY) {
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function redrawFromHistory() {
    if (!ctx || !canvas) return;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Replay every stroke
    for (const path of drawingHistory) {
        for (const segment of path) {
            ctx.beginPath();
            ctx.moveTo(segment.fromX, segment.fromY);
            ctx.lineTo(segment.toX, segment.toY);
            ctx.strokeStyle = segment.color;
            ctx.lineWidth = segment.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    }
}

// ---- Tool Selection ----

function selectColor(btn) {
    const color = btn.dataset.color;
    if (!color) return;

    currentColor = color;

    // Toggle active class
    if (elements.colorButtons) {
        const buttons = elements.colorButtons.querySelectorAll('[data-color]');
        buttons.forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
}

function selectSize(btn) {
    const size = parseInt(btn.dataset.size, 10);
    if (isNaN(size)) return;

    currentSize = size;

    // Toggle active class
    if (elements.sizeButtons) {
        const buttons = elements.sizeButtons.querySelectorAll('[data-size]');
        buttons.forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
}

function clearCanvas() {
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
    currentPath = [];
}

function undoStroke() {
    if (drawingHistory.length === 0) return;

    drawingHistory.pop();
    redrawFromHistory();
}

// =============================================================================
// FULLSCREEN CANVAS MODE
// =============================================================================

let isFullscreen = false;
let fullscreenCanvas = null;
let fullscreenCtx = null;
let toolbarDragging = false;
let toolbarOffsetX = 0;
let toolbarOffsetY = 0;
// Store references to document-level drag listeners for cleanup
let _toolbarDragMove = null;
let _toolbarDragEnd = null;

function enterFullscreen() {
    if (isFullscreen || playerState.hasSubmitted) return;
    isFullscreen = true;

    const overlay = document.getElementById('fullscreen-canvas-overlay');
    const toolbar = document.getElementById('floating-toolbar');
    fullscreenCanvas = document.getElementById('fullscreen-canvas');

    if (!overlay || !fullscreenCanvas || !toolbar) return;

    fullscreenCtx = fullscreenCanvas.getContext('2d');

    // Show overlay
    overlay.classList.add('active');
    toolbar.style.display = '';

    // Size the fullscreen canvas to fit viewport while maintaining 9:16 ratio
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

    let fsW, fsH;
    if (viewW / viewH < targetRatio) {
        fsW = viewW;
        fsH = viewW / targetRatio;
    } else {
        fsH = viewH;
        fsW = viewH * targetRatio;
    }

    fullscreenCanvas.width = Math.round(fsW);
    fullscreenCanvas.height = Math.round(fsH);

    // Center the canvas in the overlay
    fullscreenCanvas.style.width = Math.round(fsW) + 'px';
    fullscreenCanvas.style.height = Math.round(fsH) + 'px';
    fullscreenCanvas.style.position = 'absolute';
    fullscreenCanvas.style.top = Math.round((viewH - fsH) / 2) + 'px';
    fullscreenCanvas.style.left = Math.round((viewW - fsW) / 2) + 'px';

    // Copy existing drawing to fullscreen canvas
    fullscreenCtx.fillStyle = '#FFFFFF';
    fullscreenCtx.fillRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);

    // Scale and replay strokes (uniform scale since aspect ratios match)
    const scaleX = fullscreenCanvas.width / (canvas.width || 1);
    const scaleY = fullscreenCanvas.height / (canvas.height || 1);

    for (const path of drawingHistory) {
        for (const seg of path) {
            fullscreenCtx.beginPath();
            fullscreenCtx.moveTo(seg.fromX * scaleX, seg.fromY * scaleY);
            fullscreenCtx.lineTo(seg.toX * scaleX, seg.toY * scaleY);
            fullscreenCtx.strokeStyle = seg.color;
            fullscreenCtx.lineWidth = seg.size * Math.min(scaleX, scaleY);
            fullscreenCtx.lineCap = 'round';
            fullscreenCtx.lineJoin = 'round';
            fullscreenCtx.stroke();
        }
    }

    // Build toolbar palettes
    buildFullscreenPalettes();

    // Setup drawing on fullscreen canvas
    fullscreenCanvas.addEventListener('touchstart', fsHandleTouchStart, { passive: false });
    fullscreenCanvas.addEventListener('touchmove', fsHandleTouchMove, { passive: false });
    fullscreenCanvas.addEventListener('touchend', fsHandleTouchEnd, { passive: false });
    fullscreenCanvas.addEventListener('touchcancel', fsHandleTouchEnd, { passive: false });
    fullscreenCanvas.addEventListener('mousedown', fsHandleMouseDown);
    fullscreenCanvas.addEventListener('mousemove', fsHandleMouseMove);
    fullscreenCanvas.addEventListener('mouseup', fsHandleMouseUp);
    fullscreenCanvas.addEventListener('mouseout', fsHandleMouseUp);

    // Setup toolbar dragging
    setupToolbarDrag();

    // Position toolbar at bottom center
    toolbar.style.bottom = '20px';
    toolbar.style.left = '50%';
    toolbar.style.transform = 'translateX(-50%)';
    toolbar.style.top = '';
    toolbar.style.right = '';
}

function exitFullscreen() {
    if (!isFullscreen) return;
    isFullscreen = false;

    const overlay = document.getElementById('fullscreen-canvas-overlay');
    const toolbar = document.getElementById('floating-toolbar');

    if (overlay) overlay.classList.remove('active');
    if (toolbar) toolbar.style.display = 'none';

    // Copy fullscreen drawing back to main canvas
    if (fullscreenCanvas && canvas && ctx) {
        // Rebuild history scaled back to main canvas coordinates
        const scaleX = fullscreenCanvas.width / (canvas.width || 1);
        const scaleY = fullscreenCanvas.height / (canvas.height || 1);

        // Update history to scale back
        const scaledHistory = drawingHistory.map(path =>
            path.map(seg => ({
                fromX: seg.fromX,
                fromY: seg.fromY,
                toX: seg.toX,
                toY: seg.toY,
                color: seg.color,
                size: seg.size
            }))
        );
        drawingHistory = scaledHistory;
        redrawFromHistory();
    }

    // Remove fullscreen canvas listeners
    if (fullscreenCanvas) {
        fullscreenCanvas.removeEventListener('touchstart', fsHandleTouchStart);
        fullscreenCanvas.removeEventListener('touchmove', fsHandleTouchMove);
        fullscreenCanvas.removeEventListener('touchend', fsHandleTouchEnd);
        fullscreenCanvas.removeEventListener('touchcancel', fsHandleTouchEnd);
        fullscreenCanvas.removeEventListener('mousedown', fsHandleMouseDown);
        fullscreenCanvas.removeEventListener('mousemove', fsHandleMouseMove);
        fullscreenCanvas.removeEventListener('mouseup', fsHandleMouseUp);
        fullscreenCanvas.removeEventListener('mouseout', fsHandleMouseUp);
    }

    // Remove document-level toolbar drag listeners
    if (_toolbarDragMove) {
        document.removeEventListener('touchmove', _toolbarDragMove);
        document.removeEventListener('mousemove', _toolbarDragMove);
        _toolbarDragMove = null;
    }
    if (_toolbarDragEnd) {
        document.removeEventListener('touchend', _toolbarDragEnd);
        document.removeEventListener('mouseup', _toolbarDragEnd);
        _toolbarDragEnd = null;
    }

    fullscreenCanvas = null;
    fullscreenCtx = null;
}

// Fullscreen canvas event handlers (mirror the main canvas handlers but use fullscreen coords)
function fsGetCoords(e) {
    const rect = fullscreenCanvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    const scaleX = fullscreenCanvas.width / rect.width;
    const scaleY = fullscreenCanvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// We need to store fullscreen-specific coords but save back to main canvas coords
let fsLastX = 0, fsLastY = 0, fsCurrentPath = [];

function fsHandleTouchStart(e) {
    e.preventDefault();
    if (playerState.hasSubmitted) return;
    isDrawing = true;
    const coords = fsGetCoords(e);
    fsLastX = coords.x;
    fsLastY = coords.y;

    // Store in main canvas coordinate space
    const sx = (canvas.width || 1) / fullscreenCanvas.width;
    const sy = (canvas.height || 1) / fullscreenCanvas.height;

    fsCurrentPath = [{
        fromX: coords.x * sx, fromY: coords.y * sy,
        toX: coords.x * sx, toY: coords.y * sy,
        color: currentColor, size: currentSize
    }];

    // Draw on fullscreen canvas
    fsDraw(coords.x, coords.y, coords.x, coords.y);
}

function fsHandleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing || playerState.hasSubmitted) return;
    const coords = fsGetCoords(e);
    fsDraw(fsLastX, fsLastY, coords.x, coords.y);

    const sx = (canvas.width || 1) / fullscreenCanvas.width;
    const sy = (canvas.height || 1) / fullscreenCanvas.height;

    fsCurrentPath.push({
        fromX: fsLastX * sx, fromY: fsLastY * sy,
        toX: coords.x * sx, toY: coords.y * sy,
        color: currentColor, size: currentSize
    });

    fsLastX = coords.x;
    fsLastY = coords.y;
}

function fsHandleTouchEnd(e) {
    if (e) e.preventDefault();
    if (!isDrawing) return;
    isDrawing = false;
    if (fsCurrentPath.length > 0) {
        drawingHistory.push([...fsCurrentPath]);
        fsCurrentPath = [];
    }
}

function fsHandleMouseDown(e) {
    if (playerState.hasSubmitted) return;
    isDrawing = true;
    const coords = fsGetCoords(e);
    fsLastX = coords.x;
    fsLastY = coords.y;

    const sx = (canvas.width || 1) / fullscreenCanvas.width;
    const sy = (canvas.height || 1) / fullscreenCanvas.height;

    fsCurrentPath = [{
        fromX: coords.x * sx, fromY: coords.y * sy,
        toX: coords.x * sx, toY: coords.y * sy,
        color: currentColor, size: currentSize
    }];

    fsDraw(coords.x, coords.y, coords.x, coords.y);
}

function fsHandleMouseMove(e) {
    if (!isDrawing || playerState.hasSubmitted) return;
    const coords = fsGetCoords(e);
    fsDraw(fsLastX, fsLastY, coords.x, coords.y);

    const sx = (canvas.width || 1) / fullscreenCanvas.width;
    const sy = (canvas.height || 1) / fullscreenCanvas.height;

    fsCurrentPath.push({
        fromX: fsLastX * sx, fromY: fsLastY * sy,
        toX: coords.x * sx, toY: coords.y * sy,
        color: currentColor, size: currentSize
    });

    fsLastX = coords.x;
    fsLastY = coords.y;
}

function fsHandleMouseUp() {
    if (!isDrawing) return;
    isDrawing = false;
    if (fsCurrentPath.length > 0) {
        drawingHistory.push([...fsCurrentPath]);
        fsCurrentPath = [];
    }
}

function fsDraw(fromX, fromY, toX, toY) {
    if (!fullscreenCtx) return;
    const scale = Math.min(
        fullscreenCanvas.width / (canvas.width || 1),
        fullscreenCanvas.height / (canvas.height || 1)
    );
    fullscreenCtx.beginPath();
    fullscreenCtx.moveTo(fromX, fromY);
    fullscreenCtx.lineTo(toX, toY);
    fullscreenCtx.strokeStyle = currentColor;
    fullscreenCtx.lineWidth = currentSize * scale;
    fullscreenCtx.lineCap = 'round';
    fullscreenCtx.lineJoin = 'round';
    fullscreenCtx.stroke();
}

function fsRedraw() {
    if (!fullscreenCtx || !fullscreenCanvas) return;
    fullscreenCtx.fillStyle = '#FFFFFF';
    fullscreenCtx.fillRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);

    const scaleX = fullscreenCanvas.width / (canvas.width || 1);
    const scaleY = fullscreenCanvas.height / (canvas.height || 1);

    for (const path of drawingHistory) {
        for (const seg of path) {
            fullscreenCtx.beginPath();
            fullscreenCtx.moveTo(seg.fromX * scaleX, seg.fromY * scaleY);
            fullscreenCtx.lineTo(seg.toX * scaleX, seg.toY * scaleY);
            fullscreenCtx.strokeStyle = seg.color;
            fullscreenCtx.lineWidth = seg.size * Math.min(scaleX, scaleY);
            fullscreenCtx.lineCap = 'round';
            fullscreenCtx.lineJoin = 'round';
            fullscreenCtx.stroke();
        }
    }
}

function fsUndo() {
    if (drawingHistory.length === 0) return;
    drawingHistory.pop();
    fsRedraw();
}

function fsClear() {
    drawingHistory = [];
    fsCurrentPath = [];
    if (fullscreenCtx && fullscreenCanvas) {
        fullscreenCtx.fillStyle = '#FFFFFF';
        fullscreenCtx.fillRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
    }
}

function buildFullscreenPalettes() {
    const colorRow = document.getElementById('ft-color-row');
    const sizeRow = document.getElementById('ft-size-row');

    if (colorRow) {
        colorRow.innerHTML = '';
        COLORS.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'ft-color-btn' + (c.name === 'Eraser' ? ' eraser' : '');
            btn.dataset.color = c.color;
            btn.style.background = c.color;
            btn.title = c.name;
            if (c.color === currentColor) btn.classList.add('active');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentColor = c.color;
                colorRow.querySelectorAll('.ft-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Sync main palette
                if (elements.colorButtons) {
                    elements.colorButtons.querySelectorAll('[data-color]').forEach(b => {
                        b.classList.toggle('active', b.dataset.color === c.color);
                    });
                }
            });
            colorRow.appendChild(btn);
        });
    }

    if (sizeRow) {
        sizeRow.innerHTML = '';
        SIZES.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'ft-size-btn';
            btn.dataset.size = s.size;
            if (s.size === currentSize) btn.classList.add('active');
            const dot = document.createElement('div');
            dot.className = 'ft-size-dot';
            dot.style.width = (s.dotSize * 0.7) + 'px';
            dot.style.height = (s.dotSize * 0.7) + 'px';
            btn.appendChild(dot);
            btn.appendChild(document.createTextNode(s.label));
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentSize = s.size;
                sizeRow.querySelectorAll('.ft-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Sync main palette
                if (elements.sizeButtons) {
                    elements.sizeButtons.querySelectorAll('[data-size]').forEach(b => {
                        b.classList.toggle('active', parseInt(b.dataset.size, 10) === s.size);
                    });
                }
            });
            sizeRow.appendChild(btn);
        });
    }

    // Toolbar action buttons
    const undoBtn = document.getElementById('ft-undo-btn');
    const clearBtn = document.getElementById('ft-clear-btn');
    const submitBtn = document.getElementById('ft-submit-btn');
    const exitBtn = document.getElementById('ft-exit-btn');

    if (undoBtn) undoBtn.onclick = (e) => { e.stopPropagation(); fsUndo(); };
    if (clearBtn) clearBtn.onclick = (e) => { e.stopPropagation(); fsClear(); };
    if (submitBtn) submitBtn.onclick = (e) => { e.stopPropagation(); exitFullscreen(); submitDrawing(); };
    if (exitBtn) exitBtn.onclick = (e) => { e.stopPropagation(); exitFullscreen(); };
}

function setupToolbarDrag() {
    const toolbar = document.getElementById('floating-toolbar');
    const handle = document.getElementById('toolbar-handle');
    if (!toolbar || !handle) return;

    function onDragStart(e) {
        toolbarDragging = true;
        const rect = toolbar.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        toolbarOffsetX = clientX - rect.left;
        toolbarOffsetY = clientY - rect.top;
        // Switch to absolute positioning
        toolbar.style.left = rect.left + 'px';
        toolbar.style.top = rect.top + 'px';
        toolbar.style.bottom = '';
        toolbar.style.transform = '';
        e.preventDefault();
    }

    function onDragMove(e) {
        if (!toolbarDragging) return;
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        toolbar.style.left = (clientX - toolbarOffsetX) + 'px';
        toolbar.style.top = (clientY - toolbarOffsetY) + 'px';
        e.preventDefault();
    }

    function onDragEnd() {
        toolbarDragging = false;
    }

    // Remove previous document listeners if any (prevents leaks on re-entry)
    if (_toolbarDragMove) {
        document.removeEventListener('touchmove', _toolbarDragMove);
        document.removeEventListener('mousemove', _toolbarDragMove);
    }
    if (_toolbarDragEnd) {
        document.removeEventListener('touchend', _toolbarDragEnd);
        document.removeEventListener('mouseup', _toolbarDragEnd);
    }

    // Store references for cleanup
    _toolbarDragMove = onDragMove;
    _toolbarDragEnd = onDragEnd;

    handle.addEventListener('touchstart', onDragStart, { passive: false });
    handle.addEventListener('mousedown', onDragStart);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchend', onDragEnd);
    document.addEventListener('mouseup', onDragEnd);
}

// =============================================================================
// SUBMIT DRAWING
// =============================================================================

function submitDrawing() {
    if (playerState.hasSubmitted) return;
    if (!canvas) return;

    playerState.hasSubmitted = true;

    // Disable submit button
    if (elements.submitDrawingButton) {
        elements.submitDrawingButton.disabled = true;
        elements.submitDrawingButton.textContent = 'Submitting...';
    }

    const drawingDataURL = canvas.toDataURL('image/png');

    socket.emit('player:submitDrawing', { drawing: drawingDataURL }, (response) => {
        if (response.success) {
            showScreen('submitted');

            // Show preview of submitted drawing
            if (elements.submittedPreview) {
                elements.submittedPreview.src = drawingDataURL;
            }
            if (elements.submittedMessage) {
                elements.submittedMessage.textContent = 'Drawing submitted! Waiting for others...';
            }
        } else {
            // Re-enable submission on failure
            playerState.hasSubmitted = false;
            if (elements.submitDrawingButton) {
                elements.submitDrawingButton.disabled = false;
                elements.submitDrawingButton.textContent = 'Submit Drawing';
            }
            showNotification(response.error || 'Failed to submit drawing.');
        }
    });
}

// =============================================================================
// JUDGE WINNER SELECTION (on player device)
// =============================================================================

function renderJudgeSubmissions(submissions) {
    if (!elements.judgeSubmissionsList || !elements.judgeSubmissionsGallery) return;

    elements.judgeSubmissionsGallery.style.display = '';
    elements.judgeSubmissionsList.innerHTML = '';

    let selectedPlayerId = null;

    submissions.forEach(sub => {
        const card = document.createElement('div');
        card.classList.add('judge-sub-card');
        card.dataset.playerId = sub.playerId;

        card.innerHTML = `
            <img src="${sub.drawing}" alt="Drawing by ${escapeHtml(sub.playerName)}">
            <div class="sub-player-info">
                <span>${renderAvatarHtml(sub.playerAvatar || DEFAULT_AVATAR, `${sub.playerName} avatar`)}</span>
                <span>${escapeHtml(sub.playerName)}</span>
            </div>
            <button class="expand-btn" title="Expand image">&#x1F50D;</button>
        `;

        // Expand button opens lightbox
        const expandBtn = card.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openImageLightbox(sub.drawing, sub.playerName);
            });
        }

        card.addEventListener('click', () => {
            elements.judgeSubmissionsList.querySelectorAll('.judge-sub-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlayerId = sub.playerId;
            if (elements.judgeConfirmWinnerBtn) {
                elements.judgeConfirmWinnerBtn.disabled = false;
                elements.judgeConfirmWinnerBtn.style.display = '';
            }
        });

        elements.judgeSubmissionsList.appendChild(card);
    });

    // Setup confirm button
    if (elements.judgeConfirmWinnerBtn) {
        elements.judgeConfirmWinnerBtn.disabled = true;
        elements.judgeConfirmWinnerBtn.style.display = 'none';
        elements.judgeConfirmWinnerBtn.onclick = () => {
            if (!selectedPlayerId) return;
            elements.judgeConfirmWinnerBtn.disabled = true;
            elements.judgeConfirmWinnerBtn.textContent = 'Confirming...';

            // Disable all cards
            elements.judgeSubmissionsList.querySelectorAll('.judge-sub-card').forEach(c => {
                c.style.pointerEvents = 'none';
            });

            // Safety timeout: if no response after 5 seconds, reset the button
            const safetyTimeout = setTimeout(() => {
                if (elements.judgeConfirmWinnerBtn.textContent === 'Confirming...') {
                    elements.judgeConfirmWinnerBtn.disabled = false;
                    elements.judgeConfirmWinnerBtn.textContent = 'Confirm Winner';
                    elements.judgeSubmissionsList.querySelectorAll('.judge-sub-card').forEach(c => {
                        c.style.pointerEvents = '';
                    });
                    showNotification('No response from server. Try again.');
                }
            }, 5000);

            socket.emit('judge:selectWinner', selectedPlayerId, (response) => {
                clearTimeout(safetyTimeout);
                if (!response.success) {
                    showNotification(response.error || 'Failed to select winner');
                    elements.judgeConfirmWinnerBtn.disabled = false;
                    elements.judgeConfirmWinnerBtn.textContent = 'Confirm Winner';
                    elements.judgeSubmissionsList.querySelectorAll('.judge-sub-card').forEach(c => {
                        c.style.pointerEvents = '';
                    });
                } else {
                    elements.judgeConfirmWinnerBtn.textContent = 'Winner Selected!';
                }
            });
        };
    }
}

// =============================================================================
// STEAL
// =============================================================================

function showStealModal(players) {
    if (!elements.stealModal || !elements.stealTargetList) return;

    // Filter: exclude self, exclude players with 0 score
    const targets = players.filter(p =>
        p.id !== playerState.playerId && p.score > 0
    );

    if (targets.length === 0) {
        showNotification('No valid targets to steal from.');
        return;
    }

    elements.stealTargetList.innerHTML = targets.map(t =>
        `<li><button class="steal-target-btn" data-target-id="${t.id}">
            <span class="target-avatar">${renderAvatarHtml(t.avatar || DEFAULT_AVATAR, `${t.name} avatar`)}</span>
            <span class="target-name">${escapeHtml(t.name)}</span>
            <span class="target-score">Score: ${t.score}</span>
        </button></li>`
    ).join('');

    // Attach click listeners to target buttons
    const targetButtons = elements.stealTargetList.querySelectorAll('.steal-target-btn');
    targetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.targetId;
            executeSteal(targetId);
        });
    });

    elements.stealModal.classList.add('active');
    elements.stealModal.style.display = 'flex';
}

function hideStealModal() {
    if (elements.stealModal) {
        elements.stealModal.classList.remove('active');
        elements.stealModal.style.display = 'none';
    }
}

// =============================================================================
// CURSE CONTROLS (for when this player is the curser)
// =============================================================================

let curserModifierData = null;
let curserDrawnModifier = null;
let curserSelectedTargetIndex = null;

function showCurserControls(data) {
    playerState.isCurser = true;
    curserModifierData = data;
    curserDrawnModifier = null;
    curserSelectedTargetIndex = null;

    if (elements.curserControls) {
        elements.curserControls.style.display = '';
    }
    if (elements.playerDrawCurseBtn) {
        elements.playerDrawCurseBtn.style.display = '';
        elements.playerDrawCurseBtn.disabled = false;
    }
    if (elements.playerCurseCardDisplay) elements.playerCurseCardDisplay.style.display = 'none';
    if (elements.playerCurseTargets) elements.playerCurseTargets.style.display = 'none';
    if (elements.playerCurseActions) elements.playerCurseActions.style.display = 'none';
}

function hideCurserControls() {
    playerState.isCurser = false;
    curserModifierData = null;
    curserDrawnModifier = null;
    curserSelectedTargetIndex = null;

    if (elements.curserControls) {
        elements.curserControls.style.display = 'none';
    }
}

function showPlayerCurseCard(modifier) {
    curserDrawnModifier = modifier;

    if (elements.playerDrawCurseBtn) elements.playerDrawCurseBtn.style.display = 'none';
    if (elements.playerCurseCardDisplay) {
        elements.playerCurseCardDisplay.style.display = '';
        if (elements.playerCurseIcon) elements.playerCurseIcon.textContent = modifier.icon || '\u26A0\uFE0F';
        if (elements.playerCurseName) elements.playerCurseName.textContent = modifier.name;
        if (elements.playerCurseDesc) elements.playerCurseDesc.textContent = modifier.description;
    }
    if (elements.playerCurseActions) elements.playerCurseActions.style.display = '';
    if (elements.playerApplyCurseBtn) elements.playerApplyCurseBtn.disabled = true;

    // Show target selection
    showPlayerCurseTargets();
}

function showPlayerCurseTargets() {
    if (!elements.playerCurseTargets || !elements.playerCurseTargetList || !curserModifierData) return;

    elements.playerCurseTargets.style.display = '';
    elements.playerCurseTargetList.innerHTML = '';
    curserSelectedTargetIndex = null;

    const curserIndex = curserModifierData.curserIndex;
    const players = curserModifierData.gameState.players;

    players.forEach((player, index) => {
        if (player.isJudge || index === curserIndex) return;

        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.style.cssText = 'padding:8px 14px; font-size:0.95em;';
        btn.innerHTML = `${renderAvatarHtml(player.avatar || DEFAULT_AVATAR, `${player.name} avatar`)} ${escapeHtml(player.name)}`;
        btn.addEventListener('click', () => {
            elements.playerCurseTargetList.querySelectorAll('button').forEach(b => {
                b.style.borderColor = '';
                b.style.boxShadow = '';
            });
            btn.style.borderColor = '#FF1493';
            btn.style.boxShadow = '0 0 10px rgba(255,20,147,0.5)';
            curserSelectedTargetIndex = index;
            if (elements.playerApplyCurseBtn) elements.playerApplyCurseBtn.disabled = false;
        });

        elements.playerCurseTargetList.appendChild(btn);
    });
}

function executeSteal(targetId) {
    socket.emit('player:steal', targetId, (response) => {
        hideStealModal();

        if (response.success) {
            showNotification('Point stolen!');
        } else {
            showNotification(response.error || 'Steal failed.');
        }
    });
}

// =============================================================================
// RECONNECTION
// =============================================================================

function saveToLocalStorage() {
    try {
        localStorage.setItem('pa_playerId', playerState.playerId);
        localStorage.setItem('pa_playerName', playerState.playerName);
        localStorage.setItem('pa_roomCode', playerState.roomCode);
        localStorage.setItem('pa_playerAvatar', playerState.playerAvatar);
        localStorage.setItem('pa_reconnectToken', playerState.reconnectToken || '');
    } catch (e) {
        // localStorage may not be available
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem('pa_playerId');
        localStorage.removeItem('pa_playerName');
        localStorage.removeItem('pa_roomCode');
        localStorage.removeItem('pa_playerAvatar');
        localStorage.removeItem('pa_reconnectToken');
    } catch (e) {
        // localStorage may not be available
    }
}

function getStoredSession() {
    try {
        return {
            playerId: localStorage.getItem('pa_playerId'),
            playerName: localStorage.getItem('pa_playerName'),
            roomCode: localStorage.getItem('pa_roomCode'),
            playerAvatar: localStorage.getItem('pa_playerAvatar'),
            reconnectToken: localStorage.getItem('pa_reconnectToken')
        };
    } catch (e) {
        return null;
    }
}

function attemptRejoin() {
    const stored = getStoredSession();
    if (!stored || !stored.roomCode || !stored.playerName || !stored.reconnectToken) {
        showScreen('join');
        return;
    }

    socket.emit('player:reconnect', {
        roomCode: stored.roomCode,
        playerName: stored.playerName,
        reconnectToken: stored.reconnectToken
    }, (response) => {
        if (response.success) {
            playerState.playerId = socket.id;
            playerState.playerName = stored.playerName;
            playerState.playerAvatar = stored.playerAvatar;
            playerState.roomCode = stored.roomCode;
            playerState.reconnectToken = response.reconnectToken || stored.reconnectToken;

            // Update localStorage with new socket ID
            saveToLocalStorage();

        if (response.gameState) {
            handleGameState(response.gameState);
        } else {
            showScreen('lobby');
        }

        if (playerState.pendingAvatarSync) {
            syncAvatarSelection(playerState.pendingAvatarSync);
        }

        showNotification('Reconnected!');
        } else {
            clearLocalStorage();
            // Reset state
            playerState.roomCode = null;
            playerState.playerName = null;
            playerState.playerAvatar = null;
            playerState.currentPhase = 'join';
            showScreen('join');
            showJoinError('Could not rejoin. The room may no longer exist.');
        }
    });
}

function handleGameState(state) {
    if (!state) {
        showScreen('lobby');
        return;
    }

    // Find ourselves in the player list
    const me = state.players.find(p => p.id === playerState.playerId) ||
               state.players.find(p => p.name === playerState.playerName);

    if (me) {
        playerState.playerId = me.id;
        playerState.playerAvatar = me.avatar || playerState.playerAvatar;
        playerState.isJudge = me.isJudge;
        playerState.score = me.score;
        playerState.tokens = { ...me.tokens };
        playerState.activeModifiers = me.activeModifiers || [];
        playerState.heldCurse = me.heldCurse || null;

        const idx = AVATARS.indexOf(playerState.playerAvatar);
        if (idx !== -1) {
            currentAvatarIndex = idx;
        }
    }

    playerState.currentAlignment = state.currentAlignment;
    playerState.currentAlignmentFullName = state.currentAlignmentFullName;
    playerState.currentPrompt = state.selectedPrompt;

    const phase = state.gamePhase;

    if (!state.gameStarted) {
        showScreen('lobby');
        if (elements.lobbyRoomCode) {
            elements.lobbyRoomCode.textContent = state.code;
        }
        updateLobbyPlayerList(state.players);
        return;
    }

    // Determine correct screen based on game phase and role
    switch (phase) {
        case 'lobby':
            showScreen('lobby');
            if (elements.lobbyRoomCode) {
                elements.lobbyRoomCode.textContent = state.code;
            }
            updateLobbyPlayerList(state.players);
            break;

        case 'alignment':
        case 'judge_choice':
        case 'prompts':
            showScreen('waiting');
            if (playerState.isJudge) {
                updateWaitingRole('judge');
                if (phase === 'alignment') {
                    updateWaitingMessage('You are the Judge! Roll the alignment.');
                    showJudgeRollButton();
                } else if (phase === 'judge_choice') {
                    updateWaitingMessage('Pick an alignment!');
                    showJudgeChoiceGrid();
                } else if (phase === 'prompts') {
                    if (state.currentPrompts && state.currentPrompts.length > 0) {
                        updateWaitingMessage('Pick a prompt!');
                        showJudgePromptCards(state.currentPrompts);
                    } else {
                        updateWaitingMessage('Draw some prompts!');
                        showJudgeDrawPrompts();
                    }
                }
            } else {
                const judge = state.judge;
                const judgeName = judge ? judge.name : 'The judge';
                updateWaitingMessage(`${judgeName} is setting up the round...`);
                updateWaitingRole('player');
            }
            break;

        case 'drawing':
            if (playerState.isJudge) {
                showScreen('waiting');
                updateWaitingMessage('Players are drawing... Sit tight, Judge!');
                updateWaitingRole('judge');
            } else if (playerState.hasSubmitted) {
                showScreen('submitted');
                if (elements.submittedMessage) {
                    elements.submittedMessage.textContent = 'Drawing submitted! Waiting for others...';
                }
            } else {
                showScreen('drawing');
                if (elements.drawingPrompt) {
                    elements.drawingPrompt.textContent = state.selectedPrompt || '';
                }
                if (elements.drawingAlignment) {
                    elements.drawingAlignment.textContent = state.currentAlignmentFullName || state.currentAlignment || '';
                }
                displayActiveModifiers();
                clearCanvas();
                resizeCanvas();
                if (elements.submitDrawingButton) {
                    elements.submitDrawingButton.disabled = false;
                    elements.submitDrawingButton.textContent = 'Submit Drawing';
                }
            }
            break;

        case 'judging':
            showScreen('judging');
            if (elements.judgingMessage) {
                if (playerState.isJudge) {
                    elements.judgingMessage.textContent = 'Review the drawings on the main screen and pick a winner!';
                } else {
                    elements.judgingMessage.textContent = 'The judge is reviewing all drawings...';
                }
            }
            break;

        case 'scoring':
            showScreen('results');
            if (elements.resultsScore) {
                elements.resultsScore.textContent = `Your Score: ${playerState.score}`;
            }
            updateTokenDisplay();
            if (elements.stealBtnContainer) {
                elements.stealBtnContainer.style.display = 'none';
            }
            break;

        case 'modifiers':
            showScreen('waiting');
            updateWaitingMessage('Modifier phase in progress...');
            break;

        case 'gameOver':
            showScreen('gameover');
            break;

        default:
            showScreen('waiting');
            updateWaitingMessage('Waiting...');
            break;
    }
}

// =============================================================================
// ACTIVE MODIFIERS DISPLAY
// =============================================================================

function displayActiveModifiers() {
    if (!elements.drawingModifiers) return;

    if (playerState.activeModifiers && playerState.activeModifiers.length > 0) {
        elements.drawingModifiers.innerHTML = playerState.activeModifiers.map(mod =>
            `<div class="modifier-badge">
                <span class="modifier-icon">${mod.icon || ''}</span>
                <span class="modifier-name">${escapeHtml(mod.name)}</span>
                <span class="modifier-desc">${escapeHtml(mod.description)}</span>
            </div>`
        ).join('');
        elements.drawingModifiers.style.display = 'block';
    } else {
        elements.drawingModifiers.innerHTML = '';
        elements.drawingModifiers.style.display = 'none';
    }
}

// =============================================================================
// TOKEN DISPLAY
// =============================================================================

function updateTokenDisplay() {
    if (!elements.resultsTokens) return;

    const tokenInfo = {
        mindReader:       { icon: '🧠', name: 'Mind Reader' },
        technicalMerit:   { icon: '🎨', name: 'Technical Merit' },
        perfectAlignment: { icon: '⚖️',  name: 'Perfect Alignment' },
        plotTwist:        { icon: '🌀', name: 'Plot Twist' }
    };

    const total = getTotalTokens();

    let html = `<div class="token-total">Tokens: ${total}</div>`;
    html += '<div class="token-list">';
    for (const [key, info] of Object.entries(tokenInfo)) {
        const count = playerState.tokens[key] || 0;
        if (count > 0) {
            html += `<div class="token-item">
                <span class="token-icon">${info.icon}</span>
                <span class="token-name">${info.name}</span>
                <span class="token-count">x${count}</span>
            </div>`;
        }
    }
    html += '</div>';

    elements.resultsTokens.innerHTML = html;
}

// =============================================================================
// JUDGE CONTROLS (for when this player is the judge)
// =============================================================================

const ALIGNMENT_NAMES = {
    LG: "Lawful Good", NG: "Neutral Good", CG: "Chaotic Good",
    LN: "Lawful Neutral", TN: "True Neutral", CN: "Chaotic Neutral",
    LE: "Lawful Evil", NE: "Neutral Evil", CE: "Chaotic Evil"
};

function updateJudgeDisplay(judge) {
    if (elements.waitingJudgeName && judge) {
        elements.waitingJudgeName.textContent = judge.name || '';
    }
    if (elements.waitingJudgeAvatar && judge) {
        elements.waitingJudgeAvatar.innerHTML = renderAvatarHtml(judge.avatar || DEFAULT_AVATAR, `${judge.name || 'Judge'} avatar`);
    }
}

function hideJudgeControls() {
    if (elements.judgeControls) elements.judgeControls.style.display = 'none';
    if (elements.judgeChoiceGrid) elements.judgeChoiceGrid.style.display = 'none';
    if (elements.judgeDrawPromptsBtn) elements.judgeDrawPromptsBtn.style.display = 'none';
    if (elements.judgePromptCards) elements.judgePromptCards.style.display = 'none';
    if (elements.judgeRollBtn) elements.judgeRollBtn.style.display = 'none';
}

function showJudgeRollButton() {
    if (elements.judgeControls) elements.judgeControls.style.display = '';
    if (elements.judgeRollBtn) {
        elements.judgeRollBtn.style.display = '';
        elements.judgeRollBtn.disabled = false;
        elements.judgeRollBtn.textContent = 'Roll Alignment';
        elements.judgeRollBtn.onclick = () => {
            elements.judgeRollBtn.disabled = true;
            elements.judgeRollBtn.textContent = 'Rolling...';
            socket.emit('judge:rollAlignment', (response) => {
                if (!response.success) {
                    showNotification(response.error || 'Roll failed');
                    elements.judgeRollBtn.disabled = false;
                    elements.judgeRollBtn.textContent = 'Roll Alignment';
                }
            });
        };
    }
    // Hide other controls
    if (elements.judgeChoiceGrid) elements.judgeChoiceGrid.style.display = 'none';
    if (elements.judgeDrawPromptsBtn) elements.judgeDrawPromptsBtn.style.display = 'none';
    if (elements.judgePromptCards) elements.judgePromptCards.style.display = 'none';
}

function showJudgeChoiceGrid() {
    if (elements.judgeControls) elements.judgeControls.style.display = '';
    if (elements.judgeRollBtn) elements.judgeRollBtn.style.display = 'none';
    if (elements.judgeChoiceGrid) {
        elements.judgeChoiceGrid.style.display = 'grid';
        elements.judgeChoiceGrid.innerHTML = '';

        const alignments = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];
        alignments.forEach(code => {
            const btn = document.createElement('button');
            btn.className = 'judge-choice-btn';
            btn.textContent = ALIGNMENT_NAMES[code];
            btn.addEventListener('click', () => {
                elements.judgeChoiceGrid.querySelectorAll('.judge-choice-btn').forEach(b => {
                    b.disabled = true;
                });
                btn.classList.add('selected');
                socket.emit('judge:selectJudgeAlignment', code, (response) => {
                    if (!response.success) {
                        showNotification(response.error || 'Selection failed');
                        elements.judgeChoiceGrid.querySelectorAll('.judge-choice-btn').forEach(b => {
                            b.disabled = false;
                            b.classList.remove('selected');
                        });
                    }
                });
            });
            elements.judgeChoiceGrid.appendChild(btn);
        });
    }
}

function showJudgeDrawPrompts() {
    if (elements.judgeControls) elements.judgeControls.style.display = '';
    if (elements.judgeDrawPromptsBtn) {
        elements.judgeDrawPromptsBtn.style.display = '';
        elements.judgeDrawPromptsBtn.disabled = false;
        elements.judgeDrawPromptsBtn.textContent = 'Draw Prompts';
        elements.judgeDrawPromptsBtn.onclick = () => {
            elements.judgeDrawPromptsBtn.disabled = true;
            elements.judgeDrawPromptsBtn.textContent = 'Drawing...';
            socket.emit('judge:drawPrompts', (response) => {
                if (!response.success) {
                    showNotification(response.error || 'Draw failed');
                    elements.judgeDrawPromptsBtn.disabled = false;
                    elements.judgeDrawPromptsBtn.textContent = 'Draw Prompts';
                }
            });
        };
    }
}

function showJudgePromptCards(prompts) {
    if (elements.judgeControls) elements.judgeControls.style.display = '';
    if (elements.judgeDrawPromptsBtn) elements.judgeDrawPromptsBtn.style.display = 'none';
    if (elements.judgePromptCards) {
        elements.judgePromptCards.style.display = 'flex';
        elements.judgePromptCards.innerHTML = '';

        prompts.forEach((prompt, index) => {
            const btn = document.createElement('button');
            btn.className = 'judge-prompt-btn';
            btn.textContent = prompt;
            btn.addEventListener('click', () => {
                elements.judgePromptCards.querySelectorAll('.judge-prompt-btn').forEach(b => {
                    b.disabled = true;
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                socket.emit('judge:selectPrompt', index, (response) => {
                    if (!response.success) {
                        showNotification(response.error || 'Selection failed');
                        elements.judgePromptCards.querySelectorAll('.judge-prompt-btn').forEach(b => {
                            b.disabled = false;
                        });
                    } else {
                        updateWaitingMessage('Players are drawing... Sit tight, Judge!');
                        hideJudgeControls();
                    }
                });
            });
            elements.judgePromptCards.appendChild(btn);
        });
    }
}

// =============================================================================
// UTILITY
// =============================================================================

function spawnConfetti(count) {
    count = count || 35;
    const colors = ['#FF69B4', '#FFD700', '#00FF00', '#FF1493', '#00CED1', '#FF6347', '#9370DB'];
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = (Math.random() * 6 + 4) + 'px';
        particle.style.height = (Math.random() * 6 + 4) + 'px';
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        particle.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
        particle.style.animationDelay = (Math.random() * 0.8) + 's';
        document.body.appendChild(particle);
        setTimeout(() => {
            if (particle.parentNode) particle.parentNode.removeChild(particle);
        }, 4000);
    }
}

function showScreen(screenName) {
    playerState.currentPhase = screenName;

    const allScreens = [
        elements.joinScreen,
        elements.lobbyScreen,
        elements.waitingScreen,
        elements.drawingScreen,
        elements.submittedScreen,
        elements.judgingScreen,
        elements.resultsScreen,
        elements.gameoverScreen,
        elements.disconnectedScreen
    ];

    const screenMap = {
        join: elements.joinScreen,
        lobby: elements.lobbyScreen,
        waiting: elements.waitingScreen,
        drawing: elements.drawingScreen,
        submitted: elements.submittedScreen,
        judging: elements.judgingScreen,
        results: elements.resultsScreen,
        gameover: elements.gameoverScreen,
        disconnected: elements.disconnectedScreen
    };

    allScreens.forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
            screen.style.display = 'none';
        }
    });

    const target = screenMap[screenName];
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
    }
}

function showNotification(message) {
    let container = elements.notificationContainer;

    // Create container if it does not exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        elements.notificationContainer = container;
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    container.appendChild(notification);

    // Trigger entrance animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Auto-remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, NOTIFICATION_DURATION_MS);
}

function updateWaitingMessage(message) {
    if (elements.waitingMessage) {
        elements.waitingMessage.textContent = message;
    }
}

function updateWaitingRole(role) {
    if (elements.waitingRole) {
        elements.waitingRole.textContent = role === 'judge' ? 'You are the Judge' : 'Player';
        elements.waitingRole.className = 'waiting-role ' + role;
    }
}

function getTotalTokens() {
    return Object.values(playerState.tokens).reduce((sum, count) => sum + count, 0);
}

function formatTime(seconds) {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function openImageLightbox(imageSrc, playerName) {
    const lightbox = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    const nameEl = document.getElementById('lightbox-player-name');
    const closeBtn = document.getElementById('lightbox-close');
    const backdrop = lightbox ? lightbox.querySelector('.lightbox-backdrop') : null;

    if (!lightbox || !img) return;

    img.src = imageSrc;
    if (nameEl) nameEl.textContent = playerName ? `Drawing by ${escapeHtml(playerName)}` : '';
    lightbox.style.display = 'flex';

    const closeLightbox = () => {
        lightbox.style.display = 'none';
        img.src = '';
    };

    if (closeBtn) closeBtn.onclick = closeLightbox;
    if (backdrop) backdrop.onclick = closeLightbox;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
