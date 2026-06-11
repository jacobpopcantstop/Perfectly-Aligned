import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildPromptPool,
    createInitialTokenState,
    sanitizePlayerName,
    TOKEN_TYPE_KEYS
} from '../shared/game-data.js';

test('sanitizePlayerName trims, strips angle brackets, and enforces max length', () => {
    assert.equal(sanitizePlayerName('  <Judge Judy>  ', 20), 'Judge Judy');
    assert.equal(sanitizePlayerName('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5), 'ABCDE');
    assert.equal(sanitizePlayerName('   '), null);
});

test('buildPromptPool ignores unknown decks but keeps valid expansion decks', () => {
    const coreOnly = buildPromptPool(['core_white']);
    const expanded = buildPromptPool(['core_white', 'creative_cyan', 'hypothetical_magenta', 'not_a_deck']);

    assert.ok(coreOnly.length > 0);
    assert.ok(expanded.length > coreOnly.length);
});

test('createInitialTokenState initializes every token count to zero', () => {
    const tokens = createInitialTokenState();
    assert.deepEqual(Object.keys(tokens), TOKEN_TYPE_KEYS);
    assert.ok(Object.values(tokens).every((count) => count === 0));
});
