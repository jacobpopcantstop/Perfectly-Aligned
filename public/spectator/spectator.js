/**
 * Perfectly Aligned - Spectator Controller
 * Watch-only view for spectators
 */

const socket = io();

let spectatorState = {
    roomCode: null,
    connected: false,
    gamePhase: 'lobby'
};

// DOM Elements
const elements = {
    // Screens
    joinScreen: document.getElementById('join-screen'),
    spectatorScreen: document.getElementById('spectator-screen'),
    gameoverScreen: document.getElementById('gameover-screen'),

    // Join
    joinForm: document.getElementById('join-form'),
    roomCodeInput: document.getElementById('room-code-input'),
    joinError: document.getElementById('join-error'),

    // Header
    roomCode: document.getElementById('room-code'),
    roundNumber: document.getElementById('round-number'),
    targetScore: document.getElementById('target-score'),

    // Content
    phaseTitle: document.getElementById('phase-title'),
    phaseInfo: document.getElementById('phase-info'),
    alignmentDisplay: document.getElementById('alignment-display'),
    currentAlignment: document.getElementById('current-alignment'),
    currentAlignmentName: document.getElementById('current-alignment-name'),
    promptDisplay: document.getElementById('prompt-display'),
    currentPrompt: document.getElementById('current-prompt'),
    timerDisplay: document.getElementById('timer-display'),
    timer: document.getElementById('timer'),
    submissionCount: document.getElementById('submission-count'),
    totalArtists: document.getElementById('total-artists'),
    submissionsDisplay: document.getElementById('submissions-display'),
    winnerDisplay: document.getElementById('winner-display'),
    winnerAvatar: document.getElementById('winner-avatar'),
    winnerName: document.getElementById('winner-name'),

    // Scoreboard
    scoreboardList: document.getElementById('scoreboard-list'),

    // Game Over
    finalWinnerAvatar: document.getElementById('final-winner-avatar'),
    finalWinnerName: document.getElementById('final-winner-name'),
    finalScores: document.getElementById('final-scores')
};

// Initialize
function init() {
    // Check for room code in URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'watch') {
        elements.roomCodeInput.value = pathParts[2].toUpperCase();
    }

    setupEventListeners();
    setupSocketListeners();
}

function setupEventListeners() {
    elements.joinForm.addEventListener('submit', handleJoinSubmit);
    elements.roomCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

function setupSocketListeners() {
    socket.on('connect', () => {
        spectatorState.connected = true;
    });

    socket.on('disconnect', () => {
        spectatorState.connected = false;
    });

    // Room events
    socket.on('room:playerJoined', handlePlayerUpdate);
    socket.on('room:playerLeft', handlePlayerUpdate);
    socket.on('room:playerDisconnected', handlePlayerUpdate);
    socket.on('room:playerReconnected', handlePlayerUpdate);
    socket.on('room:closed', handleRoomClosed);

    // Game events
    socket.on('game:started', handleGameStarted);
    socket.on('game:alignmentRolled', handleAlignmentRolled);
    socket.on('game:alignmentSet', handleAlignmentSet);
    socket.on('game:promptsDrawn', handlePromptsDrawn);
    socket.on('game:promptSelected', handlePromptSelected);
    socket.on('game:timerStarted', handleTimerStarted);
    socket.on('game:timerTick', handleTimerTick);
    socket.on('game:timerEnd', handleTimerEnd);
    socket.on('game:submissionReceived', handleSubmissionReceived);
    socket.on('game:submissionsCollected', handleSubmissionsCollected);
    socket.on('game:winnerSelected', handleWinnerSelected);
    socket.on('game:votesRevealed', handleVotesRevealed);
    socket.on('game:newRound', handleNewRound);
    socket.on('game:over', handleGameOver);
}

// Screens
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) screen.classList.add('active');
}

// Join
function handleJoinSubmit(e) {
    e.preventDefault();
    elements.joinError.textContent = '';

    const roomCode = elements.roomCodeInput.value.trim().toUpperCase();
    if (roomCode.length !== 4) {
        elements.joinError.textContent = 'Room code must be 4 characters';
        return;
    }

    socket.emit('spectator:joinRoom', { roomCode }, (response) => {
        if (response.success) {
            spectatorState.roomCode = roomCode;
            elements.roomCode.textContent = roomCode;
            showScreen('spectator');
            updateFromGameState(response.gameState);
        } else {
            elements.joinError.textContent = response.error || 'Failed to join room';
        }
    });
}

