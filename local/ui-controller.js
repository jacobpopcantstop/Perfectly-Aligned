/**
 * Perfectly Aligned - UI Controller
 * ==================================
 * Handles all DOM manipulation and UI updates.
 * Listens to GameLogic events and updates the view accordingly.
 *
 * @version 4.0.0
 * @license MIT
 */

import {
    game,
    AVATARS,
    ALIGNMENT_NAMES,
    ALIGNMENT_EXAMPLES,
    ALIGNMENT_GRID_ORDER,
    TOKEN_TYPES,
    TOKEN_TYPE_KEYS,
    DECK_METADATA,
    GAME_DEFAULTS,
    GAME_PHASES,
    getTotalTokenCount
} from './game-logic.js';

// =============================================================================
// DOM ELEMENT CACHE
// =============================================================================
const DOM = {};

function cacheElements() {
    // Screens
    DOM.setupScreen = document.getElementById('setupScreen');
    DOM.gameScreen = document.getElementById('gameScreen');

    // Setup elements
    DOM.playerCount = document.getElementById('playerCount');
    DOM.playerNamesContainer = document.getElementById('playerNamesContainer');
    DOM.targetScore = document.getElementById('targetScore');
    DOM.drawingTime = document.getElementById('drawingTime');
    DOM.deckOptions = document.querySelectorAll('.deck-option');

    // Game screen elements
    DOM.roundNumber = document.getElementById('roundNumber');
    DOM.scoreboard = document.getElementById('scoreboard');
    DOM.scoreboardList = document.getElementById('scoreboardList');
    DOM.scoreboardToggle = document.getElementById('scoreboardToggle');

    // Phase containers
    DOM.judgePhase = document.getElementById('judgePhase');
    DOM.rollAlignmentSection = document.getElementById('rollAlignmentSection');
    DOM.alignmentDisplay = document.getElementById('alignmentDisplay');
    DOM.alignmentGrid = document.getElementById('alignmentGrid');
    DOM.alignmentDescription = document.getElementById('alignmentDescription');
    DOM.judgeChoiceSection = document.getElementById('judgeChoiceSection');
    DOM.judgeChoiceGrid = document.getElementById('judgeChoiceGrid');
    DOM.drawPromptsButton = document.getElementById('drawPromptsButton');
    DOM.promptSelection = document.getElementById('promptSelection');
    DOM.promptsList = document.getElementById('promptsList');
    DOM.rerollButton = document.getElementById('rerollButton');
    DOM.currentJudgeName = document.getElementById('currentJudgeName');

    // Drawing phase
    DOM.drawingPhase = document.getElementById('drawingPhase');
    DOM.drawingAlignment = document.getElementById('drawingAlignment');
    DOM.drawingPrompt = document.getElementById('drawingPrompt');
    DOM.activeModifiersSection = document.getElementById('activeModifiersSection');
    DOM.activeModifiersList = document.getElementById('activeModifiersList');
    DOM.timerSection = document.getElementById('timerSection');
    DOM.timerDisplay = document.getElementById('timerDisplay');

    // Judging phase
    DOM.judgingPhase = document.getElementById('judgingPhase');
    DOM.judgingAlignment = document.getElementById('judgingAlignment');
    DOM.judgingPrompt = document.getElementById('judgingPrompt');
    DOM.judgingPlayerList = document.getElementById('judgingPlayerList');

    // Results phase
    DOM.resultsPhase = document.getElementById('resultsPhase');
    DOM.roundWinnerName = document.getElementById('roundWinnerName');
    DOM.tokenAwardList = document.getElementById('tokenAwardList');

    // Modifier phase
    DOM.modifierPhase = document.getElementById('modifierPhase');
    DOM.modifierQueue = document.getElementById('modifierQueue');

    // Game over
    DOM.gameOverPhase = document.getElementById('gameOverPhase');
    DOM.winnerName = document.getElementById('winnerName');
    DOM.finalScoreboard = document.getElementById('finalScoreboard');

    // Modals
    DOM.stealModal = document.getElementById('stealModal');
    DOM.stealTargetList = document.getElementById('stealTargetList');

    // Notifications
    DOM.notificationContainer = document.getElementById('notificationContainer');
}

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in ms before auto-dismiss
 */
export function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    DOM.notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
}

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {Function} onYes - Callback for Yes
 * @param {Function} onNo - Callback for No
 * @param {string} confirmKey - Key for "don't show again" storage
 */
