// Game Constants
const THEMED_DECKS = {
    core_white: [
        "Ways to react to finding a wallet", "Ways to impress your partner's parents", "Ways to respond to a customer complaint",
        "Ways to decide what movie to watch", "Ways to cope with being stuck in traffic", "Ways to react to receiving a terrible gift",
        "Ways to handle a power outage", "Ways to react to your pet talking", "Ways to explore a secret passage",
        "Ways to run for local office", "Ways to give back to the community", "Types of home workouts", "Ways to beat the heat",
        "Ways to bond with your child", "Ways to get a baby to sleep", "Ways to get Stronger",
        "Ways to get that Beach Bod", "Ways to lose weight", "Ways to make C-Span more entertaining",
        "Ways to solve world hunger", "Types of Life Hacks", "Types of ideal living situations", "Ways to put on pants",
        "Types of roommate etiquette rules", "Ways to react to a roommate leaving dirty dishes", "Ways to sit",
        "Types of sleeping positions", "Ways to use a toilet", "Ways to wash your hands", "Types of water sports",
        "Ways to die", "Ways to dispose of garbage", "Ways to dump someone", "Ways to kiss someone",
        "Ways to listen to music", "Ways to propose", "Ways to rebel against authority",
        "Ways to use a 30-acre family estate you inherited",
        "Types of Phobias", "Types of excuses for being late", "Ways to stay motivated", "Types of bad habits",
        "Ways to impress your boss", "Types of last words", "Ways to manage time", "Ways to organize your home",
        "Types of negotiation strategies", "Ways to manage anger", "Ways to relax after a stressful day",
        "Types of love languages", "Ways to relieve stress", "Ways to make a first impression", "Types of travel experiences",
        "Ways to be environmentally conscious", "Ways to make new friends", "Types of fashion styles",
        "Reasons to go vegan", "Ways to survive the zombie apocalypse", "Ways to quit your 9-5 job",
        "Ways to act at a high school reunion", "Ways to handle being Freaky Friday'd", "Ways to describe a near-death experience",
        "Ways to attract someone out of your league", "Ways to make Ravioli", "Types of plants", "Types of animals",
        "Types of Sports", "Ways to eat a banana", "Types of Music Genres", "Types of get-rich-quick schemes",
        "Ways to handle a minor fender-bender you caused", "Ways to react to a friend's bad haircut",
        "Ways to react to getting extra change from a cashier", "Ways to share snacks at work/school",
        "Ways to react to seeing someone shoplift essentials",
        "Ways to respond to an unethical request from your boss", "Ways to cheat on a test",
        "Ways to defend yourself", "Ways to end conflict with a spider", "Types of killing methods",
        "Reasons for not eating something", "Ways to respond to 'You're not a cop, right?'",
        "Ways to react to getting life in prison for a crime you didn't commit", "Types of Trolley Problem solutions",
        "Ways to advise a historical leader", "Ways to react to witnessing a major historical event",
        "Ways to handle inventing something before its time", "Ways to react during the Y2K panic",
        "Types of prehistoric activities", "Types of ancient building techniques", "Types of world leaders", "Types of presidents"
    ],
    creative_cyan: [
        "Types of children's toys", "Types of fruit", "Types of themed weddings", "Types of hats", "Types of cars", "Types of school functions",
        "Types of pets", "Types of inter-species hybrids", "Types of nicknames for a daughter", "Types of pirate accessories",
        "Types of vanity plates", "Types of imaginary friends", "Types of animals", "Types of things to steal from a house",
        "Types of things to order at a coffee shop", "Types of kids on the School Bus", "Types of monsters",
        "Types of fictional professions", "Types of aquatic vehicles", "Ways to combine a taco, burger, and pizza", "Ways to eat a hotdog",
        "Types of facial hair", "Types of shoes", "Types of holiday traditions", "Types of unlikely explosives",
        "Types of things you can get in a can", "Types of Masks", "Types of kitchen utensils", "Types of anxiety dreams",
        "Types of nicknames for the sea", "Types of college electives", "Types of dietary restrictions",
        "Ways to hide things on your person discretely", "Types of personal usernames", "Types of epitaphs for tombstones",
        "Types of superpowers", "Types of synonyms for 'Yes'", "Types of donuts", "Types of world records to break",
        "Types of instruments of torture", "Types of euphemisms for death", "Types of childhood snacks", "Types of cryptids",
        "Types of things in space", "Types of clouds", "Types of alcoholic beverages", "Types of artistic mediums",
        "Types of educational strategies", "Types of book genres", "Types of Hot Drinks", "Types of nicknames for sons",
        "Ways to direct the next big superhero movie", "Ways to win a reality TV show", "Ways to become a viral internet meme",
        "Ways to act at the Met Gala", "Ways to write the finale of a beloved TV series", "Types of Cereal Mascots",
        "Responses to 'Name a more iconic duo'", "Dishes to prepare for Gordon Ramsay",
        "Things that could be in the box (Seven)"
    ],
    hypothetical_magenta: [
        "Ways to bring someone back from the dead", "Ways to approach an alien race", "Ways to be a wingman",
        "Ways to end malaria", "Ways to end the world",
        "Ways to pick someone up (romantically)", "Ways to reveal your child's gender",
        "Ways to stop a bank robbery", "Ways to tame a wild animal",
        "Ways to survive falling into the chimpanzee enclosure", "Ways to use a time machine",
        "First actions after waking from a 10-year coma",
        "Things a billionaire might leave their wealth to",
        "Ways to explain pet death to a child",
        "First things to enlarge with an Embiggening Ray",
        "Ways to respond to 'Spare some change?'",
        "Things hidden in Area 51's newest wing",
        "First things to shrink with a Shrink Ray",
        "Ways to answer 'What is your greatest strength?'",
        "Reasons to call off a wedding",
        "Advice to give if you became the richest person in the world",
        "Excuses for carrying a heavy, suspicious sack",
        "Ways to handle taking two dates to prom",
        "Ways to react when surrounded by police",
        "Ways to react to someone breaking into your car",
        "Ways to answer 'Do you know why I pulled you over?'",
        "First actions as the last person on Earth",
        "Ways to use an antigravity device", "Ways to use an invisibility cloak", "Ways to use teleportation",
        "Ways to deal with having a doppelgänger", "Ways to cope with being turned into a snail",
        "Ways to use mind-reading abilities", "Ways to use shapeshifting abilities",
        "Ways to react to having two weeks to live",
        "Ways to respond to your mechanic about replacing an air filter",
        "Ways to react to your spouse having amnesia",
        "Ways to respond to being asked to throw a match",
        "Reasons to object to a wedding union",
        "Ways to deal with an imminent city-destroying bomb",
        "Types of billionaires",
        "Ways to explain where babies come from",
        "Ways to answer 'What is your greatest weakness?'",
        "Things to order at a restaurant",
        "Excuses for where you were last night",
        "Ways to handle a morally gray scenario (17+)", "Ways to handle an awkward romantic encounter (17+)",
        "Ways to deal with a controversial social issue (17+)", "Types of 'Yo Mama' insults",
        "Types of tattoos and where to put them", "Types of drugs", "Types of adult content categories",
        "Ways to respond to 'Stepbrother! I'm stuck in the dryer!'",
        "Ways to react to your SO leaving you for someone else",
        "Ways to answer 'Does this outfit make me look ugly?'"
    ]
};

