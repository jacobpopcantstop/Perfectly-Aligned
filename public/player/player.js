/**
 * Perfectly Aligned - Player Controller
 * Manages the player's mobile device interface
 */

// Socket connection
const socket = io();

// Player state
let playerState = {
    playerId: null,
    playerName: null,
    playerAvatar: null,
    roomCode: null,
    connected: false,
    isJudge: false,
    score: 0,
    tokens: { mindReader: 0, technicalMerit: 0, perfectAlignment: 0, plotTwist: 0 },
    hasSubmitted: false,
    currentPhase: 'join'
};

// Available avatars (matches server constants)
const PLAYER_AVATARS = [
    'alienlady_avatar.png',
    'dadskeletonts_avatar.png',
    'chessqueen_avatar.png'
];

let currentAvatarIndex = 0;

// Drawing state
let canvas, ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#000000';
let currentSize = 8;
let drawingHistory = [];
let currentPath = [];

// DOM Elements
const elements = {
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
    joinForm: document.getElementById('join-form'),
    roomCodeInput: document.getElementById('room-code-input'),
    playerNameInput: document.getElementById('player-name-input'),
    avatarPreview: document.getElementById('avatar-preview'),
    avatarPrev: document.getElementById('avatar-prev'),
    avatarNext: document.getElementById('avatar-next'),
    joinError: document.getElementById('join-error'),

    // Lobby
    myAvatar: document.getElementById('my-avatar'),
    myName: document.getElementById('my-name'),
    lobbyPlayerList: document.getElementById('lobby-player-list'),

    // Waiting
    judgeAvatarWaiting: document.getElementById('judge-avatar-waiting'),
    judgeNameWaiting: document.getElementById('judge-name-waiting'),

    // Drawing
    drawAlignment: document.getElementById('draw-alignment'),
    drawPrompt: document.getElementById('draw-prompt'),
    timerProgress: document.getElementById('timer-progress'),
    timerText: document.getElementById('timer-text'),
    drawingCanvas: document.getElementById('drawing-canvas'),
    clearCanvasBtn: document.getElementById('clear-canvas'),
    undoBtn: document.getElementById('undo-btn'),
    submitDrawingBtn: document.getElementById('submit-drawing-btn'),
    submissionStatus: document.getElementById('submission-status'),

    // Submitted
    submittedPreviewImg: document.getElementById('submitted-preview-img'),

    // Judging
    judgePhaseAlignment: document.getElementById('judge-phase-alignment'),
    judgePhasePrompt: document.getElementById('judge-phase-prompt'),

    // Results
    resultTitle: document.getElementById('result-title'),
    resultWinnerAvatar: document.getElementById('result-winner-avatar'),
    resultWinnerName: document.getElementById('result-winner-name'),
    myScore: document.getElementById('my-score'),
    targetScore: document.getElementById('target-score'),
    myTokens: document.getElementById('my-tokens'),
    stealBtn: document.getElementById('steal-btn'),

    // Steal modal
    stealModal: document.getElementById('steal-modal'),
    stealTargets: document.getElementById('steal-targets'),
    cancelSteal: document.getElementById('cancel-steal'),

    // Game over
    finalWinnerAvatar: document.getElementById('final-winner-avatar'),
    finalWinnerName: document.getElementById('final-winner-name'),
    myRank: document.getElementById('my-rank'),

    // Disconnected
    disconnectReason: document.getElementById('disconnect-reason'),
    rejoinBtn: document.getElementById('rejoin-btn'),
    newGameBtn: document.getElementById('new-game-btn')
};

// ==================== INITIALIZATION ====================

function init() {
    // Check for room code in URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'play') {
        elements.roomCodeInput.value = pathParts[2].toUpperCase();
    }

    setupEventListeners();
    setupSocketListeners();
    updateAvatarPreview();
    setupCanvas();
}

