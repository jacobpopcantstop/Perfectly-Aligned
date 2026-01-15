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
    currentArtistIndex: 0,
    selectedDecks: ['core_white'],
    promptPool: [],
    currentAlignment: null,
    currentPrompts: [],
    selectedPrompt: null,
    submissions: [],
    targetScore: 3,
    roundWinner: null,
    roundNumber: 1
};

// Canvas State
let canvas, ctx;
let isDrawing = false;
let drawingHistory = [];
let currentPath = [];

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

    // Brush size display
    const brushSize = document.getElementById('brushSize');
    brushSize.addEventListener('input', (e) => {
        document.getElementById('brushSizeDisplay').textContent = e.target.value + 'px';
    });
}

function updatePlayerNameInputs() {
    const count = parseInt(document.getElementById('playerCount').value);
    const container = document.getElementById('playerNamesContainer');
    container.innerHTML = '<h2>Player Names:</h2>';

    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Player ${i + 1} Name`;
        input.id = `playerName${i}`;
        container.appendChild(input);
    }
}

function startGame() {
    const count = parseInt(document.getElementById('playerCount').value);

    // Collect player names
    gameState.players = [];
    for (let i = 0; i < count; i++) {
        const name = document.getElementById(`playerName${i}`).value.trim() || `Player ${i + 1}`;
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

    // Shuffle prompt pool
    gameState.promptPool = shuffleArray(gameState.promptPool);

    // Get target score
    gameState.targetScore = parseInt(document.getElementById('targetScore').value);

    // Switch to game screen
    document.getElementById('setupScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    // Initialize canvas
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    setupCanvas();

    // Start first round
    startNewRound();
}

function setupCanvas() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    currentPath = [];
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    currentPath.push({ x, y });
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = document.getElementById('colorPicker').value;
    ctx.lineWidth = document.getElementById('brushSize').value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const lastPoint = currentPath[currentPath.length - 1];
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    currentPath.push({ x, y });
}

function stopDrawing() {
    if (isDrawing && currentPath.length > 0) {
        drawingHistory.push({
            path: currentPath,
            color: document.getElementById('colorPicker').value,
            width: document.getElementById('brushSize').value
        });
    }
    isDrawing = false;
    currentPath = [];
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
}

function undoDrawing() {
    if (drawingHistory.length === 0) return;

    drawingHistory.pop();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawingHistory.forEach(entry => {
        ctx.strokeStyle = entry.color;
        ctx.lineWidth = entry.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(entry.path[0].x, entry.path[0].y);
        for (let i = 1; i < entry.path.length; i++) {
            ctx.lineTo(entry.path[i].x, entry.path[i].y);
        }
        ctx.stroke();
    });
}

function startNewRound() {
    gameState.submissions = [];
    gameState.currentArtistIndex = 0;
    gameState.roundWinner = null;

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

        card.innerHTML = `
            <h3>${player.name} ${index === gameState.currentJudgeIndex ? '👨‍⚖️' : ''}</h3>
            <div class="player-score">${player.score} pts</div>
            <div>🎭 ${tokenCount} tokens</div>
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
}

function rollAlignment() {
    const randomAlignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];
    gameState.currentAlignment = randomAlignment;

    // Display alignment grid
    const grid = document.getElementById('alignmentGrid');
    grid.innerHTML = '';

    const gridOrder = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];

    gridOrder.forEach(alignment => {
        const cell = document.createElement('div');
        cell.className = 'alignment-cell';
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

    document.getElementById('rollAlignmentSection').classList.add('hidden');
    document.getElementById('alignmentDisplay').classList.remove('hidden');
}

function drawPrompts() {
    // Draw 3 random prompts
    gameState.currentPrompts = [];
    const availablePrompts = [...gameState.promptPool];

    for (let i = 0; i < 3; i++) {
        if (availablePrompts.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availablePrompts.length);
        gameState.currentPrompts.push(availablePrompts[randomIndex]);
        availablePrompts.splice(randomIndex, 1);
    }

    // Display prompts
    const promptsList = document.getElementById('promptsList');
    promptsList.innerHTML = '';

    gameState.currentPrompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.innerHTML = `<h3>Option ${index + 1}</h3><p>${prompt}</p>`;
        card.onclick = () => selectPrompt(prompt, card);
        promptsList.appendChild(card);
    });

    document.getElementById('alignmentDisplay').classList.add('hidden');
    document.getElementById('promptSelection').classList.remove('hidden');
}

