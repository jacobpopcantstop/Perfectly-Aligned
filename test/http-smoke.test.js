import test from 'node:test';
import assert from 'node:assert/strict';

import { startServer, stopServer } from '../server/index.js';

function toText(data) {
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
    if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
    return String(data);
}

class SocketIoProbe {
    constructor(baseUrl) {
        this.wsUrl = baseUrl.replace(/^http/, 'ws') + '/socket.io/?EIO=4&transport=websocket';
        this.ws = null;
        this.messages = [];
        this.waiters = [];
        this.nextAckId = 1;
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.addEventListener('message', (event) => {
            const message = toText(event.data);
            if (message === '2') {
                this.ws.send('3');
                return;
            }
            this.messages.push(message);
            this.flushWaiters();
        });
        await new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve, { once: true });
            this.ws.addEventListener('error', reject, { once: true });
        });
        await this.waitFor((message) => message.startsWith('0'));
        this.ws.send('40');
        await this.waitFor((message) => message.startsWith('40'));
    }

    flushWaiters() {
        for (const waiter of [...this.waiters]) {
            const index = this.messages.findIndex(waiter.predicate);
            if (index !== -1) {
                const [message] = this.messages.splice(index, 1);
                this.waiters.splice(this.waiters.indexOf(waiter), 1);
                clearTimeout(waiter.timeout);
                waiter.resolve(message);
            }
        }
    }

    waitFor(predicate, timeoutMs = 5_000) {
        const index = this.messages.findIndex(predicate);
        if (index !== -1) {
            const [message] = this.messages.splice(index, 1);
            return Promise.resolve(message);
        }
        return new Promise((resolve, reject) => {
            const waiter = {
                predicate,
                resolve,
                timeout: setTimeout(() => {
                    this.waiters.splice(this.waiters.indexOf(waiter), 1);
                    reject(new Error('Timed out waiting for Socket.IO message'));
                }, timeoutMs)
            };
            this.waiters.push(waiter);
        });
    }

    waitEvent(eventName) {
        return this.waitFor((message) => {
            const event = this.parseEvent(message);
            return event?.name === eventName;
        }).then((message) => this.parseEvent(message));
    }

    parseEvent(message) {
        if (!message.startsWith('42')) return null;
        let payloadStart = 2;
        while (/\d/.test(message[payloadStart] || '')) payloadStart += 1;
        const payload = JSON.parse(message.slice(payloadStart));
        return { name: payload[0], args: payload.slice(1) };
    }

    async emitAck(eventName, ...args) {
        const ackId = this.nextAckId++;
        this.ws.send(`42${ackId}${JSON.stringify([eventName, ...args])}`);
        const message = await this.waitFor((candidate) => candidate.startsWith(`43${ackId}`));
        return JSON.parse(message.slice(`43${ackId}`.length))[0];
    }

    close() {
        if (this.ws && this.ws.readyState < WebSocket.CLOSING) {
            this.ws.close();
        }
    }
}

test('running server exposes free config, security headers, CSP-friendly pages, and online Socket.IO flow', async (t) => {
    const server = await startServer({ port: 0, log: false });
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const sockets = [];

    t.after(async () => {
        sockets.forEach((socket) => socket.close());
        await stopServer();
    });

    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);

    const config = await fetch(`${baseUrl}/api/public-config`);
    assert.equal(config.status, 200);
    assert.deepEqual((await config.json()).features, { allFree: true });

    const hostPage = await fetch(`${baseUrl}/host/`);
    assert.equal(hostPage.status, 200);
    assert.equal(hostPage.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(hostPage.headers.get('x-frame-options'), 'DENY');
    assert.equal(hostPage.headers.get('referrer-policy'), 'no-referrer');
    assert.match(hostPage.headers.get('content-security-policy') || '', /script-src 'self' https:\/\/cdn\.jsdelivr\.net/);

    const hostHtml = await hostPage.text();
    assert.match(hostHtml, /\/assets\/config\/apply-links\.js/);
    assert.doesNotMatch(hostHtml, /document\.write/);
    assert.doesNotMatch(hostHtml, /supabase-js/);

    const playerPage = await fetch(`${baseUrl}/play`);
    assert.equal(playerPage.status, 200);
    const playerHtml = await playerPage.text();
    assert.match(playerHtml, /\/assets\/config\/apply-links\.js/);
    assert.doesNotMatch(playerHtml, /document\.write/);

    const host = new SocketIoProbe(baseUrl);
    sockets.push(host);
    await host.connect();

    const createRoom = await host.emitAck('host:createRoom', { offlineMode: false });
    assert.equal(createRoom.success, true);
    assert.match(createRoom.roomCode, /^[A-HJ-NP-Z]{4}$/);
    assert.equal(createRoom.gameState.offlineMode, false);

    const players = [];
    for (const playerName of ['Ada', 'Bert', 'Cleo']) {
        const player = new SocketIoProbe(baseUrl);
        sockets.push(player);
        await player.connect();
        const joined = await player.emitAck('player:joinRoom', {
            roomCode: createRoom.roomCode,
            playerName
        });
        assert.equal(joined.success, true);
        assert.equal(joined.gameState.players.length, players.length + 1);
        players.push(player);
    }

    const startedEvent = host.waitEvent('game:started');
    const started = await host.emitAck('host:startGame', {
        selectedDecks: ['core_white', 'creative_cyan', 'hypothetical_magenta'],
        timerDuration: 0,
        targetScore: 3,
        modifiersEnabled: true
    });
    assert.equal(started.success, true);

    const { args: [startedState] } = await startedEvent;
    assert.equal(startedState.gameStarted, true);
    assert.equal(startedState.gamePhase, 'alignment');
    assert.equal(startedState.players.length, 3);
    assert.deepEqual(startedState.settings.selectedDecks, ['core_white', 'creative_cyan', 'hypothetical_magenta']);
});
