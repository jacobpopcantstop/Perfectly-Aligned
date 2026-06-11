import test from 'node:test';
import assert from 'node:assert/strict';

import { getEntitlementsForProfile, getFreeEntitlements } from '../server/services/entitlements.js';

test('free entitlements unlock every game feature', async () => {
    const entitlements = getFreeEntitlements();

    assert.equal(entitlements.tier, 'free');
    assert.deepEqual(entitlements.features, {
        onlineMode: true,
        expansionDecks: true,
        curseCards: true,
        history: true
    });

    assert.deepEqual(await getEntitlementsForProfile('any-profile-id'), entitlements);
});