export function showConfirm(message, onYes, onNo = null, confirmKey = null) {
    // Check if user has disabled this confirmation
    if (confirmKey && localStorage.getItem(`skipConfirm_${confirmKey}`) === 'true') {
        if (onYes) onYes();
        return;
    }

    const notification = document.createElement('div');
    notification.className = 'notification confirm';

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;

    const checkboxDiv = document.createElement('div');
    checkboxDiv.style.marginTop = '10px';
    checkboxDiv.style.fontSize = '0.9em';
    checkboxDiv.style.opacity = '0.8';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `dontShowAgain_${Date.now()}`;
    checkbox.style.marginRight = '8px';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = checkbox.id;
    checkboxLabel.textContent = "Don't show this again";
    checkboxLabel.style.cursor = 'pointer';

    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(checkboxLabel);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'notification-buttons';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'btn-yes';
    yesBtn.textContent = 'Yes';
    yesBtn.onclick = () => {
        if (confirmKey && checkbox.checked) {
            localStorage.setItem(`skipConfirm_${confirmKey}`, 'true');
        }
        notification.remove();
        if (onYes) onYes();
    };

    const noBtn = document.createElement('button');
    noBtn.className = 'btn-no';
    noBtn.textContent = 'No';
    noBtn.onclick = () => {
        if (confirmKey && checkbox.checked) {
            localStorage.setItem(`skipConfirm_${confirmKey}`, 'true');
        }
        notification.remove();
        if (onNo) onNo();
    };

    buttonsDiv.appendChild(yesBtn);
    buttonsDiv.appendChild(noBtn);

    notification.appendChild(messageDiv);
    if (confirmKey) {
        notification.appendChild(checkboxDiv);
    }
    notification.appendChild(buttonsDiv);
    DOM.notificationContainer.appendChild(notification);
}

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

function hideAllPhases() {
    const phases = [
        DOM.judgePhase,
        DOM.rollAlignmentSection,
        DOM.alignmentDisplay,
        DOM.promptSelection,
        DOM.drawingPhase,
        DOM.judgingPhase,
        DOM.resultsPhase,
        DOM.gameOverPhase,
        DOM.judgeChoiceSection,
        DOM.modifierPhase
    ];
    phases.forEach(el => el?.classList.add('hidden'));
}

function showScreen(screenId) {
    DOM.setupScreen.classList.remove('active');
    DOM.gameScreen.classList.remove('active');

    if (screenId === 'setup') {
        DOM.setupScreen.classList.add('active');
    } else if (screenId === 'game') {
        DOM.gameScreen.classList.add('active');
    }
}

// =============================================================================
// SETUP SCREEN
// =============================================================================

function updatePlayerNameInputs() {
    const count = parseInt(DOM.playerCount.value);

    if (count < GAME_DEFAULTS.minPlayers || count > GAME_DEFAULTS.maxPlayers || isNaN(count)) {
        showNotification(`Player count must be between ${GAME_DEFAULTS.minPlayers} and ${GAME_DEFAULTS.maxPlayers}!`, 'warning');
        DOM.playerCount.value = GAME_DEFAULTS.defaultPlayerCount;
        return;
    }

    DOM.playerNamesContainer.innerHTML = '<h2>Player Names:</h2>';

    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'player-setup-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.marginBottom = '10px';

        row.innerHTML = `
            <div class="avatar-selector" style="display: flex; align-items: center; gap: 5px;">
                <button class="avatar-nav" data-player="${i}" data-direction="-1" type="button">◀</button>
                <div class="avatar-display" id="avatar${i}">${AVATARS[i % AVATARS.length]}</div>
                <button class="avatar-nav" data-player="${i}" data-direction="1" type="button">▶</button>
            </div>
            <input type="text" placeholder="Player ${i + 1} Name" id="playerName${i}" maxlength="${GAME_DEFAULTS.maxNameLength}" style="flex: 1;">
        `;

        DOM.playerNamesContainer.appendChild(row);
    }

    // Add click handlers for avatar navigation
    DOM.playerNamesContainer.querySelectorAll('.avatar-nav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playerIndex = parseInt(e.target.dataset.player);
            const direction = parseInt(e.target.dataset.direction);
            cycleAvatar(playerIndex, direction);
        });
    });
}