const ALIGNMENTS = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE', 'U'];

const ALIGNMENT_NAMES = {
    LG: "Lawful Good", NG: "Neutral Good", CG: "Chaotic Good",
    LN: "Lawful Neutral", TN: "True Neutral", CN: "Chaotic Neutral",
    LE: "Lawful Evil", NE: "Neutral Evil", CE: "Chaotic Evil",
    U: "Judge's Choice"
};

const ALIGNMENT_EXAMPLES = {
    LG: "Superman, Captain America, Brienne of Tarth",
    NG: "Spider-Man, Wonder Woman, Luke Skywalker",
    CG: "Robin Hood, Han Solo, The Doctor",
    LN: "Judge Dredd, James Bond, A typical soldier",
    TN: "The Watcher, Tom Bombadil, Druids",
    CN: "Jack Sparrow, Deadpool, Loki",
    LE: "Darth Vader, Dolores Umbridge, A corrupt politician",
    NE: "Lord Voldemort, Sauron, A self-serving mercenary",
    CE: "The Joker, Cthulhu, Carnage",
    U: "The Judge picks any alignment!"
};

const TOKEN_TYPES = {
    mindReader: "Mind Reader",
    technicalMerit: "Technical Merit",
    perfectAlignment: "Perfect Alignment",
    plotTwist: "Plot Twist"
};

