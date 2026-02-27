import { getSupabaseAdminClient } from './supabase.js';

const PREMIUM_FEATURES = {
    onlineMode: true,
    expansionDecks: true,
    curseCards: true,
    history: true
};

export function getFreeEntitlements() {
    return {
        isPremium: false,
        trialEndsAt: null,
        source: 'free',
        features: {
            onlineMode: false,
            expansionDecks: false,
            curseCards: false,
            history: false
        }
    };
}

export function toPremiumEntitlements(source = 'premium', trialEndsAt = null) {
    return {
        isPremium: true,
        source,
        trialEndsAt,
        features: { ...PREMIUM_FEATURES }
    };
}

export function withDefaultEntitlements(record) {
    if (!record || !record.is_premium) return getFreeEntitlements();
    return {
        isPremium: true,
        source: record.source || 'premium',
        trialEndsAt: record.effective_to || null,
        features: { ...PREMIUM_FEATURES }
    };
}

export async function getEntitlementsForProfile(profileId) {
    if (!profileId) return getFreeEntitlements();

    if (process.env.PREMIUM_DEFAULT_FOR_ALL === 'true') {
        return toPremiumEntitlements('env_override', null);
    }

    const admin = getSupabaseAdminClient();
    if (!admin) return getFreeEntitlements();

    const { data, error } = await admin
        .from('entitlements')
        .select('is_premium, source, effective_to')
        .eq('profile_id', profileId)
        .maybeSingle();

    if (error || !data) return getFreeEntitlements();

    if (!data.is_premium) return getFreeEntitlements();

    if (data.effective_to && new Date(data.effective_to).getTime() < Date.now()) {
        return getFreeEntitlements();
    }

    return withDefaultEntitlements(data);
}

export async function upsertPremiumEntitlement(profileId, payload = {}) {
    const admin = getSupabaseAdminClient();
    if (!admin || !profileId) return { success: false };

    const row = {
        profile_id: profileId,
        is_premium: true,
        source: payload.source || 'subscription',
        effective_from: payload.effectiveFrom || new Date().toISOString(),
        effective_to: payload.effectiveTo || null,
        updated_at: new Date().toISOString()
    };

    const { error } = await admin.from('entitlements').upsert(row, { onConflict: 'profile_id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export function isPremiumFeatureAllowed(entitlements, featureKey) {
    if (!entitlements?.isPremium) return false;
    return Boolean(entitlements.features?.[featureKey]);
}