function cycleAvatar(playerIndex, direction) {
    const avatarDisplay = document.getElementById(`avatar${playerIndex}`);
    const currentAvatar = avatarDisplay.textContent;
    const currentIndex = AVATARS.indexOf(currentAvatar);
    const newIndex = (currentIndex + direction + AVATARS.length) % AVATARS.length;
    avatarDisplay.textContent = AVATARS[newIndex];
}

function setupDeckSelection() {
    DOM.deckOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');
        });
    });
}

// =============================================================================
// SCOREBOARD
// =============================================================================

function updateScoreboard() {
    DOM.scoreboardList.innerHTML = '';

    const sortedPlayers = game.getSortedPlayers();

    sortedPlayers.forEach(({ player, index, tokenCount }) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        if (index === game.currentJudgeIndex) {
            card.classList.add('judge');
        }

        let stealButton = '';
        if (game.canPlayerSteal(index)) {
            stealButton = `<button class="button secondary steal-button" data-player="${index}">💰 Steal Point (3 tokens)</button>`;
        }

        let modifierDisplay = '';
        if (player.activeModifiers && player.activeModifiers.length > 0) {
            modifierDisplay = player.activeModifiers.map(mod => `
                <div style="margin-top: 8px; padding: 6px; background: rgba(255, 20, 147, 0.3); border: 2px solid #FF1493; border-radius: 8px;">
                    <div style="font-size: 1.5em;">${mod.icon} CURSED!</div>
                    <div style="font-size: 0.9em; font-style: italic;">${mod.name}</div>
                </div>
            `).join('');
        }

        card.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${player.avatar || '🎨'}</div>
            <h3>${player.name} ${index === game.currentJudgeIndex ? '👨‍⚖️' : ''}</h3>
            <div class="player-score">${player.score} pts</div>
            <div class="token-count">🎭 ${tokenCount} tokens</div>
            ${modifierDisplay}
            ${stealButton}
        `;

        DOM.scoreboardList.appendChild(card);
    });

    // Add steal button handlers
    DOM.scoreboardList.querySelectorAll('.steal-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playerIndex = parseInt(e.target.dataset.player);
            openStealModal(playerIndex);
        });
    });
}

function toggleScoreboard() {
    DOM.scoreboard.classList.toggle('collapsed');
    DOM.scoreboardToggle.textContent = DOM.scoreboard.classList.contains('collapsed') ? '▶' : '▼';
}

// =============================================================================
// JUDGE PHASE
// =============================================================================

function showJudgePhase() {
    hideAllPhases();
    DOM.judgePhase.classList.remove('hidden');
    DOM.rollAlignmentSection.classList.remove('hidden');

    const judge = game.currentJudge;
    DOM.currentJudgeName.innerHTML = `${judge.avatar || '🎨'} ${judge.name}`;
}

function renderAlignmentGrid(containerId, selectedAlignment = null, isClickable = false, onSelect = null) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';
    grid.classList.remove('judges-choice');

    ALIGNMENT_GRID_ORDER.forEach(alignment => {
        const cell = document.createElement('div');
        cell.className = 'alignment-cell' + (isClickable ? '' : ' disabled');
        cell.innerHTML = `<strong>${ALIGNMENT_NAMES[alignment]}</strong>`;
        if (isClickable) {
            cell.innerHTML += `<br><small>${ALIGNMENT_EXAMPLES[alignment]}</small>`;
        }

        if (alignment === selectedAlignment) {
            cell.classList.add('selected');
        }

        if (isClickable && onSelect) {
            cell.onclick = () => onSelect(alignment, cell);
        }

        grid.appendChild(cell);
    });

    return grid;
}

function animateAlignmentRoll(finalAlignment) {
    return new Promise((resolve) => {
        const grid = DOM.alignmentGrid;
        const cells = grid.querySelectorAll('.alignment-cell');

        let rollCount = 0;
        const maxRolls = 25;

        const rollInterval = setInterval(() => {
            cells.forEach(cell => cell.classList.remove('rolling'));

            // Light up 2-4 random cells for dramatic effect
            const numCells = 2 + Math.floor(Math.random() * 3);
            const litCells = new Set();

            while (litCells.size < numCells && litCells.size < cells.length) {
                litCells.add(Math.floor(Math.random() * cells.length));
            }

            litCells.forEach(index => cells[index].classList.add('rolling'));

            rollCount++;
            if (rollCount >= maxRolls) {
                clearInterval(rollInterval);

                // Final reveal
                cells.forEach(cell => cell.classList.remove('rolling'));

                if (finalAlignment !== 'U') {
                    const finalIndex = ALIGNMENT_GRID_ORDER.indexOf(finalAlignment);
                    if (finalIndex >= 0) {
                        cells[finalIndex].classList.add('selected');
                    }
                } else {
                    grid.classList.add('judges-choice');
                }

                resolve();
            }
        }, 100);
    });
}

function showJudgeChoiceSelection() {
    DOM.judgeChoiceSection.classList.remove('hidden');
    DOM.drawPromptsButton.disabled = true;
    DOM.drawPromptsButton.textContent = '⏸️ Select an alignment first';

    renderAlignmentGrid('judgeChoiceGrid', null, true, (alignment, cell) => {
        const result = game.selectJudgeAlignment(alignment);
        if (result.success) {
            // Highlight selection
            DOM.judgeChoiceGrid.querySelectorAll('.alignment-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');

            // Remove main grid glow
            DOM.alignmentGrid.classList.remove('judges-choice');

            // Update description
            DOM.alignmentDescription.innerHTML = `
                <h3>Judge's Choice: ${result.name}</h3>
                <p>Examples: ${result.examples}</p>
            `;

            // Enable draw prompts
            DOM.drawPromptsButton.disabled = false;
            DOM.drawPromptsButton.textContent = '📝 Draw 3 Prompts';
        }
    });
}

// =============================================================================
// PROMPT PHASE
// =============================================================================

function displayPrompts(prompts) {
    DOM.promptsList.innerHTML = '';

    prompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card dealing';
        card.style.animationDelay = `${index * 0.2}s`;
        card.innerHTML = `<p>${prompt}</p>`;
        card.onclick = () => {
            const result = game.selectPrompt(prompt);
            if (result.success) {
                // Visual feedback
                DOM.promptsList.querySelectorAll('.prompt-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            }
        };
        DOM.promptsList.appendChild(card);

        // Remove dealing animation after it completes
        setTimeout(() => card.classList.remove('dealing'), 800 + (index * 200));
    });
}

function updateRerollButton() {
    const canReroll = game.canJudgeReroll();
    const judge = game.currentJudge;
    const tokenCount = getTotalTokenCount(judge.tokens);

    DOM.rerollButton.disabled = !canReroll;
    DOM.rerollButton.textContent = `🔄 Spend 1 Token to Re-roll Prompts (You have ${tokenCount})`;
}

// =============================================================================
// DRAWING PHASE
// =============================================================================

let timerInterval = null;

function showDrawingPhase(data) {
    hideAllPhases();
    DOM.drawingPhase.classList.remove('hidden');

    DOM.drawingAlignment.textContent = data.alignmentName;
    DOM.drawingPrompt.textContent = data.prompt;

    // Display cursed players
    const cursedPlayers = game.getCursedPlayers();
    if (cursedPlayers.length > 0) {
        DOM.activeModifiersSection.classList.remove('hidden');
        DOM.activeModifiersList.innerHTML = '';

        cursedPlayers.forEach(({ player }) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            card.style.borderColor = '#FF1493';
            card.style.boxShadow = '0 0 25px rgba(255, 20, 147, 0.8)';

            const cursesHtml = player.activeModifiers.map(mod => `
                <div style="margin-top: 15px; padding: 10px; background: rgba(255, 20, 147, 0.3); border: 2px solid #FF1493; border-radius: 10px;">
                    <div style="font-size: 2.5em; margin-bottom: 8px;">${mod.icon}</div>
                    <div style="font-size: 1.3em; font-weight: bold; color: #FFD700; margin-bottom: 8px;">${mod.name}</div>
                    <div style="font-size: 1em; color: #FFB6C1; font-style: italic;">${mod.description}</div>
                </div>
            `).join('');

            card.innerHTML = `
                <div style="font-size: 2.5em; margin-bottom: 10px;">${player.avatar || '🎨'}</div>
                <h3>${player.name}</h3>
                ${cursesHtml}
            `;

            DOM.activeModifiersList.appendChild(card);
        });
    } else {
        DOM.activeModifiersSection.classList.add('hidden');
    }

    // Start timer
    if (data.drawingTime > 0) {
        DOM.timerSection.style.display = 'block';
        startTimer();
    } else {
        DOM.timerSection.style.display = 'none';
    }
}

function startTimer() {
    DOM.timerDisplay.textContent = game.timerSeconds;
    DOM.timerDisplay.classList.remove('warning');

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const { seconds, isWarning, isExpired } = game.tickTimer();

        DOM.timerDisplay.textContent = seconds;

        if (isWarning) {
            DOM.timerDisplay.classList.add('warning');
        }

        if (isExpired) {
            clearInterval(timerInterval);
            showNotification("⏰ Time's up! Everyone pencils down!", 'warning', 3000);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// =============================================================================
// JUDGING PHASE
// =============================================================================

function showJudgingPhase(data) {
    hideAllPhases();
    DOM.judgingPhase.classList.remove('hidden');

    DOM.judgingAlignment.textContent = data.alignmentName;
    DOM.judgingPrompt.textContent = data.prompt;

    DOM.judgingPlayerList.innerHTML = '';

    data.contestants.forEach(({ player, index }) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.onclick = () => {
            showConfirm(`Select ${player.name} as the winner?`, () => {
                // Highlight selected
                DOM.judgingPlayerList.querySelectorAll('.player-card').forEach(c => c.classList.remove('selected-winner'));
                card.classList.add('selected-winner');

                setTimeout(() => game.selectWinner(index), 500);
            }, null, 'selectWinner');
        };

        card.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${player.avatar || '🎨'}</div>
            <h3>${player.name}</h3>
            <p style="font-size: 1.2em; margin-top: 10px;">📝 Click to select</p>
        `;

        DOM.judgingPlayerList.appendChild(card);
    });
}