function setupEventListeners() {
    // Join form
    elements.joinForm.addEventListener('submit', handleJoinSubmit);
    elements.avatarPrev.addEventListener('click', () => cycleAvatar(-1));
    elements.avatarNext.addEventListener('click', () => cycleAvatar(1));
    elements.roomCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // Drawing tools
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => selectColor(btn));
    });
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => selectSize(btn));
    });
    elements.clearCanvasBtn.addEventListener('click', clearCanvas);
    elements.undoBtn.addEventListener('click', undoStroke);
    elements.submitDrawingBtn.addEventListener('click', submitDrawing);

    // Steal
    elements.stealBtn.addEventListener('click', showStealModal);
    elements.cancelSteal.addEventListener('click', hideStealModal);

    // Disconnect/reconnect
    elements.rejoinBtn.addEventListener('click', attemptRejoin);
    elements.newGameBtn.addEventListener('click', () => {
        showScreen('join');
        elements.roomCodeInput.value = '';
    });
}

function setupSocketListeners() {
    // Connection events
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Room events
    socket.on('room:playerJoined', handlePlayerJoined);
    socket.on('room:playerLeft', handlePlayerLeft);
    socket.on('room:closed', handleRoomClosed);
    socket.on('player:kicked', handleKicked);

    // Game events
    socket.on('game:started', handleGameStarted);
    socket.on('game:alignmentRolled', handleAlignmentRolled);
    socket.on('game:promptSelected', handlePromptSelected);
    socket.on('game:startDrawing', handleStartDrawing);
    socket.on('game:timerTick', handleTimerTick);
    socket.on('game:timerEnd', handleTimerEnd);
    socket.on('game:submissionsCollected', handleSubmissionsCollected);
    socket.on('game:winnerSelected', handleWinnerSelected);
    socket.on('game:newRound', handleNewRound);
    socket.on('game:stealExecuted', handleStealExecuted);
    socket.on('game:over', handleGameOver);
}

// ==================== SCREENS ====================

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) {
        screen.classList.add('active');
    }
    playerState.currentPhase = screenName;
}

// ==================== JOIN ====================

function cycleAvatar(direction) {
    currentAvatarIndex = (currentAvatarIndex + direction + PLAYER_AVATARS.length) % PLAYER_AVATARS.length;
    updateAvatarPreview();
}

function updateAvatarPreview() {
    playerState.playerAvatar = PLAYER_AVATARS[currentAvatarIndex];
    elements.avatarPreview.style.backgroundImage = `url('/assets/images/avatars/${playerState.playerAvatar}')`;
}

function handleJoinSubmit(e) {
    e.preventDefault();
    elements.joinError.textContent = '';

    const roomCode = elements.roomCodeInput.value.trim().toUpperCase();
    const playerName = elements.playerNameInput.value.trim();

    if (roomCode.length !== 4) {
        elements.joinError.textContent = 'Room code must be 4 characters';
        return;
    }

    if (playerName.length < 1) {
        elements.joinError.textContent = 'Please enter a name';
        return;
    }

    playerState.playerName = playerName;
    playerState.roomCode = roomCode;

    socket.emit('player:joinRoom', {
        roomCode,
        playerName,
        avatar: playerState.playerAvatar
    }, (response) => {
        if (response.success) {
            playerState.playerId = response.playerId;
            playerState.connected = true;

            // Save to localStorage for reconnection
            localStorage.setItem('pa_playerId', playerState.playerId);
            localStorage.setItem('pa_playerName', playerState.playerName);
            localStorage.setItem('pa_roomCode', playerState.roomCode);

            elements.myAvatar.style.backgroundImage = `url('/assets/images/avatars/${playerState.playerAvatar}')`;
            elements.myName.textContent = playerState.playerName;

            if (response.gameState.gameStarted) {
                // Game already started, go to appropriate screen
                handleGameState(response.gameState);
            } else {
                showScreen('lobby');
                updateLobbyPlayers(response.gameState.players);
            }
        } else {
            elements.joinError.textContent = response.error || 'Failed to join room';
        }
    });
}