// Update UI from game state
function updateFromGameState(state) {
    elements.roundNumber.textContent = state.currentRound || 1;
    elements.targetScore.textContent = state.targetScore || 5;
    updateScoreboard(state.players);

    spectatorState.gamePhase = state.gamePhase;

    // Update display based on phase
    switch (state.gamePhase) {
        case 'lobby':
            setPhase('Waiting for game to start...', `${state.players.length} players in lobby`);
            break;
        case 'alignment':
            setPhase('Rolling Alignment...', 'The judge is rolling for alignment');
            break;
        case 'prompts':
            if (state.currentAlignment) {
                showAlignment(state.currentAlignment, state.currentAlignmentFullName);
            }
            setPhase('Selecting Prompt...', 'The judge is choosing a prompt');
            break;
        case 'drawing':
            showAlignment(state.currentAlignment, state.currentAlignmentFullName);
            showPrompt(state.selectedPrompt);
            setPhase('Drawing Phase', 'Players are creating their submissions');
            elements.timerDisplay.style.display = 'block';
            elements.totalArtists.textContent = state.players.filter(p => !p.isJudge).length;
            break;
        case 'judging':
        case 'voting':
            setPhase(state.gamePhase === 'voting' ? 'Voting!' : 'Judging!',
                state.gamePhase === 'voting' ? 'Players are voting for their favorite' : 'The judge is picking a winner');
            break;
        case 'scoring':
            setPhase('Round Complete!', 'Scoring in progress...');
            break;
        case 'gameOver':
            showScreen('gameover');
            break;
    }
}

function setPhase(title, info) {
    elements.phaseTitle.textContent = title;
    elements.phaseInfo.textContent = info;
}

function showAlignment(abbrev, fullName) {
    elements.alignmentDisplay.style.display = 'block';
    elements.currentAlignment.textContent = abbrev;
    elements.currentAlignmentName.textContent = fullName;
}

function showPrompt(prompt) {
    elements.promptDisplay.style.display = 'block';
    elements.currentPrompt.textContent = prompt;
}

function hideAllDisplays() {
    elements.alignmentDisplay.style.display = 'none';
    elements.promptDisplay.style.display = 'none';
    elements.timerDisplay.style.display = 'none';
    elements.submissionsDisplay.style.display = 'none';
    elements.winnerDisplay.style.display = 'none';
}

// Scoreboard
function updateScoreboard(players) {
    elements.scoreboardList.innerHTML = '';
    const sorted = [...players].sort((a, b) => b.score - a.score);

    sorted.forEach(player => {
        const li = document.createElement('li');
        li.className = player.isJudge ? 'is-judge' : '';
        li.innerHTML = `
            <div class="score-avatar" style="background-image: url('/assets/images/avatars/${player.avatar}')"></div>
            <span class="score-name">${player.name}${player.isJudge ? ' 👑' : ''}</span>
            <span class="score-value">${player.score}</span>
        `;
        elements.scoreboardList.appendChild(li);
    });
}

// Event handlers
function handlePlayerUpdate(data) {
    if (data.players) {
        updateScoreboard(data.players);
    }
}

function handleRoomClosed(data) {
    alert(data.reason || 'Room has been closed');
    showScreen('join');
}

function handleGameStarted(state) {
    hideAllDisplays();
    updateFromGameState(state);
    setPhase('Game Started!', 'Get ready...');
}

function handleAlignmentRolled(data) {
    hideAllDisplays();
    showAlignment(data.alignment, data.fullName);
    if (data.isJudgesChoice) {
        setPhase("Judge's Choice!", 'The judge is picking an alignment');
    } else {
        setPhase('Alignment Rolled!', data.fullName);
    }
}

function handleAlignmentSet(data) {
    showAlignment(data.alignment, data.fullName);
    setPhase('Alignment Selected!', data.fullName);
}

function handlePromptsDrawn(data) {
    setPhase('Prompts Drawn!', 'The judge is selecting a prompt...');
}

