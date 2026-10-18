const test = require('node:test');
const assert = require('node:assert/strict');

const { SupervisorServer } = require('../../src/server/supervisor-server');
const { TakeoverController } = require('../../src/session/takeover-controller');

test('session.exec routes natural language to chat and requires ownership for shell', async (t) => {
  const takeoverController = new TakeoverController();
  const chatMessages = [];
  const shellCommands = [];
  const server = new SupervisorServer({
    port: 0,
    takeoverController,
    liveProviders: false,
    chatService: {
      async resolveAgent(agentId) { return { name: agentId }; },
      async quiesceAgent() { return { quiescent: true }; },
      resumeAgent() {},
      async generateResponse(agentId, text) {
        chatMessages.push({ agentId, text });
        return 'chat reply';
      }
    },
    ptyManager: {
      killAll() {},
      async execute(command) {
        shellCommands.push(command);
        return { stdout: `ran: ${command}`, code: 0 };
      }
    }
  });

  await server.start();
  const baseUrl = `http://127.0.0.1:${server.httpServer.address().port}`;
  t.after(() => server.stop());
  let token;

  async function send(command, mode) {
    const response = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'session.exec',
        payload: { agent_id: 'Dev-1', command, mode, takeover_token: token }
      })
    });
    return { status: response.status, body: await response.json() };
  }

  const unauthorized = await send('!git status');
  assert.equal(unauthorized.status, 403);
  assert.deepEqual(shellCommands, []);

  const takeover = await fetch(`${baseUrl}/api/v1/commands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command_type: 'session.takeover', payload: { agent_id: 'Dev-1' } })
  });
  assert.equal(takeover.status, 200);
  token = (await takeover.json()).result.takeover_token;

  const chat = await send('find the riskiest module');
  assert.equal(chat.status, 200);
  assert.equal(chat.body.result.mode, 'chat');
  assert.deepEqual(chatMessages[0], { agentId: 'Dev-1', text: 'find the riskiest module' });
  assert.deepEqual(shellCommands, []);

  const shell = await send('!git status');
  assert.equal(shell.status, 200);
  assert.equal(shell.body.result.mode, 'shell');
  assert.equal(shell.body.result.command, 'git status');
  const explicitShell = await send('pwd', 'shell');
  assert.equal(explicitShell.status, 200);
  assert.equal(explicitShell.body.result.mode, 'shell');
  assert.deepEqual(shellCommands, ['git status', 'pwd']);
});
