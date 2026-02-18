/**
 * Perfectly Aligned - Game Data Constants
 * ========================================
 * Single Source of Truth (SSoT) for all game data.
 * This file is imported by both the frontend (ES6 modules) and backend (Node.js).
 *
 * @version 4.0.0
 * @license MIT
 */

// =============================================================================
// AVATARS - Player avatar options (emoji-based for local multiplayer)
// =============================================================================
export const AVATARS = [
    '🎨', '🎭', '🎪', '🎯', '🎲', '🎸',
    '🌟', '⚡', '🔥', '💎', '🎩', '👑'
];

// =============================================================================
// ALIGNMENTS - The 9-position alignment grid plus Judge's Choice
// =============================================================================
export const ALIGNMENTS = [
    'LG', 'NG', 'CG',  // Good row
    'LN', 'TN', 'CN',  // Neutral row
    'LE', 'NE', 'CE',  // Evil row
    'U'                // Judge's Choice (special)
];

// Full names for each alignment code
export const ALIGNMENT_NAMES = {
    LG: "Lawful Good",
    NG: "Neutral Good",
    CG: "Chaotic Good",
    LN: "Lawful Neutral",
    TN: "True Neutral",
    CN: "Chaotic Neutral",
    LE: "Lawful Evil",
    NE: "Neutral Evil",
    CE: "Chaotic Evil",
    U: "Judge's Choice"
};

