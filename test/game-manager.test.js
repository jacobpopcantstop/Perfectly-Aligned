import test from 'node:test';
import assert from 'node:assert/strict';

import GameManager from '../server/game/GameManager.js';

test('game manager creates unique room codes and reports stats', () => {
    const manager = new GameManager();
    const first = manager.createRoom('host-1');
    const second = manager.createRoom('host-2');

    assert.match(first.code, /^[A-HJ-NP-Z]{4}$/);
    assert.match(second.code, /^[A-HJ-NP-Z]{4}$/);
    assert.notEqual(first.code, second.code);
    assert.deepEqual(manager.getStats(), {
        totalRooms: 2,
        activeGames: 0,
        totalPlayers: 0
    });

    manager.shutdown();
});

test('game manager removes inactive rooms', () => {
    const manager = new GameManager({ inactiveTimeoutMs: 1 });
    const room = manager.createRoom('host-1');
    room.lastActivity = Date.now() - 10_000;

    const removed = manager.cleanupInactiveRooms();

    assert.deepEqual(removed, [room.code]);
    assert.equal(manager.getRoom(room.code), undefined);
    assert.equal(manager.getStats().totalRooms, 0);
});
