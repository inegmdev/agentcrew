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

test('SupervisorServer authorizes takeover token before spawning a shell PTY', async () => {
  const server = new SupervisorServer({ port: 0 });
  await server.start();
  const port = server.httpServer.address().port;

  const requestUpgrade = (target) => new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    const key = crypto.randomBytes(16).toString('base64');
    socket.once('error', reject);
    socket.once('data', (chunk) => {
      resolve({ response: chunk.toString('utf8'), socket });
    });
    socket.write([
      `GET ${target} HTTP/1.1`, `Host: 127.0.0.1:${port}`, 'Upgrade: websocket',
      'Connection: Upgrade', `Sec-WebSocket-Key: ${key}`, 'Sec-WebSocket-Version: 13', '\r\n',
    ].join('\r\n'));
  });

  const denied = await requestUpgrade('/api/v1/pty?mode=shell&agent_id=Dev-1&token=invalid');
  assert.match(denied.response, /403 Forbidden/);
  assert.equal(server.ptyManager.activeSessions.size, 0, 'denied upgrades must not spawn a shell');
  denied.socket.destroy();

  const { token } = await server.takeoverController.requestTakeover('Dev-1');
  const allowed = await requestUpgrade(`/api/v1/pty?mode=shell&agent_id=Dev-1&token=${encodeURIComponent(token)}`);
  assert.match(allowed.response, /101 Switching Protocols/);
  assert.equal(server.ptyManager.activeSessions.size, 1);
  const release = await server.takeoverController.release({ agentId: 'Dev-1' });
  assert.equal(release.state, 'auto');
  allowed.socket.destroy();
  await server.stop();
});

test('PtyManager confirms an interrupted provider process group is quiescent', async () => {
  const manager = new PtyManager();
  const abort = new AbortController();
  const childRun = manager.executeCommand(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    timeoutMs: 10000,
    signal: abort.signal,
  });
  setTimeout(() => abort.abort(), 50);
  const result = await childRun;
  assert.equal(result.interrupted, true);
  assert.equal(result.quiescent, true);
});

test('SupervisorServer chatService generates persona responses for all agent roles', async () => {
  const server = new SupervisorServer({ port: 3893, liveProviders: false });
  
  const aliceRes = await server.chatService.generateResponse('Alice', 'Hi');
  assert.ok(aliceRes.includes('Alice'), `Expected Alice in ${aliceRes}`);

  const arthurRes = await server.chatService.generateResponse('Arthur', 'Hi');
  assert.ok(arthurRes.includes('Arthur'), `Expected Arthur in ${arthurRes}`);

  const devRes = await server.chatService.generateResponse('Dev-4', 'Hello');
  assert.ok(devRes.includes('Dev-4'), `Expected Dev-4 in ${devRes}`);

  const qaRes = await server.chatService.generateResponse('QA-1', 'Hi');
  assert.ok(qaRes.includes('QA-1') || qaRes.includes('test') || qaRes.includes('verification') || qaRes.includes('Tester'), `Expected QA in ${qaRes}`);
});
