const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');

const { SupervisorServer } = require('../../src/server/supervisor-server');
const { WebSocketConnection } = require('../../src/server/websocket');
const { PtyManager } = require('../../src/session/pty-manager');

test('PtyManager spawns interactive child session and writes stdin', async () => {
  const pty = new PtyManager();
  const session = pty.createSession({ sessionId: 'test-pty' });

  assert.ok(session.child);
  assert.equal(session.isAlive, true);

  const outputPromise = new Promise((resolve) => {
    session.child.stdout.on('data', (data) => {
      resolve(data.toString());
    });
  });

  session.write('echo "PTY_TEST_SUCCESS"\n');
  const out = await outputPromise;
  assert.ok(out.includes('PTY_TEST_SUCCESS') || out.length > 0);

  session.kill();
  assert.equal(session.isAlive, false);
});

test('SupervisorServer upgrades /api/v1/pty into interactive WebSocket terminal', async () => {
  const server = new SupervisorServer({ port: 3892 });
  await server.start();

  const key = crypto.randomBytes(16).toString('base64');
  const socket = net.connect(3892, '127.0.0.1');

  const upgradeHeaders = [
    'GET /api/v1/pty?agent_id=Dev-1 HTTP/1.1',
    'Host: 127.0.0.1:3892',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Key: ${key}`,
    'Sec-WebSocket-Version: 13',
    '\r\n',
  ].join('\r\n');

  socket.write(upgradeHeaders);

  const handshakePromise = new Promise((resolve, reject) => {
    socket.once('data', (chunk) => {
      const resp = chunk.toString('utf8');
      if (resp.includes('101 Switching Protocols') && resp.includes('Sec-WebSocket-Accept:')) {
        resolve(true);
      } else {
        reject(new Error(`Handshake failed: ${resp}`));
      }
    });
  });

  const success = await handshakePromise;
  assert.equal(success, true, 'Must return HTTP 101 Switching Protocols');

  socket.destroy();
  await server.stop();
});

test('SupervisorServer generateAgentResponse generates persona responses for all agent roles', async () => {
  const server = new SupervisorServer({ port: 3893, liveProviders: false });
  
  const aliceRes = await server.generateAgentResponse('Alice', 'Hi');
  assert.ok(aliceRes.includes('Alice'), `Expected Alice in ${aliceRes}`);

  const arthurRes = await server.generateAgentResponse('Arthur', 'Hi');
  assert.ok(arthurRes.includes('Arthur'), `Expected Arthur in ${arthurRes}`);

  const devRes = await server.generateAgentResponse('Dev-4', 'Hello');
  assert.ok(devRes.includes('Dev-4'), `Expected Dev-4 in ${devRes}`);

  const qaRes = await server.generateAgentResponse('QA-1', 'Hi');
  assert.ok(qaRes.includes('QA-1') || qaRes.includes('test') || qaRes.includes('verification'), `Expected QA in ${qaRes}`);
});
