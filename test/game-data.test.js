import { readFileSync } from 'node:fs';
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

test('host and player pages keep their copies of shared game data in sync', async () => {
    const data = await import('../shared/game-data.js');
    for (const file of ['public/host/host.js', 'public/player/player.js']) {
        const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
        for (const avatar of data.AVATARS) {
            assert.ok(source.includes(`'${avatar}'`), `${file} is missing avatar ${avatar}`);
        }
    }
    const host = readFileSync(new URL('../public/host/host.js', import.meta.url), 'utf8');
    for (const key of data.TOKEN_TYPE_KEYS) {
        assert.ok(host.includes(key), `host.js is missing token type ${key}`);
    }
    for (const code of data.ALIGNMENT_GRID_ORDER) {
        assert.ok(host.includes(`${code}: "${data.ALIGNMENT_NAMES[code]}"`) || host.includes(`${code}: '${data.ALIGNMENT_NAMES[code]}'`),
            `host.js alignment name for ${code} differs from shared/game-data.js`);
    }
});