function handlePromptSelected(data) {
    showPrompt(data.prompt);
    setPhase('Drawing Time!', 'Players are creating their submissions');
}

function handleTimerStarted(data) {
    elements.timerDisplay.style.display = 'block';
    elements.submissionCount.textContent = '0';
}

function handleTimerTick(data) {
    const mins = Math.floor(data.timeLeft / 60);
    const secs = data.timeLeft % 60;
    elements.timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleTimerEnd() {
    elements.timer.textContent = "TIME'S UP!";
}

function handleSubmissionReceived(data) {
    elements.submissionCount.textContent = data.submissionCount;
}

function handleSubmissionsCollected(data) {
    elements.timerDisplay.style.display = 'none';
    elements.submissionsDisplay.style.display = 'flex';
    elements.submissionsDisplay.innerHTML = '';

    setPhase('Time to Judge!', 'Who captured the alignment best?');

    data.submissions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.dataset.playerId = sub.playerId;

        let contentHtml;
        if (sub.type === 'text') {
            contentHtml = `<div class="submission-text"><p>${escapeHtml(sub.text || sub.content)}</p></div>`;
        } else {
            contentHtml = `<div class="submission-content"><img src="${sub.drawing || sub.content}" alt="Drawing"></div>`;
        }

        card.innerHTML = `
            ${contentHtml}
            <div class="submission-info">
                <div class="submission-avatar" style="background-image: url('/assets/images/avatars/${sub.playerAvatar}')"></div>
                <span class="submission-name">${sub.playerName}</span>
            </div>
        `;
        elements.submissionsDisplay.appendChild(card);
    });
}

function handleWinnerSelected(data) {
    setPhase('Winner!', `${data.winnerName} wins this round!`);

    // Highlight winning submission
    document.querySelectorAll('.submission-card').forEach(card => {
        card.classList.toggle('winner', card.dataset.playerId === data.winnerId);
    });

    // Show winner display
    const winnerPlayer = data.scores.find(p => p.id === data.winnerId);
    if (winnerPlayer) {
        showWinner(winnerPlayer);
    }

    updateScoreboardFromScores(data.scores);
}

function handleVotesRevealed(data) {
    setPhase('Votes Revealed!', `${data.winnerName} wins with the most votes!`);

    document.querySelectorAll('.submission-card').forEach(card => {
        card.classList.toggle('winner', card.dataset.playerId === data.winnerId);
    });

    updateScoreboardFromScores(data.scores);
}

function showWinner(player) {
    elements.winnerDisplay.style.display = 'block';
    elements.winnerAvatar.style.backgroundImage = `url('/assets/images/avatars/${player.avatar || 'alienlady_avatar.png'}')`;
    elements.winnerName.textContent = player.name;
}

function updateScoreboardFromScores(scores) {
    // Merge with existing player data for avatars
    const scoreMap = new Map(scores.map(s => [s.id, s]));
    const existingPlayers = Array.from(elements.scoreboardList.querySelectorAll('li'));

    scores.sort((a, b) => b.score - a.score);
    elements.scoreboardList.innerHTML = '';

    scores.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="score-avatar"></div>
            <span class="score-name">${player.name}</span>
            <span class="score-value">${player.score}</span>
        `;
        elements.scoreboardList.appendChild(li);
    });
}

function handleNewRound(data) {
    hideAllDisplays();
    elements.roundNumber.textContent = data.round;
    updateScoreboard(data.gameState.players);
    setPhase('New Round!', `${data.judge.name} is the judge`);
}

function handleGameOver(data) {
    showScreen('gameover');
    elements.finalWinnerAvatar.style.backgroundImage = `url('/assets/images/avatars/${data.winner.avatar}')`;
    elements.finalWinnerName.textContent = data.winner.name;

    // Show final standings
    const sorted = data.finalScores.sort((a, b) => b.score - a.score);
    elements.finalScores.innerHTML = '';

    sorted.forEach((player, i) => {
        const row = document.createElement('div');
        row.className = 'final-score-row';
        row.innerHTML = `
            <span class="rank">#${i + 1}</span>
            <span class="name">${player.name}</span>
            <span class="score">${player.score} pts</span>
        `;
        elements.finalScores.appendChild(row);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start
document.addEventListener('DOMContentLoaded', init);
