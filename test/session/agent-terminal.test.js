const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const { AgentTerminal } = require('../../src/session/agent-terminal');

function fakeSpawn(log) {
  return (command, args, options) => {
    log.push({ command, args, options });
    const child = new EventEmitter();
    child.onData = (fn) => child.on('data', fn);
    child.onExit = (fn) => child.on('exit', fn);
    child.write = (text) => child.emit('written', text);
    child.resize = (cols, rows) => child.emit('resized', { cols, rows });
    child.kill = () => child.emit('exit', { exitCode: 0, signal: 1 });
    return child;
  };
}

test('Codex terminal resumes the exact saved native conversation through a PTY', async () => {
  const log = [];
  const terminal = new AgentTerminal({
    agent: { name: 'Arthur', provider: 'codex', model: 'o3' },
    session: { provider: 'codex', sessionId: 'thread-42' },
    cwd: '/tmp/project', which: () => true, spawn: fakeSpawn(log),
  }).start({ cols: 100, rows: 30 });
  assert.deepEqual(log[0].args, ['resume', '--include-non-interactive', 'thread-42']);
  assert.equal(log[0].options.cols, 100);
  assert.equal(log[0].options.rows, 30);
  const writes = [];
  terminal.pty.on('written', (data) => writes.push(data));
  terminal.write('hello\r');
  terminal.resize(80, 20);
  assert.deepEqual(writes, ['hello\r']);
  assert.equal(await terminal.terminateTree(), true);
});

test('agy terminal resumes its own conversation and missing Gemini remains disconnected', () => {
  const log = [];
  new AgentTerminal({
    agent: { name: 'Alice', provider: 'agy', model: 'model-x' },
    session: { provider: 'agy', sessionId: 'agy-conv' },
    cwd: '/tmp/project', which: () => true, spawn: fakeSpawn(log),
  }).start();
  assert.deepEqual(log[0].args, ['--conversation', 'agy-conv', '--model', 'model-x']);
  assert.throws(() => new AgentTerminal({
    agent: { name: 'QA-1', provider: 'gemini' }, cwd: '/tmp/project', which: () => false,
  }).start(), /not qualified/);
});
