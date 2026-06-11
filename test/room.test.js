import test from 'node:test';
import assert from 'node:assert/strict';

import Room from '../server/game/Room.js';

function addPlayers(room, count = 3) {
    for (let i = 0; i < count; i += 1) {
        const result = room.addPlayer(`socket-${i}`, `Player ${i + 1}`, null, `token-${i}`);
        assert.equal(result.success, true);
    }
}

test('room can start with expansion decks and curses enabled for free', () => {
    const room = new Room('FREE', 'host-1');
    addPlayers(room);

    const result = room.startGame({
        selectedDecks: ['core_white', 'creative_cyan', 'hypothetical_magenta'],
        modifiersEnabled: true,
        timerDuration: 60,
        targetScore: 3
    });

    assert.equal(result.success, true);
    assert.equal(room.gameStarted, true);
    assert.equal(room.gamePhase, 'alignment');
    assert.equal(room.modifiersEnabled, true);
    assert.deepEqual(room.settings.selectedDecks, ['core_white', 'creative_cyan', 'hypothetical_magenta']);
    assert.ok(room.availableCards.length > 3);
});

test('full round flow awards a point and advances the judge', () => {
    const room = new Room('FLOW', 'host-1');
    addPlayers(room);
    assert.equal(room.startGame({ selectedDecks: ['core_white'], timerDuration: 0 }).success, true);

    const alignment = room.rollAlignment();
    assert.equal(alignment.success, true);
    if (alignment.isJudgeChoice) {
        assert.equal(room.selectJudgeAlignment('LG').success, true);
    }

    const prompts = room.drawPrompts();
    assert.equal(prompts.success, true);
    assert.equal(prompts.prompts.length, 3);

    const prompt = room.selectPrompt(0);
    assert.equal(prompt.success, true);
    assert.equal(room.gamePhase, 'drawing');

    assert.equal(room.submitDrawing('socket-1', 'data:image/png;base64,abc', '').success, true);
    assert.equal(room.submitDrawing('socket-2', 'data:image/png;base64,def', '').success, true);

    room.collectSubmissions();
    assert.equal(room.gamePhase, 'judging');
    assert.equal(room.getSubmissionsForJudging().length, 2);

    const winner = room.selectWinner('socket-1');
    assert.equal(winner.success, true);
    assert.equal(room.players.find((p) => p.id === 'socket-1').score, 1);

    const next = room.advanceRound();
    assert.equal(next.success, true);
    assert.equal(room.currentRound, 2);
    assert.equal(room.getCurrentJudge().id, 'socket-1');
});
