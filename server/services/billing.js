import Stripe from 'stripe';
import { upsertFreeEntitlement, upsertPremiumEntitlement } from './entitlements.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripeMonthlyPriceId = process.env.STRIPE_PRICE_MONTHLY || '';
const stripeYearlyPriceId = process.env.STRIPE_PRICE_YEARLY || '';
const foundersPromoCode = process.env.STRIPE_FOUNDERS_PROMO_CODE_ID || '';
const foundersFreePassEnabled = process.env.FOUNDERS_FREE_PASS_ENABLED !== 'false';
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

let stripeClient = null;

function getStripeClient() {
    if (!stripeSecretKey) return null;
    if (!stripeClient) {
        stripeClient = new Stripe(stripeSecretKey);
    }
    return stripeClient;
}

export function hasStripeConfig() {
    return Boolean(stripeSecretKey && stripeMonthlyPriceId && stripeYearlyPriceId);
}

export function getBillingPublicConfig() {
    return {
        hasStripe: hasStripeConfig(),
        priceCodes: {
            monthly: 'premium_monthly',
            yearly: 'premium_yearly'
        }
    };
}

export function resolvePriceId(priceCode) {
    if (priceCode === 'premium_monthly') return stripeMonthlyPriceId;
    if (priceCode === 'premium_yearly') return stripeYearlyPriceId;
    return null;
}

export async function createCheckoutSession({ profile, priceCode, origin, promoCode }) {
    const normalizedPromoCode = typeof promoCode === 'string'
        ? promoCode.trim().toUpperCase()
        : '';

    if (normalizedPromoCode === 'FOUNDERS' && foundersFreePassEnabled) {
        const grant = await upsertPremiumEntitlement(profile.id, {
            source: 'founders_code',
            effectiveTo: null
        });
        if (grant.success) {
            return {
                success: true,
                bypassed: true,
                redirectUrl: `${origin}/host?billing=founders_applied`
            };
        }
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return { success: false, error: 'Stripe is not configured' };
    }

    const priceId = resolvePriceId(priceCode);
    if (!priceId) {
        return { success: false, error: 'Invalid price code' };
    }

    const metadata = {
        profile_id: profile.id,
        promo_input: normalizedPromoCode
    };

    const params = {
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/host?billing=success`,
        cancel_url: `${origin}/host?billing=cancel`,
        allow_promotion_codes: true,
        customer_email: profile.email || undefined,
        metadata,
        subscription_data: {
            trial_period_days: 7,
            metadata
        }
    };

    if (normalizedPromoCode === 'FOUNDERS' && foundersPromoCode) {
        params.discounts = [{ promotion_code: foundersPromoCode }];
    }

    const session = await stripe.checkout.sessions.create(params);
    return { success: true, url: session.url };
}

export async function createPortalSession({ profile, origin }) {
    const stripe = getStripeClient();
    if (!stripe) {
        return { success: false, error: 'Stripe is not configured' };
    }

    const customers = await stripe.customers.list({ email: profile.email || undefined, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
        return { success: false, error: 'No Stripe customer found' };
    }

    const portal = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${origin}/host?billing=portal_return`
    });

    return { success: true, url: portal.url };
}

export function parseStripeEvent(rawBody, signatureHeader) {
    const stripe = getStripeClient();
    if (!stripe || !stripeWebhookSecret) return null;
    return stripe.webhooks.constructEvent(rawBody, signatureHeader, stripeWebhookSecret);
}

export async function syncEntitlementFromCheckoutSession(session) {
    const profileId = session?.metadata?.profile_id;
    if (!profileId && !session?.subscription) return;

    const subscriptionId = typeof session?.subscription === 'string'
        ? session.subscription
        : session?.subscription?.id;
    if (subscriptionId) {
        let subscription = await getSubscriptionById(subscriptionId);
        if (subscription) {
            if (!subscription.metadata?.profile_id && profileId) {
                const stripe = getStripeClient();
                if (stripe) {
                    try {
                        subscription = await stripe.subscriptions.update(subscriptionId, {
                            metadata: {
                                ...(subscription.metadata || {}),
                                profile_id: profileId
                            }
                        });
                    } catch {
                        subscription.metadata = { ...(subscription.metadata || {}), profile_id: profileId };
                    }
                } else {
                    subscription.metadata = { ...(subscription.metadata || {}), profile_id: profileId };
                }
            }
            await syncEntitlementFromSubscription(subscription);
            return;
        }
    }

    if (!profileId) return;

    await upsertPremiumEntitlement(profileId, {
        source: 'subscription',
        effectiveTo: null
    });
}

export async function getSubscriptionById(subscriptionId) {
    const stripe = getStripeClient();
    if (!stripe || !subscriptionId) return null;

    try {
        return await stripe.subscriptions.retrieve(subscriptionId);
    } catch {
        return null;
    }
}

export async function syncEntitlementFromSubscription(subscription) {
    const profileId = subscription?.metadata?.profile_id;
    if (!profileId) return { success: false, reason: 'missing_profile_id' };

    const status = subscription?.status || 'unknown';
    if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
        const source = status === 'trialing' ? 'trial' : 'subscription';
        const result = await upsertPremiumEntitlement(profileId, {
            source,
            effectiveTo: null
        });
        return { ...result, isPremium: true, status };
    }

    const result = await upsertFreeEntitlement(profileId, {
        source: `stripe_${status}`,
        effectiveTo: new Date().toISOString()
    });
    return { ...result, isPremium: false, status };
}

export async function syncEntitlementFromInvoice(invoice) {
    const subscriptionId = typeof invoice?.subscription === 'string'
        ? invoice.subscription
        : invoice?.subscription?.id;
    if (!subscriptionId) return { success: false, reason: 'missing_subscription' };

    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) return { success: false, reason: 'subscription_not_found' };
    return syncEntitlementFromSubscription(subscription);
}