// =============================================================================
// RESULTS PHASE
// =============================================================================

function showResultsPhase(winner) {
    hideAllPhases();
    DOM.resultsPhase.classList.remove('hidden');

    DOM.roundWinnerName.innerHTML = `${winner.avatar || '🎨'} ${winner.name}`;

    // Build token award section
    DOM.tokenAwardList.innerHTML = '';

    game.players.forEach((player, index) => {
        if (index === game.currentJudgeIndex) return; // Skip judge

        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.style.marginBottom = '15px';

        let tokensHtml = '<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
        TOKEN_TYPE_KEYS.forEach(tokenKey => {
            const token = TOKEN_TYPES[tokenKey];
            tokensHtml += `
                <div class="token-button" id="token-${index}-${tokenKey}">
                    <button class="button" style="padding: 8px 12px; font-size: 0.9em;"
                        data-player="${index}" data-token="${tokenKey}">
                        ${token.icon} ${token.name}
                    </button>
                    <span class="tooltip">${token.description}</span>
                </div>
            `;
        });
        tokensHtml += '</div>';

        playerCard.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${player.avatar || '🎨'}</div>
            <h3>${player.name}</h3>
            ${tokensHtml}
        `;

        DOM.tokenAwardList.appendChild(playerCard);
    });

    // Add token button handlers
    DOM.tokenAwardList.querySelectorAll('.token-button button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playerIndex = parseInt(e.target.dataset.player);
            const tokenType = e.target.dataset.token;
            handleTokenAward(playerIndex, tokenType);
        });
    });
}

function handleTokenAward(playerIndex, tokenType) {
    const result = game.awardToken(playerIndex, tokenType);

    if (!result.success) {
        showNotification(result.error, 'warning');
        return;
    }

    // Visual feedback - mark winner's button green, others grey
    game.players.forEach((player, index) => {
        if (index === game.currentJudgeIndex) return;

        const tokenButton = document.getElementById(`token-${index}-${tokenType}`);
        if (tokenButton) {
            if (index === playerIndex) {
                tokenButton.classList.add('awarded');
            } else {
                tokenButton.classList.add('unavailable');
            }
            const btn = tokenButton.querySelector('button');
            if (btn) btn.disabled = true;
        }
    });

    const player = result.player;
    showNotification(
        `${player.avatar || '🎨'} ${player.name} received ${result.token.icon} ${result.token.name}!`,
        'success',
        3000
    );

    updateScoreboard();
}

// =============================================================================
// STEAL MODAL
// =============================================================================

function openStealModal(playerIndex) {
    if (!game.canPlayerSteal(playerIndex)) {
        showNotification('Not enough tokens! You need 3 tokens to steal a point.', 'warning');
        return;
    }

    DOM.stealTargetList.innerHTML = '<h3>Select a player to steal from:</h3>';

    const targets = game.getStealTargets(playerIndex);

    targets.forEach(({ player: target, index: targetIndex }) => {
        const btn = document.createElement('button');
        btn.className = 'button';
        btn.style.width = '100%';
        btn.style.margin = '10px 0';
        btn.textContent = `${target.name} (${target.score} points)`;
        btn.onclick = () => executeSteal(playerIndex, targetIndex);
        DOM.stealTargetList.appendChild(btn);
    });

    DOM.stealModal.classList.remove('hidden');
}

function closeStealModal() {
    DOM.stealModal.classList.add('hidden');
}

function executeSteal(fromPlayerIndex, toPlayerIndex) {
    const stealer = game.players[fromPlayerIndex];
    const victim = game.players[toPlayerIndex];

    showConfirm(
        `${stealer.name} will spend 3 tokens to steal 1 point from ${victim.name}. Proceed?`,
        () => {
            const result = game.executeSteal(fromPlayerIndex, toPlayerIndex);
            if (result.success) {
                showNotification(`💰 ${result.stealer.name} stole 1 point from ${result.victim.name}!`, 'success', 3000);
                closeStealModal();
                updateScoreboard();

                if (result.isGameOver) {
                    setTimeout(() => showGameOver(), 1000);
                }
            } else {
                showNotification(result.error, 'warning');
            }
        },
        null,
        'stealPoint'
    );
}

// =============================================================================
// MODIFIER PHASE
// =============================================================================

function showModifierPhase(curserData) {
    hideAllPhases();
    DOM.modifierPhase.classList.remove('hidden');

    const { curser, curserIndex, hasHeldCurse, heldCurse } = curserData;

    if (hasHeldCurse && heldCurse) {
        // Show held curse options
        DOM.modifierQueue.innerHTML = `
            <div class="center">
                <h2 style="color: #FF1493; margin: 20px 0;">
                    😈 ${curser.avatar} ${curser.name} - You're in Last Place!
                </h2>
                <p style="font-size: 1.3em; margin-bottom: 30px;">You have a held curse from last round!</p>

                <div class="modifier-card" style="animation: curse-draw 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;">
                    <div style="font-size: 4em; margin-bottom: 15px;">${heldCurse.icon}</div>
                    <h3 style="font-size: 2em; color: #FFD700; margin-bottom: 15px;">${heldCurse.name}</h3>
                    <p style="font-size: 1.3em; color: #FFB6C1; line-height: 1.5;">${heldCurse.description}</p>
                </div>

                <div class="center" style="margin-top: 30px;">
                    <button class="button large" id="useHeldCurseBtn" style="margin: 10px;">
                        ⚡ Use This Curse
                    </button>
                    <button class="button large secondary" id="drawNewCurseBtn" style="margin: 10px;">
                        🎴 Draw New Curse (Discard This)
                    </button>
                </div>
            </div>
        `;

        document.getElementById('useHeldCurseBtn').onclick = () => handleUseHeldCurse(curserIndex);
        document.getElementById('drawNewCurseBtn').onclick = () => handleDrawCurse(curserIndex, true);
    } else {
        // Show draw curse button
        DOM.modifierQueue.innerHTML = `
            <div class="center">
                <h2 style="color: #FF1493; margin: 20px 0;">
                    😈 ${curser.avatar} ${curser.name} - You're in Last Place!
                </h2>
                <p style="font-size: 1.3em; margin-bottom: 30px;">You get to draw a curse card!</p>

                <div class="center">
                    <button class="button large" id="drawCurseBtn" style="font-size: 1.5em; padding: 25px 40px;">
                        🎴 DRAW CURSE CARD
                    </button>
                </div>
            </div>
        `;

        document.getElementById('drawCurseBtn').onclick = () => handleDrawCurse(curserIndex, false);
    }
}

function handleDrawCurse(curserIndex, replacingHeld) {
    const { modifier, targets } = game.drawCurseCard(curserIndex, replacingHeld);
    const curser = game.players[curserIndex];

    DOM.modifierQueue.innerHTML = `
        <div class="center">
            <h2 style="color: #FFB6C1; margin: 20px 0;">
                ${curser.avatar} ${curser.name} draws...
            </h2>

            <div class="modifier-card" style="animation: curse-draw 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;">
                <div style="font-size: 4em; margin-bottom: 15px;">${modifier.icon}</div>
                <h3 style="font-size: 2em; color: #FFD700; margin-bottom: 15px;">${modifier.name}</h3>
                <p style="font-size: 1.3em; color: #FFB6C1; line-height: 1.5;">${modifier.description}</p>
            </div>

            <h3 style="margin-top: 40px; margin-bottom: 20px; color: #FF1493;">Who do you curse?</h3>
            <div class="player-list" id="curseTargetList"></div>

            <div class="center" style="margin-top: 30px;">
                <button class="button secondary" id="holdCurseBtn" style="font-size: 1.1em;">
                    💾 Hold for Next Round
                </button>
            </div>
        </div>
    `;

    renderCurseTargets(curserIndex, targets);
    document.getElementById('holdCurseBtn').onclick = () => handleHoldCurse(curserIndex);
}

function handleUseHeldCurse(curserIndex) {
    const result = game.useHeldCurse(curserIndex);
    if (!result.success) {
        showNotification(result.error, 'warning');
        return;
    }

    const curser = game.players[curserIndex];
    const { modifier, targets } = result;

    DOM.modifierQueue.innerHTML = `
        <div class="center">
            <h2 style="color: #FFB6C1; margin: 20px 0;">
                ${curser.avatar} ${curser.name} uses held curse!
            </h2>

            <div class="modifier-card">
                <div style="font-size: 4em; margin-bottom: 15px;">${modifier.icon}</div>
                <h3 style="font-size: 2em; color: #FFD700; margin-bottom: 15px;">${modifier.name}</h3>
                <p style="font-size: 1.3em; color: #FFB6C1; line-height: 1.5;">${modifier.description}</p>
            </div>

            <h3 style="margin-top: 40px; margin-bottom: 20px; color: #FF1493;">Who do you curse?</h3>
            <div class="player-list" id="curseTargetList"></div>
        </div>
    `;

    renderCurseTargets(curserIndex, targets);
}

function renderCurseTargets(curserIndex, targets) {
    const targetList = document.getElementById('curseTargetList');
    targetList.innerHTML = '';

    targets.forEach(({ player: target, index: targetIndex }) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.cursor = 'pointer';
        card.onclick = () => {
            const result = game.applyCurse(curserIndex, targetIndex);
            if (result.success) {
                showNotification(`${target.name} has been cursed with ${result.modifier.name}!`, 'success', 3000);
                setTimeout(() => game.nextRound(), 1500);
            }
        };

        card.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${target.avatar || '🎨'}</div>
            <h3>${target.name}</h3>
            <div class="player-score">${target.score} pts</div>
        `;

        targetList.appendChild(card);
    });
}