// Example characters for each alignment to help players understand
export const ALIGNMENT_EXAMPLES = {
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

// Grid layout order (3x3 alignment chart)
export const ALIGNMENT_GRID_ORDER = [
    'LG', 'NG', 'CG',
    'LN', 'TN', 'CN',
    'LE', 'NE', 'CE'
];

// =============================================================================
// TOKEN TYPES - Bonus tokens awarded by the judge for exceptional drawings
// =============================================================================
export const TOKEN_TYPES = {
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

// Array of token type keys for iteration
export const TOKEN_TYPE_KEYS = Object.keys(TOKEN_TYPES);

// =============================================================================
// MODIFIERS (Curse Cards) - Applied to last-place players each round
// =============================================================================
export const MODIFIERS = [
    {
        id: 'drink',
        name: "Liquid Courage",
        description: "Must finish your drink before the presentation ends",
        icon: "🍺"
    },
    {
        id: 'delay15',
        name: "Slow Start",
        description: "Can't start drawing until 15 seconds pass",
        icon: "⏳"
    },
    {
        id: 'delay30',
        name: "Fashionably Late",
        description: "Can't start drawing until after the 30-second mark",
        icon: "⌛"
    },
    {
        id: 'noRebuttal',
        name: "Waterlogged",
        description: "No rebuttals. You can't respond to criticism; keep water in your mouth or you're eliminated.",
        icon: "💧"
    },
    {
        id: 'nonDominant',
        name: "Wrong Hand",
        description: "Must use your non-dominant hand to draw",
        icon: "✋"
    },
    {
        id: 'year1750',
        name: "Time Traveler",
        description: "Your drawing must have been possible in the year 1750",
        icon: "🕰️"
    },
    {
        id: 'monkey',
        name: "Monkey Business",
        description: "Must include a monkey",
        icon: "🐵"
    },
    {
        id: 'skeleton',
        name: "Bone Zone",
        description: "Must include a skeleton",
        icon: "💀"
    },
    {
        id: 'dinosaur',
        name: "Jurassic Spark",
        description: "Must involve a dinosaur",
        icon: "🦖"
    },
    {
        id: 'crime',
        name: "Criminal Mind",
        description: "Must commit a crime",
        icon: "🔪"
    },
    {
        id: 'halloween',
        name: "Spooky Season",
        description: "Must be visibly on Halloween",
        icon: "🎃"
    },
    {
        id: 'christmas',
        name: "Holiday Spirit",
        description: "Must be visibly on Christmas",
        icon: "🎄"
    },
    {
        id: 'giant',
        name: "Larger Than Life",
        description: "Must be performed by a giant",
        icon: "🗿"
    },
    {
        id: 'moon',
        name: "Lunar Logic",
        description: "Must include the moon",
        icon: "🌙"
    },
    {
        id: 'superhero',
        name: "Cape Crusader",
        description: "Must include a superhero",
        icon: "🦸"
    },
    {
        id: 'notEarth',
        name: "Off World",
        description: "Cannot occur on Earth",
        icon: "🌍"
    },
    {
        id: '3breaths',
        name: "Breathless",
        description: "Must present in three breaths",
        icon: "💨"
    },
    {
        id: 'filmed',
        name: "On Camera",
        description: "Must be filmed",
        icon: "📹"
    },
    {
        id: 'plantAnimal',
        name: "Nature's Audience",
        description: "Must present to a nearby plant or animal",
        icon: "🌿"
    }
];

// =============================================================================
// THEMED DECKS - Prompt categories for different playstyles
// =============================================================================
export const THEMED_DECKS = {
    // Core White Deck - Family-friendly scenarios and everyday dilemmas
    core_white: [
        "Ways to react to finding a wallet",
        "Ways to impress your partner's parents",
        "Ways to respond to a customer complaint",
        "Ways to decide what movie to watch",
        "Ways to cope with being stuck in traffic",
        "Ways to react to receiving a terrible gift",
        "Ways to handle a power outage",
        "Ways to react to your pet talking",
        "Ways to explore a secret passage",
        "Ways to run for local office",
        "Ways to give back to the community",
        "Types of home workouts",
        "Ways to beat the heat",
        "Ways to bond with your child",
        "Ways to get a baby to sleep",
        "Ways to get stronger",
        "Ways to get that beach body",
        "Ways to lose weight",
        "Ways to make C-Span more entertaining",
        "Ways to solve world hunger",
        "Types of life hacks",
        "Types of ideal living situations",
        "Ways to put on pants",
        "Types of roommate etiquette rules",
        "Ways to react to a roommate leaving dirty dishes",
        "Ways to sit",
        "Types of sleeping positions",
        "Ways to use a toilet",
        "Ways to wash your hands",
        "Types of water sports",
        "Ways to die",
        "Ways to dispose of garbage",
        "Ways to dump someone",
        "Ways to kiss someone",
        "Ways to listen to music",
        "Ways to propose",
        "Ways to rebel against authority",
        "Ways to use a 30-acre family estate you inherited",
        "Types of phobias",
        "Types of excuses for being late",
        "Ways to stay motivated",
        "Types of bad habits",
        "Ways to impress your boss",
        "Types of last words",
        "Ways to manage time",
        "Ways to organize your home",
        "Types of negotiation strategies",
        "Ways to manage anger",
        "Ways to relax after a stressful day",
        "Types of love languages",
        "Ways to relieve stress",
        "Ways to make a first impression",
        "Types of travel experiences",
        "Ways to be environmentally conscious",
        "Ways to make new friends",
        "Types of fashion styles",
        "Reasons to go vegan",
        "Ways to survive the zombie apocalypse",
        "Ways to quit your 9-5 job",
        "Ways to act at a high school reunion",
        "Ways to handle being Freaky Friday'd",
        "Ways to describe a near-death experience",
        "Ways to attract someone out of your league",
        "Ways to make ravioli",
        "Types of plants",
        "Types of animals",
        "Types of sports",
        "Ways to eat a banana",
        "Types of music genres",
        "Types of get-rich-quick schemes",
        "Ways to handle a minor fender-bender you caused",
        "Ways to react to a friend's bad haircut",
        "Ways to react to getting extra change from a cashier",
        "Ways to share snacks at work/school",
        "Ways to react to seeing someone shoplift essentials",
        "Ways to respond to an unethical request from your boss",
        "Ways to cheat on a test",
        "Ways to defend yourself",
        "Ways to end conflict with a spider",
        "Types of killing methods",
        "Reasons for not eating something",
        "Ways to respond to 'You're not a cop, right?'",
        "Ways to react to getting life in prison for a crime you didn't commit",
        "Types of trolley problem solutions",
        "Ways to advise a historical leader",
        "Ways to react to witnessing a major historical event",
        "Ways to handle inventing something before its time",
        "Ways to react during the Y2K panic",
        "Types of prehistoric activities",
        "Types of ancient building techniques",
        "Types of world leaders",
        "Types of presidents"
    ],

    // Creative Cyan Deck - Lists, pop culture, and imaginative prompts
    creative_cyan: [
        "Types of children's toys",
        "Types of fruit",
        "Types of themed weddings",
        "Types of hats",
        "Types of cars",
        "Types of school functions",
        "Types of pets",
        "Types of inter-species hybrids",
        "Types of nicknames for a daughter",
        "Types of pirate accessories",
        "Types of vanity plates",
        "Types of imaginary friends",
        "Types of animals",
        "Types of things to steal from a house",
        "Types of things to order at a coffee shop",
        "Types of kids on the school bus",
        "Types of monsters",
        "Types of fictional professions",
        "Types of aquatic vehicles",
        "Ways to combine a taco, burger, and pizza",
        "Ways to eat a hotdog",
        "Types of facial hair",
        "Types of shoes",
        "Types of holiday traditions",
        "Types of unlikely explosives",
        "Types of things you can get in a can",
        "Types of masks",
        "Types of kitchen utensils",
        "Types of anxiety dreams",
        "Types of nicknames for the sea",
        "Types of college electives",
        "Types of dietary restrictions",
        "Ways to hide things on your person discreetly",
        "Types of personal usernames",
        "Types of epitaphs for tombstones",
        "Types of superpowers",
        "Types of synonyms for 'yes'",
        "Types of donuts",
        "Types of world records to break",
        "Types of instruments of torture",
        "Types of euphemisms for death",
        "Types of childhood snacks",
        "Types of cryptids",
        "Types of things in space",
        "Types of clouds",
        "Types of alcoholic beverages",
        "Types of artistic mediums",
        "Types of educational strategies",
        "Types of book genres",
        "Types of hot drinks",
        "Types of nicknames for sons",
        "Ways to direct the next big superhero movie",
        "Ways to win a reality TV show",
        "Ways to become a viral internet meme",
        "Ways to act at the Met Gala",
        "Ways to write the finale of a beloved TV series",
        "Types of cereal mascots",
        "Responses to 'Name a more iconic duo'",
        "Dishes to prepare for Gordon Ramsay",
        "Things that could be in the box (Seven)"
    ],

    // Hypothetical Magenta Deck - Wild scenarios and 17+ content
    hypothetical_magenta: [
        "Ways to bring someone back from the dead",
        "Ways to approach an alien race",
        "Ways to be a wingman",
        "Ways to end malaria",
        "Ways to end the world",
        "Ways to pick someone up (romantically)",
        "Ways to reveal your child's gender",
        "Ways to stop a bank robbery",
        "Ways to tame a wild animal",
        "Ways to survive falling into the chimpanzee enclosure",
        "Ways to use a time machine",
        "First actions after waking from a 10-year coma",
        "Things a billionaire might leave their wealth to",
        "Ways to explain pet death to a child",
        "First things to enlarge with an embiggening ray",
        "Ways to respond to 'Spare some change?'",
        "Things hidden in Area 51's newest wing",
        "First things to shrink with a shrink ray",
        "Ways to answer 'What is your greatest strength?'",
        "Reasons to call off a wedding",
        "Advice to give if you became the richest person in the world",
        "Excuses for carrying a heavy, suspicious sack",
        "Ways to handle taking two dates to prom",
        "Ways to react when surrounded by police",
        "Ways to react to someone breaking into your car",
        "Ways to answer 'Do you know why I pulled you over?'",
        "First actions as the last person on Earth",
        "Ways to use an antigravity device",
        "Ways to use an invisibility cloak",
        "Ways to use teleportation",
        "Ways to deal with having a doppelgänger",
        "Ways to cope with being turned into a snail",
        "Ways to use mind-reading abilities",
        "Ways to use shapeshifting abilities",
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
        "Ways to handle a morally gray scenario (17+)",
        "Ways to handle an awkward romantic encounter (17+)",
        "Ways to deal with a controversial social issue (17+)",
        "Types of 'Yo Mama' insults",
        "Types of tattoos and where to put them",
        "Types of drugs",
        "Types of adult content categories",
        "Ways to respond to 'Stepbrother! I'm stuck in the dryer!'",
        "Ways to react to your SO leaving you for someone else",
        "Ways to answer 'Does this outfit make me look ugly?'"
    ]
};

// Deck metadata for UI display
export const DECK_METADATA = {
    core_white: {
        id: 'core_white',
        name: "Core Mix",
        icon: "📋",
        description: "Family-friendly scenarios and everyday dilemmas. Perfect for all ages!",
        ageRating: "All Ages"
    },
    creative_cyan: {
        id: 'creative_cyan',
        name: "Creative & Pop Culture",
        icon: "🎭",
        description: "Lists, pop culture references, and imaginative prompts.",
        ageRating: "All Ages"
    },
    hypothetical_magenta: {
        id: 'hypothetical_magenta',
        name: "Wild & Spicy",
        icon: "🔮",
        description: '"What if" scenarios and edgy content. Not for kids!',
        ageRating: "17+"
    }
};

// =============================================================================
// GAME CONFIGURATION DEFAULTS
// =============================================================================
export const GAME_DEFAULTS = {
    minPlayers: 3,
    maxPlayers: 8,
    defaultPlayerCount: 4,
    defaultTargetScore: 3,
    defaultDrawingTime: 90,
    timerOptions: [60, 90, 120, 180, 0], // 0 = no timer
    targetScoreOptions: [3, 4, 5, 7],
    maxNameLength: 20,
    tokensToSteal: 3,      // Tokens required to steal a point
    tokensToReroll: 1,     // Tokens required to re-roll prompts
    promptsPerDraw: 3,     // Number of prompts drawn each round
    timerWarningThreshold: 10 // Seconds remaining to show warning
};

// =============================================================================
// GAME PHASES - State machine phase definitions
// =============================================================================
export const GAME_PHASES = {
    SETUP: 'setup',
    JUDGE_ROLL: 'judge_roll',
    JUDGE_CHOICE: 'judge_choice',
    PROMPT_SELECTION: 'prompt_selection',
    DRAWING: 'drawing',
    JUDGING: 'judging',
    RESULTS: 'results',
    MODIFIER: 'modifier',
    GAME_OVER: 'game_over'
};

// =============================================================================
// HELPER FUNCTIONS - Utility functions for game data manipulation
// =============================================================================

/**
 * Get a random element from an array
 * @param {Array} array - The source array
 * @returns {*} A random element from the array
 */
export function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Build a prompt pool from selected deck keys
 * @param {Array<string>} deckKeys - Array of deck keys to include
 * @returns {Array<string>} Shuffled array of prompts
 */
export function buildPromptPool(deckKeys) {
    let pool = [];
    deckKeys.forEach(key => {
        if (THEMED_DECKS[key]) {
            pool = pool.concat(THEMED_DECKS[key]);
        }
    });
    return shuffleArray(pool);
}

/**
 * Get a random modifier (curse card)
 * @returns {Object} A random modifier object
 */
export function getRandomModifier() {
    return getRandomElement(MODIFIERS);
}

/**
 * Get a random alignment (excluding 'U' if specified)
 * @param {boolean} includeJudgeChoice - Whether to include 'U' (Judge's Choice)
 * @returns {string} A random alignment code
 */
export function getRandomAlignment(includeJudgeChoice = true) {
    const alignments = includeJudgeChoice
        ? ALIGNMENTS
        : ALIGNMENTS.filter(a => a !== 'U');
    return getRandomElement(alignments);
}

/**
 * Create initial token state for a player
 * @returns {Object} Token counts initialized to 0
 */
export function createInitialTokenState() {
    return TOKEN_TYPE_KEYS.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});
}

/**
 * Calculate total token count for a player
 * @param {Object} tokens - Player's token object
 * @returns {number} Total number of tokens
 */
export function getTotalTokenCount(tokens) {
    return Object.values(tokens).reduce((sum, count) => sum + count, 0);
}

/**
 * Sanitize player name input
 * @param {string} name - Raw name input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized name
 */
export function sanitizePlayerName(name, maxLength = GAME_DEFAULTS.maxNameLength) {
    let sanitized = name.trim().replace(/[<>]/g, '');
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized || null;
}

// =============================================================================
// NODE.JS COMPATIBILITY - CommonJS exports for server-side usage
// =============================================================================
// Note: When using this file with Node.js, you may need to either:
// 1. Use "type": "module" in package.json
// 2. Rename to game-data.mjs
// 3. Use a bundler/transpiler
