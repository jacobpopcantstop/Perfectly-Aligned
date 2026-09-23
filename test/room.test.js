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

function startRoundInDrawing(room) {
    const alignment = room.rollAlignment();
    if (alignment.isJudgeChoice) room.selectJudgeAlignment('LG');
    room.drawPrompts();
    room.selectPrompt(0);
}

test('judge cannot win their own round and non-submitters cannot win', () => {
    const room = new Room('RULE', 'host-1');
    addPlayers(room);
    room.startGame({ selectedDecks: ['core_white'] });
    startRoundInDrawing(room);
    room.submitDrawing('socket-1', 'data:image/png;base64,abc', '');
    assert.equal(room.collectSubmissions().success, true);

    assert.equal(room.selectWinner('socket-0').success, false); // judge
    assert.equal(room.selectWinner('socket-2').success, false); // no drawing
    assert.equal(room.selectWinner('socket-1').success, true);

    // Ending the drawing phase again must not reopen judging for a second point.
    assert.equal(room.collectSubmissions().success, false);
    assert.equal(room.selectWinner('socket-1').success, false);
    assert.equal(room.players.find((p) => p.id === 'socket-1').score, 1);
});

test('advancing twice does not skip a judge', () => {
    const room = new Room('ADV2', 'host-1');
    addPlayers(room);
    room.startGame({ selectedDecks: ['core_white'] });
    startRoundInDrawing(room);
    room.submitDrawing('socket-1', 'data:image/png;base64,abc', '');
    room.collectSubmissions();
    room.selectWinner('socket-1');

    assert.equal(room.advanceRound().success, true);
    assert.equal(room.advanceRound().success, false);
    assert.equal(room.getCurrentJudge().id, 'socket-1');
});

test('reconnect tokens never appear in room state and reconnect keeps submissions', () => {
    const room = new Room('RECO', 'host-1');
    addPlayers(room);
    room.startGame({ selectedDecks: ['core_white'] });
    assert.doesNotMatch(JSON.stringify(room.getState()), /token-/);

    startRoundInDrawing(room);
    room.submitDrawing('socket-1', 'data:image/png;base64,abc', '');
    assert.equal(room.reconnectPlayer('socket-1b', 'Player 2', 'wrong', 'next').success, false);
    assert.equal(room.reconnectPlayer('socket-1b', 'Player 2', 'token-1', 'next').success, true);
    room.collectSubmissions();
    assert.equal(room.selectWinner('socket-1b').success, true);
});

test('curse cards must be the drawn card and resolve once per phase', () => {
    const room = new Room('CURS', 'host-1');
    addPlayers(room, 4);
    room.startGame({ selectedDecks: ['core_white'] });
    startRoundInDrawing(room);
    room.submitDrawing('socket-1', 'data:image/png;base64,abc', '');
    room.collectSubmissions();
    room.selectWinner('socket-1');

    const phase = room.checkForModifierPhase();
    assert.equal(phase.hasModifierPhase, true);
    const forged = { id: 'forged', name: '<b>x</b>', description: 'x', icon: 'x' };
    assert.equal(room.applyCurse(1, forged).success, false);

    const drawn = room.drawCurseCard();
    assert.equal(drawn.success, true);
    assert.equal(room.drawCurseCard().success, false);

    const judge = room.getCurrentJudge();
    assert.equal(room.applyCurse(judge.id, drawn.modifier).success, false);
    assert.equal(room.applyCurse(phase.curser.id, drawn.modifier).success, false);
    const target = room.players.find((p) => !p.isJudge && p !== phase.curser);
    assert.equal(room.applyCurse(target.id, drawn.modifier).success, true);
    assert.equal(room.applyCurse(target.id, drawn.modifier).success, false);
    assert.equal(room.pendingModifiers.length, 1);
});

test('steals reject self-targeting and invalid deck selections are refused', () => {
    const room = new Room('STEA', 'host-1');
    addPlayers(room);
    assert.equal(room.startGame({ selectedDecks: ['not_a_deck'] }).success, false);
    assert.equal(room.startGame({ selectedDecks: ['core_white'] }).success, true);
    assert.equal(room.startGame({ selectedDecks: ['core_white'] }).success, false);

    const stealer = room.players[1];
    stealer.tokens.mindReader = 3;
    stealer.score = 1;
    assert.equal(room.executeSteal(stealer.id, stealer.id).success, false);
    assert.equal(stealer.tokens.mindReader, 3);
});

test('prompt deck reshuffles instead of running dry', () => {
    const room = new Room('DECK', 'host-1');
    addPlayers(room);
    room.startGame({ selectedDecks: ['core_white'] });
    room.availableCards = room.availableCards.slice(0, 2);
    room.gamePhase = 'prompts';
    assert.equal(room.drawPrompts().success, true);
});

function finishRound(room, winnerId) {
    startRoundInDrawing(room);
    room.submitDrawing(winnerId, 'data:image/png;base64,abc', '');
    room.collectSubmissions();
    return room.selectWinner(winnerId);
}

test('held curse can be played in a later curse phase', () => {
    const room = new Room('HELD', 'host-1');
    addPlayers(room, 4);
    room.startGame({ selectedDecks: ['core_white'] });
    finishRound(room, 'socket-1');

    const first = room.checkForModifierPhase();
    const curser = first.curser;
    const card = room.drawCurseCard().modifier;
    assert.equal(room.holdCurse(card).success, true);
    assert.equal(curser.heldCurse, card);

    // Next curse phase with the same curser: the held card applies without a draw.
    room.advanceRound();
    finishRound(room, room.players.find((p) => !p.isJudge && p !== curser).id);
    // Make the original curser the only player in last place.
    room.players.forEach((p) => { if (p !== curser) p.score = 2; });
    curser.score = 0;
    const second = room.checkForModifierPhase();
    assert.equal(second.curser, curser);
    assert.equal(second.hasHeldCurse, true);
    const target = room.players.find((p) => !p.isJudge && p !== curser);
    assert.equal(room.applyCurse(target.id, { id: card.id }).success, true);
    assert.equal(curser.heldCurse, null);
});

test('re-rolling prompts costs the judge a token', () => {
    const room = new Room('ROLL', 'host-1');
    addPlayers(room);
    room.startGame({ selectedDecks: ['core_white'] });
    const alignment = room.rollAlignment();
    if (alignment.isJudgeChoice) room.selectJudgeAlignment('LG');

    const first = room.drawPrompts();
    assert.equal(first.success, true);
    assert.equal(first.isReroll, false);

    assert.equal(room.drawPrompts().success, false); // judge has no tokens

    const judge = room.getCurrentJudge();
    judge.tokens.plotTwist = 1;
    const reroll = room.drawPrompts();
    assert.equal(reroll.success, true);
    assert.equal(reroll.isReroll, true);
    assert.equal(judge.tokens.plotTwist, 0);
});

test('disconnected players are skipped when the judge rotates', () => {
    const room = new Room('SKIP', 'host-1');
    addPlayers(room, 4);
    room.startGame({ selectedDecks: ['core_white'] });
    finishRound(room, 'socket-2');
    room.setPlayerDisconnected('socket-1');

    assert.equal(room.advanceRound().success, true);
    assert.equal(room.getCurrentJudge().id, 'socket-2');
});