function handleGameState(state) {
    // Determine which screen to show based on game phase
    const me = state.players.find(p => p.id === playerState.playerId);
    if (me) {
        playerState.isJudge = me.isJudge;
        playerState.score = me.score;
        playerState.tokens = me.tokens;
    }

    switch (state.gamePhase) {
        case 'lobby':
            showScreen('lobby');
            break;
        case 'alignment':
        case 'prompts':
            showScreen(playerState.isJudge ? 'waiting' : 'waiting');
            break;
        case 'drawing':
            if (playerState.isJudge) {
                showScreen('waiting');
            } else {
                handleStartDrawing({
                    prompt: state.selectedPrompt,
                    alignment: state.currentAlignment,
                    alignmentFullName: state.currentAlignmentFullName
                });
            }
            break;
        case 'judging':
            showScreen('judging');
            break;
        case 'scoring':
            showScreen('results');
            break;
        case 'gameOver':
            showScreen('gameover');
            break;
    }
}

// ==================== LOBBY ====================

function handlePlayerJoined(data) {
    updateLobbyPlayers(data.players);
}

function handlePlayerLeft(data) {
    updateLobbyPlayers(data.players);
}

function updateLobbyPlayers(players) {
    elements.lobbyPlayerList.innerHTML = '';
    players.forEach(player => {
        if (player.id === playerState.playerId) return; // Skip self

        const div = document.createElement('div');
        div.className = `lobby-player ${player.connected ? '' : 'disconnected'}`;
        div.innerHTML = `
            <div class="player-avatar" style="background-image: url('/assets/images/avatars/${player.avatar}')"></div>
            <span class="player-name">${player.name}</span>
        `;
        elements.lobbyPlayerList.appendChild(div);
    });
}

// ==================== GAME EVENTS ====================

function handleGameStarted(state) {
    const me = state.players.find(p => p.id === playerState.playerId);
    if (me) {
        playerState.isJudge = me.isJudge;
    }

    elements.targetScore.textContent = state.targetScore;

    if (playerState.isJudge) {
        showScreen('waiting');
        updateJudgeDisplay(state.judge);
    } else {
        showScreen('waiting');
        updateJudgeDisplay(state.judge);
    }
}

function handleAlignmentRolled(data) {
    // Just update displays, stay on waiting screen
    elements.drawAlignment.textContent = data.alignment;
    elements.judgePhaseAlignment.textContent = data.alignment;
}

function handlePromptSelected(data) {
    elements.drawPrompt.textContent = data.prompt;
    elements.judgePhasePrompt.textContent = data.prompt;
}

function updateJudgeDisplay(judge) {
    if (judge) {
        elements.judgeAvatarWaiting.style.backgroundImage = `url('/assets/images/avatars/${judge.avatar}')`;
        elements.judgeNameWaiting.textContent = judge.name;
    }
}

function handleStartDrawing(data) {
    if (playerState.isJudge) {
        showScreen('waiting');
        return;
    }

    playerState.hasSubmitted = false;
    elements.drawAlignment.textContent = data.alignment;
    elements.drawPrompt.textContent = data.prompt;
    elements.submissionStatus.textContent = '';
    elements.submitDrawingBtn.disabled = false;

    // Reset canvas
    clearCanvas();
    resizeCanvas();

    showScreen('drawing');
}

// ==================== DRAWING ====================

function setupCanvas() {
    canvas = elements.drawingCanvas;
    ctx = canvas.getContext('2d');

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    // Mouse events (for testing on desktop)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', handleMouseUp);

    // Prevent default touch behaviors
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    // Resize handler
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // Save current drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Resize
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Restore drawing (scaled)
    ctx.putImageData(imageData, 0, 0);
}

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function handleTouchStart(e) {
    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;
    currentPath = [{ x: lastX, y: lastY, color: currentColor, size: currentSize }];
}

function handleTouchMove(e) {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);
    draw(lastX, lastY, coords.x, coords.y);
    lastX = coords.x;
    lastY = coords.y;
    currentPath.push({ x: lastX, y: lastY });
}

function handleTouchEnd() {
    if (isDrawing && currentPath.length > 0) {
        drawingHistory.push([...currentPath]);
    }
    isDrawing = false;
    currentPath = [];
}