// Game State
let gameState = {
    players: [],
    currentJudgeIndex: 0,
    selectedDecks: ['core_white'],
    promptPool: [],
    currentAlignment: null,
    rolledAlignment: null,
    currentPrompts: [],
    selectedPrompt: null,
    targetScore: 3,
    roundWinner: null,
    roundNumber: 1,
    drawingTimeSeconds: 90,
    timerSeconds: 90,
    timerInterval: null,
    anonymousMode: false
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updatePlayerNameInputs();
});

function setupEventListeners() {
    const playerCountInput = document.getElementById('playerCount');
    playerCountInput.addEventListener('change', updatePlayerNameInputs);

    // Deck selection
    document.querySelectorAll('.deck-option').forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');
        });
    });
}

function updatePlayerNameInputs() {
    const count = parseInt(document.getElementById('playerCount').value);

    if (count < 3 || count > 8 || isNaN(count)) {
        alert('Player count must be between 3 and 8!');
        document.getElementById('playerCount').value = 4;
        return;
    }

    const container = document.getElementById('playerNamesContainer');
    container.innerHTML = '<h2>Player Names:</h2>';

    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Player ${i + 1} Name`;
        input.id = `playerName${i}`;
        input.maxLength = 20;
        container.appendChild(input);
    }
}

function startGame() {
    const count = parseInt(document.getElementById('playerCount').value);

    if (count < 3 || count > 8 || isNaN(count)) {
        alert('Please enter a valid player count (3-8)!');
        return;
    }

    // Collect player names
    gameState.players = [];
    for (let i = 0; i < count; i++) {
        let name = document.getElementById(`playerName${i}`).value.trim();
        name = name.replace(/[<>]/g, '');
        if (!name) name = `Player ${i + 1}`;
        if (name.length > 20) name = name.substring(0, 20);

        gameState.players.push({
            name: name,
            score: 0,
            tokens: {
                mindReader: 0,
                technicalMerit: 0,
                perfectAlignment: 0,
                plotTwist: 0
            }
        });
    }

    // Collect selected decks
    gameState.selectedDecks = [];
    document.querySelectorAll('.deck-option.selected').forEach(option => {
        gameState.selectedDecks.push(option.dataset.deck);
    });

    if (gameState.selectedDecks.length === 0) {
        alert('Please select at least one deck!');
        return;
    }

    // Build prompt pool
    gameState.promptPool = [];
    gameState.selectedDecks.forEach(deckKey => {
        gameState.promptPool = gameState.promptPool.concat(THEMED_DECKS[deckKey]);
    });

    gameState.promptPool = shuffleArray(gameState.promptPool);

    // Get settings
    gameState.targetScore = parseInt(document.getElementById('targetScore').value);
    gameState.drawingTimeSeconds = parseInt(document.getElementById('drawingTime').value);
    gameState.anonymousMode = document.getElementById('anonymousMode').checked;

    // Switch to game screen
    document.getElementById('setupScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    startNewRound();
}

function startNewRound() {
    gameState.roundWinner = null;
    gameState.currentAlignment = null;
    gameState.rolledAlignment = null;

    document.getElementById('roundNumber').textContent = gameState.roundNumber;
    updateScoreboard();
    showJudgePhase();
}

function updateScoreboard() {
    const scoreboardList = document.getElementById('scoreboardList');
    scoreboardList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        if (index === gameState.currentJudgeIndex) {
            card.classList.add('judge');
        }

        const tokenCount = Object.values(player.tokens).reduce((a, b) => a + b, 0);

        let stealButton = '';
        if (tokenCount >= 3 && index !== gameState.currentJudgeIndex) {
            stealButton = `<button class="button secondary steal-button" onclick="openStealModal(${index})">💰 Steal Point (3 tokens)</button>`;
        }

        card.innerHTML = `
            <h3>${player.name} ${index === gameState.currentJudgeIndex ? '👨‍⚖️' : ''}</h3>
            <div class="player-score">${player.score} pts</div>
            <div class="token-count">🎭 ${tokenCount} tokens</div>
            ${stealButton}
        `;

        scoreboardList.appendChild(card);
    });
}

function showJudgePhase() {
    hideAllPhases();
    document.getElementById('judgePhase').classList.remove('hidden');
    document.getElementById('rollAlignmentSection').classList.remove('hidden');

    const judgeName = gameState.players[gameState.currentJudgeIndex].name;
    document.getElementById('currentJudgeName').textContent = judgeName;
}

function hideAllPhases() {
    document.getElementById('judgePhase').classList.add('hidden');
    document.getElementById('rollAlignmentSection').classList.add('hidden');
    document.getElementById('alignmentDisplay').classList.add('hidden');
    document.getElementById('promptSelection').classList.add('hidden');
    document.getElementById('drawingPhase').classList.add('hidden');
    document.getElementById('judgingPhase').classList.add('hidden');
    document.getElementById('resultsPhase').classList.add('hidden');
    document.getElementById('gameOverPhase').classList.add('hidden');
    document.getElementById('judgeChoiceSection').classList.add('hidden');
}

function rollAlignment() {
    const randomAlignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];
    gameState.rolledAlignment = randomAlignment;
    gameState.currentAlignment = randomAlignment;

    const grid = document.getElementById('alignmentGrid');
    grid.innerHTML = '';

    const gridOrder = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];

    gridOrder.forEach(alignment => {
        const cell = document.createElement('div');
        cell.className = 'alignment-cell disabled';
        if (alignment === randomAlignment && randomAlignment !== 'U') {
            cell.classList.add('selected');
        }
        cell.innerHTML = `<strong>${ALIGNMENT_NAMES[alignment]}</strong>`;
        grid.appendChild(cell);
    });

    const description = document.getElementById('alignmentDescription');
    description.innerHTML = `
        <h3>${ALIGNMENT_NAMES[randomAlignment]}</h3>
        <p>Examples: ${ALIGNMENT_EXAMPLES[randomAlignment]}</p>
    `;

    if (randomAlignment === 'U') {
        showJudgeChoiceSelection();
    }

    document.getElementById('rollAlignmentSection').classList.add('hidden');
    document.getElementById('alignmentDisplay').classList.remove('hidden');
}

function showJudgeChoiceSelection() {
    document.getElementById('judgeChoiceSection').classList.remove('hidden');
    document.getElementById('drawPromptsButton').disabled = true;
    document.getElementById('drawPromptsButton').textContent = '⏸️ Select an alignment first';

    const grid = document.getElementById('judgeChoiceGrid');
    grid.innerHTML = '';

    const gridOrder = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];

    gridOrder.forEach(alignment => {
        const cell = document.createElement('div');
        cell.className = 'alignment-cell';
        cell.innerHTML = `<strong>${ALIGNMENT_NAMES[alignment]}</strong><br><small>${ALIGNMENT_EXAMPLES[alignment]}</small>`;
        cell.onclick = () => selectJudgeAlignment(alignment, cell);
        grid.appendChild(cell);
    });
}

function selectJudgeAlignment(alignment, cellElement) {
    gameState.currentAlignment = alignment;

    document.querySelectorAll('#judgeChoiceGrid .alignment-cell').forEach(cell => {
        cell.classList.remove('selected');
    });
    cellElement.classList.add('selected');

    const description = document.getElementById('alignmentDescription');
    description.innerHTML = `
        <h3>Judge's Choice: ${ALIGNMENT_NAMES[alignment]}</h3>
        <p>Examples: ${ALIGNMENT_EXAMPLES[alignment]}</p>
    `;

    document.getElementById('drawPromptsButton').disabled = false;
    document.getElementById('drawPromptsButton').textContent = '📝 Draw 3 Prompts';
}

function drawPrompts() {
    if (gameState.rolledAlignment === 'U' && gameState.currentAlignment === 'U') {
        alert('Please select an alignment first!');
        return;
    }

    gameState.currentPrompts = [];
    const availablePrompts = [...gameState.promptPool];

    for (let i = 0; i < 3 && availablePrompts.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availablePrompts.length);
        gameState.currentPrompts.push(availablePrompts[randomIndex]);
        availablePrompts.splice(randomIndex, 1);
    }

    displayPrompts();
    document.getElementById('alignmentDisplay').classList.add('hidden');
    document.getElementById('promptSelection').classList.remove('hidden');

    updateRerollButton();
}

function displayPrompts() {
    const promptsList = document.getElementById('promptsList');
    promptsList.innerHTML = '';

    gameState.currentPrompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.innerHTML = `<h3>Option ${index + 1}</h3><p>${prompt}</p>`;
        card.onclick = () => selectPrompt(prompt, card);
        promptsList.appendChild(card);
    });
}

function updateRerollButton() {
    const judge = gameState.players[gameState.currentJudgeIndex];
    const tokenCount = Object.values(judge.tokens).reduce((a, b) => a + b, 0);
    const rerollButton = document.getElementById('rerollButton');

    rerollButton.disabled = tokenCount < 1;
    rerollButton.textContent = `🔄 Spend 1 Token to Re-roll Prompts (You have ${tokenCount})`;
}

function spendTokenForReroll() {
    const judge = gameState.players[gameState.currentJudgeIndex];
    const tokenCount = Object.values(judge.tokens).reduce((a, b) => a + b, 0);

    if (tokenCount < 1) {
        alert('Not enough tokens! You need 1 token to re-roll.');
        return;
    }

    if (!confirm('Spend 1 token to draw 3 new prompts?')) return;

    const tokenTypes = ['mindReader', 'technicalMerit', 'perfectAlignment', 'plotTwist'];
    for (let type of tokenTypes) {
        if (judge.tokens[type] > 0) {
            judge.tokens[type]--;
            break;
        }
    }

    drawPrompts();
    updateScoreboard();
}

function selectPrompt(prompt, cardElement) {
    gameState.selectedPrompt = prompt;

    document.querySelectorAll('.prompt-card').forEach(card => {
        card.classList.remove('selected');
    });
    cardElement.classList.add('selected');

    setTimeout(() => {
        startDrawingPhase();
    }, 500);
}

function startDrawingPhase() {
    hideAllPhases();
    document.getElementById('drawingPhase').classList.remove('hidden');

    document.getElementById('drawingAlignment').textContent = ALIGNMENT_NAMES[gameState.currentAlignment];
    document.getElementById('drawingPrompt').textContent = gameState.selectedPrompt;

    // Start timer if enabled
    if (gameState.drawingTimeSeconds > 0) {
        startTimer();
    } else {
        document.getElementById('timerSection').style.display = 'none';
    }
}

function startTimer() {
    document.getElementById('timerSection').style.display = 'block';
    gameState.timerSeconds = gameState.drawingTimeSeconds;
    updateTimerDisplay();

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timerInterval = setInterval(() => {
        gameState.timerSeconds--;
        updateTimerDisplay();

        if (gameState.timerSeconds <= 0) {
            clearInterval(gameState.timerInterval);
            alert('⏰ Time\'s up! Everyone pencils down!');
        }
    }, 1000);
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    display.textContent = gameState.timerSeconds;

    if (gameState.timerSeconds <= 10) {
        display.classList.add('warning');
    } else {
        display.classList.remove('warning');
    }
}

function finishDrawing() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    if (gameState.drawingTimeSeconds > 0 && gameState.timerSeconds > 0) {
        if (!confirm('There\'s still time left! Are you sure everyone is done drawing?')) {
            // Restart timer
            startTimer();
            return;
        }
    }

    startJudgingPhase();
}

function startJudgingPhase() {
    hideAllPhases();
    document.getElementById('judgingPhase').classList.remove('hidden');

    document.getElementById('judgingAlignment').textContent = ALIGNMENT_NAMES[gameState.currentAlignment];
    document.getElementById('judgingPrompt').textContent = gameState.selectedPrompt;

    const playerList = document.getElementById('judgingPlayerList');
    playerList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        // Skip the judge
        if (index === gameState.currentJudgeIndex) return;

        const card = document.createElement('div');
        card.className = 'player-card';
        card.onclick = () => selectWinner(index, card);

        if (gameState.anonymousMode) {
            card.innerHTML = `
                <h3 style="filter: blur(8px); user-select: none;">${player.name}</h3>
                <p style="font-size: 1.2em; margin-top: 10px;">📝 Drawing ${index + 1}</p>
            `;
        } else {
            card.innerHTML = `
                <h3>${player.name}</h3>
                <p style="font-size: 1.2em; margin-top: 10px;">📝 Click to select</p>
            `;
        }

        playerList.appendChild(card);
    });
}

function selectWinner(playerIndex, cardElement) {
    if (!confirm(`Select ${gameState.players[playerIndex].name} as the winner?`)) return;

    // Highlight selected
    document.querySelectorAll('#judgingPlayerList .player-card').forEach(card => {
        card.classList.remove('selected-winner');
    });
    cardElement.classList.add('selected-winner');

    setTimeout(() => {
        gameState.roundWinner = playerIndex;
        gameState.players[playerIndex].score++;

        if (gameState.players[playerIndex].score >= gameState.targetScore) {
            showGameOver();
            return;
        }

        showResultsPhase();
    }, 500);
}

function showResultsPhase() {
    hideAllPhases();
    document.getElementById('resultsPhase').classList.remove('hidden');

    const winner = gameState.players[gameState.roundWinner];
    document.getElementById('roundWinnerName').textContent = winner.name;

    // Token award section
    const tokenAwardList = document.getElementById('tokenAwardList');
    tokenAwardList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        if (index === gameState.currentJudgeIndex) return; // Skip judge

        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.style.marginBottom = '15px';

        let tokensHtml = '<div style="margin-top: 10px;">';
        Object.keys(TOKEN_TYPES).forEach(tokenKey => {
            tokensHtml += `
                <button class="button" style="padding: 8px 12px; font-size: 0.9em; margin: 5px;"
                    onclick="awardToken(${index}, '${tokenKey}')">
                    ${TOKEN_TYPES[tokenKey]}
                </button>
            `;
        });
        tokensHtml += '</div>';

        playerCard.innerHTML = `
            <h3>${player.name}</h3>
            ${tokensHtml}
        `;

        tokenAwardList.appendChild(playerCard);
    });

    updateScoreboard();
}

function awardToken(playerIndex, tokenType) {
    gameState.players[playerIndex].tokens[tokenType]++;
    alert(`Awarded ${TOKEN_TYPES[tokenType]} token to ${gameState.players[playerIndex].name}!`);
    updateScoreboard();
}

function openStealModal(playerIndex) {
    const player = gameState.players[playerIndex];
    const tokenCount = Object.values(player.tokens).reduce((a, b) => a + b, 0);

    if (tokenCount < 3) {
        alert('Not enough tokens! You need 3 tokens to steal a point.');
        return;
    }

    const modal = document.getElementById('stealModal');
    const targetList = document.getElementById('stealTargetList');
    targetList.innerHTML = '<h3>Select a player to steal from:</h3>';

    gameState.players.forEach((target, targetIndex) => {
        if (targetIndex === playerIndex) return;
        if (target.score === 0) return;

        const btn = document.createElement('button');
        btn.className = 'button';
        btn.style.width = '100%';
        btn.style.margin = '10px 0';
        btn.textContent = `${target.name} (${target.score} points)`;
        btn.onclick = () => executeSteal(playerIndex, targetIndex);
        targetList.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function closeStealModal() {
    document.getElementById('stealModal').classList.add('hidden');
}

function executeSteal(fromPlayerIndex, toPlayerIndex) {
    const stealer = gameState.players[fromPlayerIndex];
    const victim = gameState.players[toPlayerIndex];

    if (!confirm(`${stealer.name} will spend 3 tokens to steal 1 point from ${victim.name}. Proceed?`)) {
        return;
    }

    let tokensRemoved = 0;
    const tokenTypes = ['mindReader', 'technicalMerit', 'perfectAlignment', 'plotTwist'];

    for (let type of tokenTypes) {
        while (stealer.tokens[type] > 0 && tokensRemoved < 3) {
            stealer.tokens[type]--;
            tokensRemoved++;
        }
        if (tokensRemoved >= 3) break;
    }

    victim.score--;
    stealer.score++;

    alert(`💰 ${stealer.name} stole 1 point from ${victim.name}!`);

    closeStealModal();
    updateScoreboard();

    if (stealer.score >= gameState.targetScore) {
        setTimeout(() => {
            gameState.roundWinner = fromPlayerIndex;
            showGameOver();
        }, 1000);
    }
}

function nextRound() {
    gameState.currentJudgeIndex = (gameState.currentJudgeIndex + 1) % gameState.players.length;
    gameState.roundNumber++;
    startNewRound();
}

function showGameOver() {
    hideAllPhases();
    document.getElementById('gameOverPhase').classList.remove('hidden');

    const winner = gameState.players[gameState.roundWinner];
    document.getElementById('winnerName').textContent = winner.name;

    const finalScoreboard = document.getElementById('finalScoreboard');
    finalScoreboard.innerHTML = '<h2 style="margin-top: 30px;">Final Scores:</h2>';

    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((player, index) => {
        const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.marginBottom = '10px';

        const tokenCount = Object.values(player.tokens).reduce((a, b) => a + b, 0);

        card.innerHTML = `
            <h2>${rank} ${player.name}</h2>
            <div class="player-score">${player.score} points</div>
            <div>🎭 ${tokenCount} tokens earned</div>
        `;

        finalScoreboard.appendChild(card);
    });
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
