// Game Constants
const AVATARS = ['🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🌟', '⚡', '🔥', '💎', '🎩', '👑'];

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
    mindReader: {
        icon: "🧠",
        name: "Mind Reader",
        description: "This drawing perfectly captured what the Judge was thinking!"
    },
    technicalMerit: {
        icon: "🎨",
        name: "Technical Merit",
        description: "Exceptional artistic skill and technique displayed."
    },
    perfectAlignment: {
        icon: "⚖️",
        name: "Perfect Alignment",
        description: "Brilliantly interpreted and embodied the alignment!"
    },
    plotTwist: {
        icon: "🌀",
        name: "Plot Twist",
        description: "Surprising, unexpected, and creative interpretation!"
    }
};

const MODIFIERS = [
    { id: 'drink', name: "Liquid Courage", description: "Must finish your drink before presentation is finished", icon: "🍺" },
    { id: 'delay15', name: "Slow Start", description: "Can't start drawing until 15 seconds pass", icon: "⏳" },
    { id: 'delay30', name: "Fashionably Late", description: "Can't start drawing until after 30 second mark", icon: "⌛" },
    { id: 'noRebuttal', name: "Waterlogged", description: "No rebuttals. Can't rebut criticisms - must keep water in mouth or you're eliminated", icon: "💧" },
    { id: 'nonDominant', name: "Wrong Hand", description: "Must use your non-dominant hand to draw", icon: "✋" },
    { id: 'year1750', name: "Time Traveler", description: "Your drawing must have been possible in the year 1750", icon: "🕰️" },
    { id: 'monkey', name: "Monkey Business", description: "Must include a monkey", icon: "🐵" },
    { id: 'skeleton', name: "Bone Zone", description: "Must include a skeleton", icon: "💀" },
    { id: 'dinosaur', name: "Jurassic Spark", description: "Must involve a dinosaur", icon: "🦖" },
    { id: 'crime', name: "Criminal Mind", description: "Must commit a crime", icon: "🔪" },
    { id: 'halloween', name: "Spooky Season", description: "Must be visibly on Halloween", icon: "🎃" },
    { id: 'christmas', name: "Holiday Spirit", description: "Must be visibly on Christmas", icon: "🎄" },
    { id: 'giant', name: "Larger Than Life", description: "Must be performed by a giant", icon: "🗿" },
    { id: 'moon', name: "Lunar Logic", description: "Must include the moon", icon: "🌙" },
    { id: 'superhero', name: "Cape Crusader", description: "Must include a superhero", icon: "🦸" },
    { id: 'notEarth', name: "Off World", description: "Cannot occur on Earth", icon: "🌍" },
    { id: '3breaths', name: "Breathless", description: "Must present in 3 breaths", icon: "💨" },
    { id: 'filmed', name: "On Camera", description: "Must be filmed", icon: "📹" },
    { id: 'plantAnimal', name: "Nature's Audience", description: "Must present to a nearby plant or animal", icon: "🌿" }
];

// Game State
let gameState = {
    players: [],
    currentJudgeIndex: 0,
    selectedDecks: ['core_white'],
    promptPool: [],
    currentAlignment: null,
    rolledAlignment: null,
    lastAlignment: null,
    currentPrompts: [],
    selectedPrompt: null,
    targetScore: 3,
    roundWinner: null,
    roundNumber: 1,
    drawingTimeSeconds: 90,
    timerSeconds: 90,
    timerInterval: null,
    tokensAwardedThisRound: [],
    modifiersEnabled: true,
    pendingModifiers: [] // {curserIndex, targetIndex, modifier}
};

// Notification System
function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
}

function showConfirm(message, onYes, onNo = null, confirmKey = null) {
    // Check if user has disabled this specific confirmation
    if (confirmKey && localStorage.getItem(`skipConfirm_${confirmKey}`) === 'true') {
        if (onYes) onYes();
        return;
    }

    const container = document.getElementById('notificationContainer');
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
    checkbox.id = 'dontShowAgain';
    checkbox.style.marginRight = '8px';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = 'dontShowAgain';
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
    container.appendChild(notification);
}