function handleMouseDown(e) {
    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;
    currentPath = [{ x: lastX, y: lastY, color: currentColor, size: currentSize }];
}

function handleMouseMove(e) {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);
    draw(lastX, lastY, coords.x, coords.y);
    lastX = coords.x;
    lastY = coords.y;
    currentPath.push({ x: lastX, y: lastY });
}

function handleMouseUp() {
    if (isDrawing && currentPath.length > 0) {
        drawingHistory.push([...currentPath]);
    }
    isDrawing = false;
    currentPath = [];
}

function draw(fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function selectColor(btn) {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentColor = btn.dataset.color;
}

function selectSize(btn) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSize = parseInt(btn.dataset.size);
}

function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
}

function undoStroke() {
    if (drawingHistory.length === 0) return;

    drawingHistory.pop();

    // Redraw everything
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawingHistory.forEach(path => {
        if (path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        ctx.strokeStyle = path[0].color;
        ctx.lineWidth = path[0].size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
    });
}

function submitDrawing() {
    if (playerState.hasSubmitted) return;

    const dataUrl = canvas.toDataURL('image/png');

    elements.submitDrawingBtn.disabled = true;
    elements.submissionStatus.textContent = 'Submitting...';

    socket.emit('player:submitDrawing', dataUrl, (response) => {
        if (response.success) {
            playerState.hasSubmitted = true;
            elements.submittedPreviewImg.src = dataUrl;
            showScreen('submitted');
        } else {
            elements.submissionStatus.textContent = 'Failed: ' + response.error;
            elements.submitDrawingBtn.disabled = false;
        }
    });
}

// ==================== TIMER ====================

let timerDuration = 0;
let timerStarted = false;

function handleTimerTick(data) {
    const remaining = data.timeLeft;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    elements.timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Update progress bar
    if (timerDuration > 0) {
        const progress = (remaining / timerDuration) * 100;
        elements.timerProgress.style.width = `${progress}%`;
    }
}

function handleTimerEnd() {
    elements.timerText.textContent = "TIME'S UP!";
    elements.timerProgress.style.width = '0%';

    // Auto-submit if not submitted
    if (!playerState.hasSubmitted && !playerState.isJudge) {
        submitDrawing();
    }
}

// ==================== JUDGING & RESULTS ====================

function handleSubmissionsCollected(data) {
    showScreen('judging');
    elements.judgePhaseAlignment.textContent = elements.drawAlignment.textContent;
    elements.judgePhasePrompt.textContent = elements.drawPrompt.textContent;
}

function handleWinnerSelected(data) {
    showScreen('results');

    // Update winner display
    elements.resultWinnerAvatar.style.backgroundImage = `url('/assets/images/avatars/${getAvatarForPlayer(data.winnerId, data.scores)}')`;
    elements.resultWinnerName.textContent = data.winnerName;

    // Check if I won
    if (data.winnerId === playerState.playerId) {
        elements.resultTitle.textContent = 'You Won!';
        elements.resultTitle.classList.add('winner');
    } else {
        elements.resultTitle.textContent = 'Round Complete!';
        elements.resultTitle.classList.remove('winner');
    }

    // Update my score
    const myData = data.scores.find(s => s.id === playerState.playerId);
    if (myData) {
        playerState.score = myData.score;
        playerState.tokens = myData.tokens;
        elements.myScore.textContent = myData.score;

        const totalTokens = Object.values(myData.tokens).reduce((a, b) => a + b, 0);
        elements.myTokens.textContent = totalTokens;

        // Show steal button if I have 3+ tokens
        if (totalTokens >= 3) {
            elements.stealBtn.style.display = 'block';
            elements.stealBtn.onclick = () => showStealModal(data.scores);
        } else {
            elements.stealBtn.style.display = 'none';
        }
    }
}

function getAvatarForPlayer(playerId, scores) {
    // We need to get avatar info - for now use a placeholder
    return 'alienlady_avatar.png'; // This should be improved
}

function handleNewRound(data) {
    const me = data.gameState.players.find(p => p.id === playerState.playerId);
    if (me) {
        playerState.isJudge = me.isJudge;
        playerState.score = me.score;
        playerState.tokens = me.tokens;
    }

    playerState.hasSubmitted = false;

    showScreen('waiting');
    updateJudgeDisplay(data.judge);
}

// ==================== STEAL ====================

function showStealModal(scores) {
    elements.stealTargets.innerHTML = '';

    scores.forEach(player => {
        if (player.id === playerState.playerId) return; // Can't steal from self
        if (player.score < 1) return; // Can't steal if no points

        const btn = document.createElement('button');
        btn.className = 'steal-target-btn';
        btn.innerHTML = `
            <span class="target-name">${player.name}</span>
            <span class="target-score">${player.score} pts</span>
        `;
        btn.addEventListener('click', () => executeSteal(player.id));
        elements.stealTargets.appendChild(btn);
    });

    elements.stealModal.style.display = 'flex';
}

function hideStealModal() {
    elements.stealModal.style.display = 'none';
}

function executeSteal(targetId) {
    socket.emit('player:steal', targetId, (response) => {
        hideStealModal();
        if (!response.success) {
            alert('Failed to steal: ' + response.error);
        }
    });
}

function handleStealExecuted(data) {
    // Update scores
    const myData = data.scores.find(s => s.id === playerState.playerId);
    if (myData) {
        playerState.score = myData.score;
        playerState.tokens = myData.tokens;
        elements.myScore.textContent = myData.score;

        const totalTokens = Object.values(myData.tokens).reduce((a, b) => a + b, 0);
        elements.myTokens.textContent = totalTokens;

        // Update steal button visibility
        elements.stealBtn.style.display = totalTokens >= 3 ? 'block' : 'none';
    }

    // Show notification
    if (data.stealerId === playerState.playerId) {
        showNotification(`You stole a point from ${data.targetName}!`);
    } else if (data.targetId === playerState.playerId) {
        showNotification(`${data.stealerName} stole a point from you!`);
    }
}

// ==================== GAME OVER ====================

function handleGameOver(data) {
    showScreen('gameover');

    elements.finalWinnerAvatar.style.backgroundImage = `url('/assets/images/avatars/${data.winner.avatar}')`;
    elements.finalWinnerName.textContent = data.winner.name;

    // Calculate my rank
    const sorted = data.finalScores.sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === playerState.playerId) + 1;
    elements.myRank.textContent = `#${myRank}`;
}