function selectPrompt(prompt, cardElement) {
    gameState.selectedPrompt = prompt;

    // Highlight selected
    document.querySelectorAll('.prompt-card').forEach(card => {
        card.classList.remove('selected');
    });
    cardElement.classList.add('selected');

    // Wait a moment then move to drawing phase
    setTimeout(() => {
        startDrawingPhase();
    }, 500);
}

function startDrawingPhase() {
    hideAllPhases();
    document.getElementById('drawingPhase').classList.remove('hidden');

    document.getElementById('drawingAlignment').textContent = ALIGNMENT_NAMES[gameState.currentAlignment];
    document.getElementById('drawingPrompt').textContent = gameState.selectedPrompt;

    // Start with first non-judge player
    gameState.currentArtistIndex = 0;
    if (gameState.currentArtistIndex === gameState.currentJudgeIndex) {
        gameState.currentArtistIndex++;
    }

    showNextArtist();
}

function showNextArtist() {
    // Skip judge
    if (gameState.currentArtistIndex === gameState.currentJudgeIndex) {
        gameState.currentArtistIndex++;
    }

    if (gameState.currentArtistIndex >= gameState.players.length) {
        // All players have drawn, move to judging
        startJudgingPhase();
        return;
    }

    const artist = gameState.players[gameState.currentArtistIndex];
    document.getElementById('currentArtistName').textContent = artist.name;
    clearCanvas();
}

function submitDrawing() {
    const drawingData = canvas.toDataURL();
    gameState.submissions.push({
        playerIndex: gameState.currentArtistIndex,
        playerName: gameState.players[gameState.currentArtistIndex].name,
        drawing: drawingData
    });

    gameState.currentArtistIndex++;
    showNextArtist();
}

function startJudgingPhase() {
    hideAllPhases();
    document.getElementById('judgingPhase').classList.remove('hidden');

    document.getElementById('judgingAlignment').textContent = ALIGNMENT_NAMES[gameState.currentAlignment];
    document.getElementById('judgingPrompt').textContent = gameState.selectedPrompt;

    const submissionsList = document.getElementById('submissionsList');
    submissionsList.innerHTML = '';

    gameState.submissions.forEach((submission, index) => {
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.innerHTML = `
            <img src="${submission.drawing}" alt="Drawing">
            <h3>${submission.playerName}</h3>
        `;
        card.onclick = () => selectWinner(index);
        submissionsList.appendChild(card);
    });
}

function selectWinner(submissionIndex) {
    const submission = gameState.submissions[submissionIndex];
    gameState.roundWinner = submission.playerIndex;

    // Award point
    gameState.players[submission.playerIndex].score++;

    // Check for game over
    if (gameState.players[submission.playerIndex].score >= gameState.targetScore) {
        showGameOver();
        return;
    }

    showResultsPhase();
}

function showResultsPhase() {
    hideAllPhases();
    document.getElementById('resultsPhase').classList.remove('hidden');

    const winner = gameState.players[gameState.roundWinner];
    document.getElementById('roundWinnerName').textContent = winner.name;

    const winningDrawing = gameState.submissions.find(s => s.playerIndex === gameState.roundWinner);
    document.getElementById('winningDrawingDisplay').innerHTML = `
        <img src="${winningDrawing.drawing}" style="max-width: 400px; border-radius: 10px; margin: 20px auto; display: block;">
    `;

    // Token award section
    const tokenAwardList = document.getElementById('tokenAwardList');
    tokenAwardList.innerHTML = '';

    gameState.submissions.forEach(submission => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.style.marginBottom = '15px';

        let tokensHtml = '<div style="margin-top: 10px;">';
        Object.keys(TOKEN_TYPES).forEach(tokenKey => {
            tokensHtml += `
                <button class="button" style="padding: 8px 12px; font-size: 0.9em; margin: 5px;"
                    onclick="awardToken(${submission.playerIndex}, '${tokenKey}')">
                    ${TOKEN_TYPES[tokenKey]}
                </button>
            `;
        });
        tokensHtml += '</div>';

        playerCard.innerHTML = `
            <h3>${submission.playerName}</h3>
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

    // Final scoreboard
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

// Utility function
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
