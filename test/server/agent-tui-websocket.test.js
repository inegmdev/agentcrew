const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const { SupervisorServer } = require('../../src/server/supervisor-server');
const { WebSocketConnection } = require('../../src/server/websocket');

test('agent CLI PTY accepts input/resize, reattaches after refresh, and exits before release', async () => {
  const writes = [];
  const sizes = [];
  let terminated = false;
  let spawned = 0;
  const terminal = new EventEmitter();
  terminal.session = { sessionId: 'native-42' };
  terminal.output = 'previous output';
  terminal.start = () => { spawned++; return terminal; };
  terminal.write = (data) => writes.push(data);
  terminal.resize = (cols, rows) => sizes.push([cols, rows]);
  terminal.terminateTree = async () => { terminated = true; return true; };
  const server = new SupervisorServer({
    liveProviders: false,
    which: (name) => name === 'codex',
    agentTerminalFactory: () => terminal,
  });
  server.chatService.resolveAgent = async () => ({ name: 'Dev-1', provider: 'codex', model: 'o3' });
  server.chatService.getAgentSession = async () => ({ sessionId: 'native-42', provider: 'codex' });
  server.takeoverController.sessions.set('Dev-1', { state: 'human_owned', token: 'test-token' });
  const sockets = [];
  const accept = WebSocketConnection.accept;
  WebSocketConnection.accept = () => {
    const ws = new EventEmitter();
    ws.isClosed = false;
    ws.frames = [];
    ws.send = (frame) => ws.frames.push(JSON.parse(frame));
    ws.close = () => { ws.isClosed = true; ws.emit('close'); };
    sockets.push(ws);
    return ws;
  };
  try {
    const request = { url: '/api/v1/pty?mode=agent_tui&agent_id=Dev-1&token=test-token', headers: { host: 'localhost', 'sec-websocket-key': 'test-key' } };
    await server.handleUpgrade(request, {}, Buffer.alloc(0));
    assert.equal(sockets[0].frames[0].resumeRequested, true);
    assert.equal(sockets[0].frames[1].data, 'previous output');
    sockets[0].emit('message', JSON.stringify({ type: 'input', data: 'hello\r' }));
    sockets[0].emit('message', JSON.stringify({ type: 'resize', cols: 90, rows: 25 }));
    terminal.emit('data', '\x1b[31mCLI output');
    assert.deepEqual(writes, ['hello\r']);
    assert.deepEqual(sizes, [[90, 25]]);
    assert.equal(sockets[0].frames.at(-1).data, '\x1b[31mCLI output');
    sockets[0].close();
    await server.handleUpgrade(request, {}, Buffer.alloc(0));
    assert.equal(spawned, 1, 'refresh must reconnect to the same running PTY');
    const parallel = { code: null, writeHead(code) { this.code = code; }, end(body) { this.body = JSON.parse(body); } };
    await server.handleCommand({ command_type: 'session.exec', payload: {
      agent_id: 'Dev-1', takeover_token: 'test-token', mode: 'chat', command: 'parallel turn',
    } }, parallel);
    assert.equal(parallel.code, 409, 'headless chat must not run beside the interactive CLI');
    const response = { writeHead() {}, end(body) { this.body = JSON.parse(body); } };
    await server.handleCommand({ action: 'release', agent_id: 'Dev-1', takeover_token: 'test-token' }, response);
    assert.equal(response.body.status, 'acknowledged');
    assert.equal(terminated, true);
  } finally {
    WebSocketConnection.accept = accept;
  }
});
