const FREE_FEATURES = {
    onlineMode: true,
    expansionDecks: true,
    curseCards: true,
    history: true
};

export function getFreeEntitlements() {
    return {
        tier: 'free',
        trialEndsAt: null,
        source: 'free',
        features: { ...FREE_FEATURES }
    };
}

export function withDefaultEntitlements(record) {
    return {
        ...getFreeEntitlements(),
        source: record?.source || 'free',
        trialEndsAt: record?.effective_to || null
    };
}

export async function getEntitlementsForProfile() {
    return getFreeEntitlements();
}
