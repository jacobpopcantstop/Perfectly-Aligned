// filepath: c:\Users\Jacob\Desktop\perfectlyalignedhelper\state.js
// Centralized game state
export const gameState = {
    players: [], // Array to hold player objects { name: "...", score: 0, tokens: {...}, avatar: "..." }
    currentPlayerIndex: 0,
    targetScore: 5,
    availableCards: [],
    currentlyDisplayedPrompts: [],
    chosenPromptForRound: null, // Stores the text of the clicked prompt
    selectedWinnerIndexForRound: null,
    recentAlignments: [], // Store the last 3 alignment results (abbreviations)
    currentRolledAlignment: null,
    timerInterval: null,
    timerTotalSeconds: 90, // Default timer value
    selectedAvatars: {}, // Stores { selectId: avatarFile } during setup
    currentTutorialStep: 0,
    flickerInterval: null,
};

// --- State Utility Functions ---

// Helper: Calculate total tokens for a player
export function getPlayerTokenTotal(player) {
    if (!player || !player.tokens) return 0;
    return Object.values(player.tokens).reduce((sum, count) => sum + count, 0);
}

// Helper: Deduct a specific number of tokens from a player
export function deductTokens(player, count) {
    if (!player || !player.tokens) return false;
    let totalTokens = getPlayerTokenTotal(player);
    if (totalTokens < count) {
        return false; // Not enough tokens
    }
    let tokensToDeduct = count;
    const tokenTypes = Object.keys(player.tokens);

    // Prioritize spending tokens if possible (optional, depends on game rules)
    // Example: Spend plotTwist first, then others
    // const spendOrder = ['plotTwist', 'mindReader', 'technicalMerit', 'perfectAlignment'];
    // tokenTypes.sort((a, b) => spendOrder.indexOf(a) - spendOrder.indexOf(b));

    for (const type of tokenTypes) {
        if (tokensToDeduct === 0) break;
        const available = player.tokens[type];
        const deductAmount = Math.min(tokensToDeduct, available);
        if (deductAmount > 0) {
            player.tokens[type] -= deductAmount;
            tokensToDeduct -= deductAmount; // Decrement tokensToDeduct
        }
    }
    return tokensToDeduct === 0; // Return true only if the exact count was deducted
}

// Helper: Shuffle an array in place
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Reset specific parts of the state for a new game
export function resetGameStateForNewGame() {
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.targetScore = 5;
    gameState.availableCards = [];
    gameState.currentlyDisplayedPrompts = [];
    gameState.chosenPromptForRound = null;
    gameState.selectedWinnerIndexForRound = null;
    gameState.recentAlignments = [];
    gameState.currentRolledAlignment = null;
    gameState.selectedAvatars = {};
    // Keep timer settings, tutorial step might reset or not depending on desired behavior
}

// Reset state specific to the start of a new round
export function resetRoundState() {
    gameState.chosenPromptForRound = null;
    gameState.selectedWinnerIndexForRound = null;
    gameState.currentRolledAlignment = null;
    // Clear intervals if they exist
    if (gameState.flickerInterval) {
        clearInterval(gameState.flickerInterval);
        gameState.flickerInterval = null;
    }
    // Timer interval is handled separately by timer functions
}
