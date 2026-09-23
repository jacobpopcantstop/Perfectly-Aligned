import test from 'node:test';
import assert from 'node:assert/strict';

// Must be set before the server module reads it.
process.env.LOBBY_DISCONNECT_GRACE_MS = '200';
const { startServer, stopServer, gameManager } = await import('../server/index.js');

function connect(baseUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(baseUrl.replace(/^http/, 'ws') + '/socket.io/?EIO=4&transport=websocket');
        const acks = new Map();
        let nextAck = 1;
        ws.addEventListener('error', reject, { once: true });
        ws.addEventListener('message', (event) => {
            const message = String(event.data);
            if (message === '2') return ws.send('3');
            if (message.startsWith('0')) return ws.send('40');
            if (message.startsWith('40')) {
                return resolve({
                    ws,
                    emitAck(name, ...args) {
                        const id = nextAck++;
                        ws.send(`42${id}${JSON.stringify([name, ...args])}`);
                        return new Promise((done) => acks.set(id, done));
                    }
                });
            }
            const ack = /^43(\d+)(.*)$/s.exec(message);
            if (ack) acks.get(Number(ack[1]))?.(JSON.parse(ack[2])[0]);
        });
    });
}

test('a player who drops out of the lobby frees their seat after the grace period', async (t) => {
    const server = await startServer({ port: 0, log: false });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const host = await connect(baseUrl);
    const player = await connect(baseUrl);
    t.after(async () => {
        host.ws.close();
        await stopServer();
    });

    const { roomCode } = await host.emitAck('host:createRoom', {});
    assert.equal((await player.emitAck('player:joinRoom', { roomCode, playerName: 'Dana' })).success, true);
    assert.equal(gameManager.getRoom(roomCode).players.length, 1);

    player.ws.close();
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.equal(gameManager.getRoom(roomCode).players.length, 0);
});