// Scoreboard Toggle
function toggleScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    const toggle = document.getElementById('scoreboardToggle');
    scoreboard.classList.toggle('collapsed');
    toggle.textContent = scoreboard.classList.contains('collapsed') ? '▶' : '▼';
}

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
        showNotification('Player count must be between 3 and 8!', 'warning');
        document.getElementById('playerCount').value = 4;
        return;
    }

    const container = document.getElementById('playerNamesContainer');
    container.innerHTML = '<h2>Player Names:</h2>';

    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'player-setup-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.marginBottom = '10px';

        row.innerHTML = `
            <div class="avatar-selector" style="display: flex; align-items: center; gap: 5px;">
                <button class="avatar-nav" onclick="cycleAvatar(${i}, -1)" type="button">◀</button>
                <div class="avatar-display" id="avatar${i}">${AVATARS[i % AVATARS.length]}</div>
                <button class="avatar-nav" onclick="cycleAvatar(${i}, 1)" type="button">▶</button>
            </div>
            <input type="text" placeholder="Player ${i + 1} Name" id="playerName${i}" maxlength="20" style="flex: 1;">
        `;

        container.appendChild(row);
    }
}

function cycleAvatar(playerIndex, direction) {
    const avatarDisplay = document.getElementById(`avatar${playerIndex}`);
    const currentAvatar = avatarDisplay.textContent;
    const currentIndex = AVATARS.indexOf(currentAvatar);
    const newIndex = (currentIndex + direction + AVATARS.length) % AVATARS.length;
    avatarDisplay.textContent = AVATARS[newIndex];
}