function handleHoldCurse(curserIndex) {
    const curser = game.players[curserIndex];
    game.holdCurse(curserIndex);

    showNotification(`${curser.name} holds the curse for next round!`, 'info', 3000);
    setTimeout(() => game.nextRound(), 1500);
}

// =============================================================================
// GAME OVER
// =============================================================================

function showGameOver() {
    hideAllPhases();
    DOM.gameOverPhase.classList.remove('hidden');

    const results = game.getFinalResults();

    DOM.winnerName.innerHTML = `${results.winner.avatar || '🎨'} ${results.winner.name}`;

    DOM.finalScoreboard.innerHTML = '<h2 style="margin-top: 30px;">Final Scores:</h2>';

    results.standings.forEach(({ player, rank, medal, tokenCount }) => {
        const rankDisplay = medal || `${rank}.`;
        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.marginBottom = '10px';

        card.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 10px;">${player.avatar || '🎨'}</div>
            <h2>${rankDisplay} ${player.name}</h2>
            <div class="player-score">${player.score} points</div>
            <div>🎭 ${tokenCount} tokens earned</div>
        `;

        DOM.finalScoreboard.appendChild(card);
    });
}

// =============================================================================
// GAME EVENT HANDLERS
// =============================================================================

function setupGameEventListeners() {
    // Round started
    game.on('roundStarted', (data) => {
        DOM.roundNumber.textContent = data.roundNumber;
        updateScoreboard();
        showJudgePhase();
    });

    // Alignment rolled
    game.on('alignmentRolled', async (data) => {
        DOM.rollAlignmentSection.classList.add('hidden');
        DOM.alignmentDisplay.classList.remove('hidden');

        renderAlignmentGrid('alignmentGrid');
        await animateAlignmentRoll(data.alignment);

        DOM.alignmentDescription.innerHTML = `
            <h3>${data.name}</h3>
            <p>Examples: ${data.examples}</p>
        `;

        if (data.isJudgeChoice) {
            showJudgeChoiceSelection();
        }
    });

    // Prompts drawn
    game.on('promptsDrawn', (data) => {
        DOM.alignmentDisplay.classList.add('hidden');
        DOM.promptSelection.classList.remove('hidden');
        displayPrompts(data.prompts);
        updateRerollButton();
    });

    // Prompt selected -> Drawing phase
    game.on('promptSelected', (data) => {
        hideAllPhases();
        showDrawingPhase(data);
    });

    // Judging started
    game.on('judgingStarted', (data) => {
        stopTimer();
        showJudgingPhase(data);
    });

    // Winner selected
    game.on('winnerSelected', (data) => {
        showNotification(`${data.winner.name} wins this round! 🎉`, 'success', 3000);

        if (data.isGameOver) {
            setTimeout(() => showGameOver(), 500);
        } else {
            setTimeout(() => showResultsPhase(data.winner), 500);
        }
    });

    // Token awarded
    game.on('tokenAwarded', () => {
        updateScoreboard();
    });

    // Modifier phase started
    game.on('modifierPhaseStarted', (data) => {
        showModifierPhase(data);
    });

    // Next round
    game.on('nextRound', () => {
        // Handled by roundStarted event
    });
}

// =============================================================================
// GLOBAL ACTION HANDLERS (Called from HTML onclick)
// =============================================================================

// Make these available globally for HTML onclick handlers
window.startGame = function() {
    const count = parseInt(DOM.playerCount.value);

    if (count < GAME_DEFAULTS.minPlayers || count > GAME_DEFAULTS.maxPlayers || isNaN(count)) {
        showNotification('Please enter a valid player count (3-8)!', 'warning');
        return;
    }

    // Collect player data
    const players = [];
    for (let i = 0; i < count; i++) {
        const nameInput = document.getElementById(`playerName${i}`);
        const avatarDisplay = document.getElementById(`avatar${i}`);

        players.push({
            name: nameInput ? nameInput.value.trim() : `Player ${i + 1}`,
            avatar: avatarDisplay ? avatarDisplay.textContent : AVATARS[i % AVATARS.length]
        });
    }

    // Collect selected decks
    const selectedDecks = [];
    DOM.deckOptions.forEach(option => {
        if (option.classList.contains('selected')) {
            selectedDecks.push(option.dataset.deck);
        }
    });

    if (selectedDecks.length === 0) {
        showNotification('Please select at least one deck!', 'warning');
        return;
    }

    // Get settings
    const targetScore = parseInt(DOM.targetScore.value);
    const drawingTime = parseInt(DOM.drawingTime.value);

    // Initialize game
    const result = game.initializeGame({
        players,
        decks: selectedDecks,
        targetScore,
        drawingTime,
        modifiersEnabled: true
    });

    if (!result.success) {
        showNotification(result.error, 'warning');
        return;
    }

    // Switch to game screen and start
    showScreen('game');
    game.startNewRound();
};

window.rollAlignment = function() {
    game.rollAlignment();
};

window.drawPrompts = function() {
    const result = game.drawPrompts();
    if (!result.success) {
        showNotification(result.error, 'warning');
    }
};

window.spendTokenForReroll = function() {
    showConfirm('Spend 1 token to draw 3 new prompts?', () => {
        const result = game.rerollPrompts();
        if (result.success) {
            showNotification('New prompts drawn!', 'success');
            updateScoreboard();
        } else {
            showNotification(result.error, 'warning');
        }
    }, null, 'rerollPrompts');
};

window.finishDrawing = function() {
    stopTimer();

    if (game.drawingTimeSeconds > 0 && game.timerSeconds > 0) {
        showConfirm(
            "There's still time left! Are you sure everyone is done drawing?",
            () => game.startJudgingPhase(),
            () => startTimer(),
            'finishEarly'
        );
        return;
    }

    game.startJudgingPhase();
};

window.checkForModifierPhase = function() {
    const result = game.checkForModifierPhase();
    if (!result.shouldShowModifier) {
        game.nextRound();
    }
};

window.toggleScoreboard = toggleScoreboard;
window.closeStealModal = closeStealModal;

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initUI() {
    cacheElements();
    setupDeckSelection();
    setupGameEventListeners();
    updatePlayerNameInputs();

    // Setup player count change listener
    DOM.playerCount.addEventListener('change', updatePlayerNameInputs);

    // Setup scoreboard toggle
    document.querySelector('#scoreboard h2')?.addEventListener('click', toggleScoreboard);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
