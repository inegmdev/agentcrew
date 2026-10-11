const test = require('node:test');
const assert = require('node:assert/strict');
const { ChatService, ROLE_CONTRACTS } = require('../../src/chat/chat-service');
const { TurnScheduler } = require('../../src/scheduler/turn-scheduler');
const { AgyAdapter } = require('../../src/providers/agy-adapter');
const { CodexAdapter } = require('../../src/providers/codex-adapter');

test('ChatService builds role instructions from PRD §6 role contracts', () => {
  const service = new ChatService({ liveProviders: false });
  
  // Verify role contracts definition
  assert.ok(ROLE_CONTRACTS['Business Analyst'], 'Must define BA contract');
  assert.ok(ROLE_CONTRACTS['Architect'], 'Must define Architect contract');
  assert.ok(ROLE_CONTRACTS['Developer'], 'Must define Developer contract');
  assert.ok(ROLE_CONTRACTS['Tester'], 'Must define Tester contract');

  const baContract = ROLE_CONTRACTS['Business Analyst'];
  assert.ok(baContract.accepts.includes('Source snapshots') || baContract.accepts.includes('clarification'));
  assert.ok(baContract.produces.includes('Requirement IDs') || baContract.produces.includes('spec revisions'));
  assert.ok(baContract.authority.includes('cannot silently change approved scope'));

  const prompt = service.buildRolePrompt({
    agentName: 'Alice',
    role: 'Business Analyst',
    gitContext: 'Head: 1234567 feat',
    userPrompt: 'What requirements are missing?'
  });

  assert.ok(prompt.includes('Alice'));
  assert.ok(prompt.includes('Business Analyst'));
  assert.ok(prompt.includes(baContract.authority));
  assert.ok(prompt.includes('What requirements are missing?'));
});

test('ChatService routes chat turns through TurnScheduler enforcing concurrency cap', async () => {
  const scheduler = new TurnScheduler({ maxConcurrency: 4 });
  let enqueueCalled = false;
  const originalEnqueue = scheduler.enqueue.bind(scheduler);
  scheduler.enqueue = (turnId, taskFn) => {
    enqueueCalled = true;
    return originalEnqueue(turnId, taskFn);
  };

  const service = new ChatService({
    scheduler,
    liveProviders: false
  });

  const response = await service.generateResponse('Alice', 'Hello');
  assert.ok(enqueueCalled, 'Turn must be enqueued through TurnScheduler');
  assert.ok(response.includes('Alice'));
  assert.ok(response.includes('[offline]'));
});

test('ChatService uses adapter buildSpawnArgs when invoking provider', async () => {
  let agySpawnArgsCalled = false;
  const mockAgy = new AgyAdapter();
  mockAgy.buildSpawnArgs = (opts) => {
    agySpawnArgsCalled = true;
    return ['-p', '--disable-slash-commands'];
  };

  const executedCommands = [];
  const mockPty = {
    activeSessions: new Map(),
    async execute(cmd, opts) {
      executedCommands.push({ cmd, opts });
      return { stdout: 'I am Alice', stderr: '', code: 0 };
    },
    async executeCommand(binary, args, opts) {
      executedCommands.push({ binary, args, opts });
      return { stdout: 'I am Alice', stderr: '', code: 0 };
    }
  };

  const service = new ChatService({
    liveProviders: true,
    adapters: { agy: mockAgy, codex: new CodexAdapter() },
    ptyManager: mockPty,
    which: (bin) => bin === 'agy'
  });

  const reply = await service.generateResponse('Alice', 'Explain the scope');
  assert.ok(agySpawnArgsCalled, 'Must call agyAdapter.buildSpawnArgs');
  assert.ok(reply.includes('I am Alice'));
});

test('ChatService fails over to next available provider if primary fails', async () => {
  const mockAgy = new AgyAdapter();
  mockAgy.buildSpawnArgs = () => ['-p'];

  const mockCodex = new CodexAdapter();
  mockCodex.buildSpawnArgs = () => ['exec', '--json'];

  const callLog = [];
  const mockPty = {
    async executeCommand(binary, args, opts) {
      callLog.push(binary);
      if (binary === 'agy') {
        return { stdout: '', stderr: 'Quota exceeded 429', code: 1 };
      }
      if (binary === 'codex') {
        return { stdout: '{"type":"item.completed","item":{"type":"agent_message","text":"Codex answers"}}', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: 'unknown', code: 1 };
    }
  };

  const service = new ChatService({
    liveProviders: true,
    adapters: { agy: mockAgy, codex: mockCodex },
    ptyManager: mockPty,
    which: () => true
  });

  const reply = await service.generateResponse('Alice', 'Hello Alice');
  assert.ok(callLog.includes('agy'), 'Must attempt agy first');
  assert.ok(callLog.includes('codex'), 'Must failover to codex');
  assert.ok(reply.includes('Codex answers'), `Reply must contain failover text: ${reply}`);
});