function startGame() {
    const count = parseInt(document.getElementById('playerCount').value);

    if (count < 3 || count > 8 || isNaN(count)) {
        showNotification('Please enter a valid player count (3-8)!', 'warning');
        return;
    }

    // Collect player names and avatars
    gameState.players = [];
    for (let i = 0; i < count; i++) {
        let name = document.getElementById(`playerName${i}`).value.trim();
        name = name.replace(/[<>]/g, '');
        if (!name) name = `Player ${i + 1}`;
        if (name.length > 20) name = name.substring(0, 20);

        const avatarElement = document.getElementById(`avatar${i}`);
        const avatar = avatarElement ? avatarElement.textContent : AVATARS[i % AVATARS.length];

        gameState.players.push({
            name: name,
            avatar: avatar,
            score: 0,
            tokens: {
                mindReader: 0,
                technicalMerit: 0,
                perfectAlignment: 0,
                plotTwist: 0
            },
            activeModifiers: [],
            heldCurse: null
        });
    }

    // Collect selected decks
    gameState.selectedDecks = [];
    document.querySelectorAll('.deck-option.selected').forEach(option => {
        gameState.selectedDecks.push(option.dataset.deck);
    });

    if (gameState.selectedDecks.length === 0) {
        showNotification('Please select at least one deck!', 'warning');
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

    // Switch to game screen
    document.getElementById('setupScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    startNewRound();
}

function startNewRound() {
    gameState.roundWinner = null;
    gameState.currentAlignment = null;
    gameState.rolledAlignment = null;

    // Clear all active modifiers from previous round
    gameState.players.forEach(player => {
        player.activeModifiers = [];
    });

    // Apply pending modifiers from last round (allows stacking multiple curses)
    gameState.pendingModifiers.forEach(({targetIndex, modifier}) => {
        gameState.players[targetIndex].activeModifiers.push(modifier);
    });
    gameState.pendingModifiers = [];

    document.getElementById('roundNumber').textContent = gameState.roundNumber;
    updateScoreboard();
    showJudgePhase();
}

function updateScoreboard() {
    const scoreboardList = document.getElementById('scoreboardList');
    scoreboardList.innerHTML = '';

    // Create array with players and their original indices
    const playersWithIndices = gameState.players.map((player, index) => ({
        player: player,
        index: index,
        tokenCount: Object.values(player.tokens).reduce((a, b) => a + b, 0)
    }));

    // Sort by score (descending), then by token count (descending)
    playersWithIndices.sort((a, b) => {
        if (b.player.score !== a.player.score) {
            return b.player.score - a.player.score;
        }
        return b.tokenCount - a.tokenCount;
    });

    // Display sorted players
    playersWithIndices.forEach(({ player, index, tokenCount }) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        if (index === gameState.currentJudgeIndex) {
            card.classList.add('judge');
        }

        let stealButton = '';
        if (tokenCount >= 3 && index !== gameState.currentJudgeIndex) {
            stealButton = `<button class="button secondary steal-button" onclick="openStealModal(${index})">💰 Steal Point (3 tokens)</button>`;
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
            <h3>${player.name} ${index === gameState.currentJudgeIndex ? '👨‍⚖️' : ''}</h3>
            <div class="player-score">${player.score} pts</div>
            <div class="token-count">🎭 ${tokenCount} tokens</div>
            ${modifierDisplay}
            ${stealButton}
        `;

        scoreboardList.appendChild(card);
    });
}

function showJudgePhase() {
    hideAllPhases();
    document.getElementById('judgePhase').classList.remove('hidden');
    document.getElementById('rollAlignmentSection').classList.remove('hidden');

    const judge = gameState.players[gameState.currentJudgeIndex];
    const judgeNameElement = document.getElementById('currentJudgeName');
    judgeNameElement.innerHTML = `${judge.avatar || '🎨'} ${judge.name}`;
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
    document.getElementById('modifierPhase').classList.add('hidden');
}

function rollAlignment() {
    let randomAlignment;
    let attempts = 0;

    // Try to avoid the same alignment as last round
    do {
        randomAlignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];
        attempts++;
        // After 5 attempts, allow repeats (in case of bad luck)
    } while (randomAlignment === gameState.lastAlignment && attempts < 5);

    gameState.rolledAlignment = randomAlignment;
    gameState.currentAlignment = randomAlignment;
    gameState.lastAlignment = randomAlignment;

    const grid = document.getElementById('alignmentGrid');
    grid.innerHTML = '';

    const gridOrder = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];

    // Create all cells first
    gridOrder.forEach(alignment => {
        const cell = document.createElement('div');
        cell.className = 'alignment-cell disabled';
        cell.innerHTML = `<strong>${ALIGNMENT_NAMES[alignment]}</strong>`;
        grid.appendChild(cell);
    });

    // Animate the rolling effect with multiple cells glittering
    let rollCount = 0;
    const maxRolls = 25;
    const rollInterval = setInterval(() => {
        const cells = grid.querySelectorAll('.alignment-cell');
        cells.forEach(cell => cell.classList.remove('rolling'));

        // Light up 2-4 random cells at once for more dramatic effect
        const numCellsToLight = 2 + Math.floor(Math.random() * 3); // 2-4 cells
        const litCells = new Set();

        while (litCells.size < numCellsToLight && litCells.size < cells.length) {
            const randomIndex = Math.floor(Math.random() * cells.length);
            litCells.add(randomIndex);
        }

        litCells.forEach(index => {
            cells[index].classList.add('rolling');
        });

        rollCount++;
        if (rollCount >= maxRolls) {
            clearInterval(rollInterval);

            // Show final result - turn off all glittering
            cells.forEach(cell => cell.classList.remove('rolling'));

            if (randomAlignment !== 'U') {
                const finalCell = cells[gridOrder.indexOf(randomAlignment)];
                finalCell.classList.add('selected');
            }

            const description = document.getElementById('alignmentDescription');
            description.innerHTML = `
                <h3>${ALIGNMENT_NAMES[randomAlignment]}</h3>
                <p>Examples: ${ALIGNMENT_EXAMPLES[randomAlignment]}</p>
            `;

            if (randomAlignment === 'U') {
                // Add judges-choice class to make entire grid light up
                grid.classList.add('judges-choice');
                showJudgeChoiceSelection();
            } else {
                grid.classList.remove('judges-choice');
            }
        }
    }, 100);

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

    // Remove judges-choice glow from main grid
    const mainGrid = document.getElementById('alignmentGrid');
    mainGrid.classList.remove('judges-choice');

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
        showNotification('Please select an alignment first!', 'warning');
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
        card.className = 'prompt-card dealing';
        card.style.animationDelay = `${index * 0.2}s`;
        card.innerHTML = `<p>${prompt}</p>`;
        card.onclick = () => selectPrompt(prompt, card);
        promptsList.appendChild(card);

        // Remove dealing class after animation completes
        setTimeout(() => {
            card.classList.remove('dealing');
        }, 800 + (index * 200));
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
        showNotification('Not enough tokens! You need 1 token to re-roll.', 'warning');
        return;
    }

    showConfirm('Spend 1 token to draw 3 new prompts?', () => {
        const tokenTypes = ['mindReader', 'technicalMerit', 'perfectAlignment', 'plotTwist'];
        for (let type of tokenTypes) {
            if (judge.tokens[type] > 0) {
                judge.tokens[type]--;
                break;
            }
        }

        drawPrompts();
        updateScoreboard();
        showNotification('New prompts drawn!', 'success');
    }, null, 'rerollPrompts');
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

    // Display active modifiers if any
    const cursedPlayers = gameState.players.filter(p => p.activeModifiers && p.activeModifiers.length > 0);
    if (cursedPlayers.length > 0) {
        document.getElementById('activeModifiersSection').classList.remove('hidden');
        const modifiersList = document.getElementById('activeModifiersList');
        modifiersList.innerHTML = '';

        cursedPlayers.forEach((player, index) => {
            const playerIndex = gameState.players.indexOf(player);
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

            modifiersList.appendChild(card);
        });
    } else {
        document.getElementById('activeModifiersSection').classList.add('hidden');
    }

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
            showNotification('⏰ Time\'s up! Everyone pencils down!', 'warning', 3000);
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
        showConfirm('There\'s still time left! Are you sure everyone is done drawing?',
            () => startJudgingPhase(),
            () => startTimer(),
            'finishEarly'
        );
        return;
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

        card.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${player.avatar || '🎨'}</div>
            <h3>${player.name}</h3>
            <p style="font-size: 1.2em; margin-top: 10px;">📝 Click to select</p>
        `;

        playerList.appendChild(card);
    });
}

function selectWinner(playerIndex, cardElement) {
    showConfirm(`Select ${gameState.players[playerIndex].name} as the winner?`, () => {
        // Highlight selected
        document.querySelectorAll('#judgingPlayerList .player-card').forEach(card => {
            card.classList.remove('selected-winner');
        });
        cardElement.classList.add('selected-winner');

        setTimeout(() => {
            gameState.roundWinner = playerIndex;
            gameState.players[playerIndex].score++;

            showNotification(`${gameState.players[playerIndex].name} wins this round! 🎉`, 'success', 3000);

            if (gameState.players[playerIndex].score >= gameState.targetScore) {
                showGameOver();
                return;
            }

            showResultsPhase();
        }, 500);
    }, null, 'selectWinner');
}

function showResultsPhase() {
    hideAllPhases();
    document.getElementById('resultsPhase').classList.remove('hidden');

    // Reset tokens awarded this round
    gameState.tokensAwardedThisRound = [];

    const winner = gameState.players[gameState.roundWinner];
    const winnerNameElement = document.getElementById('roundWinnerName');
    winnerNameElement.innerHTML = `${winner.avatar || '🎨'} ${winner.name}`;

    // Token award section
    const tokenAwardList = document.getElementById('tokenAwardList');
    tokenAwardList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        if (index === gameState.currentJudgeIndex) return; // Skip judge

        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.style.marginBottom = '15px';

        let tokensHtml = '<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
        Object.keys(TOKEN_TYPES).forEach(tokenKey => {
            const token = TOKEN_TYPES[tokenKey];
            tokensHtml += `
                <div class="token-button" id="token-${index}-${tokenKey}">
                    <button class="button" style="padding: 8px 12px; font-size: 0.9em;"
                        onclick="awardToken(${index}, '${tokenKey}')">
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

        tokenAwardList.appendChild(playerCard);
    });

    updateScoreboard();
}

function awardToken(playerIndex, tokenType) {
    // Check if this token type has already been awarded this round
    if (gameState.tokensAwardedThisRound.includes(tokenType)) {
        showNotification(`${TOKEN_TYPES[tokenType].name} has already been awarded this round!`, 'warning');
        return;
    }

    // Award the token
    gameState.players[playerIndex].tokens[tokenType]++;
    gameState.tokensAwardedThisRound.push(tokenType);

    // Visual feedback - mark winner's button green, others grey
    gameState.players.forEach((player, index) => {
        if (index === gameState.currentJudgeIndex) return; // Skip judge

        const tokenButton = document.getElementById(`token-${index}-${tokenType}`);
        if (tokenButton) {
            if (index === playerIndex) {
                // Winner gets green
                tokenButton.classList.add('awarded');
            } else {
                // Others get greyed out
                tokenButton.classList.add('unavailable');
            }
            const button = tokenButton.querySelector('button');
            if (button) {
                button.disabled = true;
            }
        }
    });

    showNotification(`${gameState.players[playerIndex].avatar || '🎨'} ${gameState.players[playerIndex].name} received ${TOKEN_TYPES[tokenType].icon} ${TOKEN_TYPES[tokenType].name}!`, 'success', 3000);
    updateScoreboard();
}

function openStealModal(playerIndex) {
    const player = gameState.players[playerIndex];
    const tokenCount = Object.values(player.tokens).reduce((a, b) => a + b, 0);

    if (tokenCount < 3) {
        showNotification('Not enough tokens! You need 3 tokens to steal a point.', 'warning');
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

    showConfirm(`${stealer.name} will spend 3 tokens to steal 1 point from ${victim.name}. Proceed?`, () => {
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

        showNotification(`💰 ${stealer.name} stole 1 point from ${victim.name}!`, 'success', 3000);

        closeStealModal();
        updateScoreboard();

        if (stealer.score >= gameState.targetScore) {
            setTimeout(() => {
                gameState.roundWinner = fromPlayerIndex;
                showGameOver();
            }, 1000);
        }
    }, null, 'stealPoint');
}

// Modifier System Functions
function checkForModifierPhase() {
    if (!gameState.modifiersEnabled) {
        nextRound();
        return;
    }

    // Find lowest score
    const lowestScore = Math.min(...gameState.players.map(p => p.score));

    // Find all players in last place
    const lastPlacePlayers = gameState.players
        .map((player, index) => ({player, index}))
        .filter(({player}) => player.score === lowestScore);

    // Only give curse if there's actually a last place (not everyone tied at 0 on round 1, for example)
    const leaderScore = Math.max(...gameState.players.map(p => p.score));
    if (lowestScore === leaderScore && gameState.roundNumber === 1) {
        nextRound();
        return;
    }

    // Pick ONE random player from last place to curse
    const curserData = lastPlacePlayers[Math.floor(Math.random() * lastPlacePlayers.length)];

    // Show modifier phase
    showModifierPhase(curserData);
}

function showModifierPhase(curserData) {
    hideAllPhases();
    document.getElementById('modifierPhase').classList.remove('hidden');

    const {player, index: curserIndex} = curserData;
    const modifierQueue = document.getElementById('modifierQueue');

    // Check if player has held curse from previous round
    if (player.heldCurse) {
        modifierQueue.innerHTML = `
            <div class="center">
                <h2 style="color: #FF1493; margin: 20px 0;">
                    😈 ${player.avatar} ${player.name} - You're in Last Place!
                </h2>
                <p style="font-size: 1.3em; margin-bottom: 30px;">You have a held curse from last round!</p>

                <div class="modifier-card" style="animation: curse-draw 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;">
                    <div style="font-size: 4em; margin-bottom: 15px;">${player.heldCurse.icon}</div>
                    <h3 style="font-size: 2em; color: #FFD700; margin-bottom: 15px;">${player.heldCurse.name}</h3>
                    <p style="font-size: 1.3em; color: #FFB6C1; line-height: 1.5;">${player.heldCurse.description}</p>
                </div>

                <div class="center" style="margin-top: 30px;">
                    <button class="button large" onclick="useHeldCurse(${curserIndex})" style="margin: 10px;">
                        ⚡ Use This Curse
                    </button>
                    <button class="button large secondary" onclick="drawNewCurseCard(${curserIndex}, true)" style="margin: 10px;">
                        🎴 Draw New Curse (Discard This)
                    </button>
                </div>
            </div>
        `;
    } else {
        modifierQueue.innerHTML = `
            <div class="center">
                <h2 style="color: #FF1493; margin: 20px 0;">
                    😈 ${player.avatar} ${player.name} - You're in Last Place!
                </h2>
                <p style="font-size: 1.3em; margin-bottom: 30px;">You get to draw a curse card!</p>

                <div class="center">
                    <button class="button large" onclick="drawNewCurseCard(${curserIndex}, false)" style="font-size: 1.5em; padding: 25px 40px;">
                        🎴 DRAW CURSE CARD
                    </button>
                </div>
            </div>
        `;
    }
}

function drawNewCurseCard(curserIndex, replacingHeld) {
    const curser = gameState.players[curserIndex];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    // If replacing held curse, clear it
    if (replacingHeld) {
        curser.heldCurse = null;
    }

    const modifierQueue = document.getElementById('modifierQueue');
    modifierQueue.innerHTML = `
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
                <button class="button secondary" onclick="holdCurseForLater(${curserIndex})" style="font-size: 1.1em;">
                    💾 Hold for Next Round
                </button>
            </div>
        </div>
    `;

    // Store the current modifier temporarily
    curser.tempModifier = modifier;

    const targetList = document.getElementById('curseTargetList');
    gameState.players.forEach((target, targetIndex) => {
        // Can't curse yourself or the judge
        if (targetIndex === curserIndex || targetIndex === gameState.currentJudgeIndex) return;

        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.cursor = 'pointer';
        card.onclick = () => {
            gameState.pendingModifiers.push({curserIndex, targetIndex, modifier});
            curser.tempModifier = null;
            showNotification(`${target.name} has been cursed with ${modifier.name}!`, 'success', 3000);
            setTimeout(() => nextRound(), 1500);
        };

        card.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${target.avatar || '🎨'}</div>
            <h3>${target.name}</h3>
            <div class="player-score">${target.score} pts</div>
        `;

        targetList.appendChild(card);
    });
}

function useHeldCurse(curserIndex) {
    const curser = gameState.players[curserIndex];
    const modifier = curser.heldCurse;
    curser.heldCurse = null;

    const modifierQueue = document.getElementById('modifierQueue');
    modifierQueue.innerHTML = `
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

    const targetList = document.getElementById('curseTargetList');
    gameState.players.forEach((target, targetIndex) => {
        // Can't curse yourself or the judge
        if (targetIndex === curserIndex || targetIndex === gameState.currentJudgeIndex) return;

        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.cursor = 'pointer';
        card.onclick = () => {
            gameState.pendingModifiers.push({curserIndex, targetIndex, modifier});
            showNotification(`${target.name} has been cursed with ${modifier.name}!`, 'success', 3000);
            setTimeout(() => nextRound(), 1500);
        };

        card.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${target.avatar || '🎨'}</div>
            <h3>${target.name}</h3>
            <div class="player-score">${target.score} pts</div>
        `;

        targetList.appendChild(card);
    });
}

function holdCurseForLater(curserIndex) {
    const curser = gameState.players[curserIndex];
    curser.heldCurse = curser.tempModifier;
    curser.tempModifier = null;

    showNotification(`${curser.name} holds the curse for next round!`, 'info', 3000);
    setTimeout(() => nextRound(), 1500);
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
    const winnerNameElement = document.getElementById('winnerName');
    winnerNameElement.innerHTML = `${winner.avatar || '🎨'} ${winner.name}`;

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
            <div style="font-size: 3em; margin-bottom: 10px;">${player.avatar || '🎨'}</div>
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