// ==================== CONNECTION ====================

function handleConnect() {
    console.log('Connected to server');
    playerState.connected = true;
}

function handleDisconnect() {
    console.log('Disconnected from server');
    playerState.connected = false;

    // Don't immediately show disconnected screen - socket.io will try to reconnect
    setTimeout(() => {
        if (!playerState.connected && playerState.currentPhase !== 'join') {
            showScreen('disconnected');
            elements.disconnectReason.textContent = 'Lost connection to the server.';
        }
    }, 3000);
}

function handleRoomClosed(data) {
    showScreen('disconnected');
    elements.disconnectReason.textContent = data.reason || 'The room has been closed.';
}

function handleKicked() {
    showScreen('disconnected');
    elements.disconnectReason.textContent = 'You have been removed from the game.';
    localStorage.removeItem('pa_playerId');
    localStorage.removeItem('pa_playerName');
    localStorage.removeItem('pa_roomCode');
}

function attemptRejoin() {
    const savedName = localStorage.getItem('pa_playerName');
    const savedRoom = localStorage.getItem('pa_roomCode');

    if (savedName && savedRoom) {
        socket.emit('player:reconnect', {
            roomCode: savedRoom,
            playerId: playerState.playerId,
            playerName: savedName
        }, (response) => {
            if (response.success) {
                playerState.connected = true;
                handleGameState(response.gameState);
            } else {
                showScreen('join');
                elements.roomCodeInput.value = savedRoom;
                elements.playerNameInput.value = savedName;
            }
        });
    } else {
        showScreen('join');
    }
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

function getTotalTokens() {
    return Object.values(playerState.tokens).reduce((a, b) => a + b, 0);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
