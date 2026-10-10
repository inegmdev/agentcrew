const test = require('node:test');
const assert = require('node:assert/strict');
const { CodexAdapter } = require('../../src/providers/codex-adapter');

test('CodexAdapter probe returns capabilities matching TRD §5', async () => {
  const adapter = new CodexAdapter({ command: 'codex' });
  const report = await adapter.probe();
  assert.equal(report.id, 'codex');
  assert.equal(report.contract_version, 1);
  assert.ok(report.capabilities.includes('stream_messages'));
  assert.ok(report.capabilities.includes('tool_events'));
  assert.ok(report.capabilities.includes('permission_decisions'));
  assert.ok(report.capabilities.includes('disable_native_delegation'));
});

test('CodexAdapter builds correct CLI arguments for non-interactive execution with JSON output', () => {
  const adapter = new CodexAdapter({ command: 'codex' });
  const argv = adapter.buildSpawnArgs({
    cwd: '/tmp/workspace',
    sessionId: 'session-456',
    model: 'o3',
    resumeFrom: 'session-prev',
  });

  assert.equal(argv[0], 'exec', 'Must use codex exec subcommand');
  assert.ok(argv.includes('--json'), 'Must include --json for JSONL event streaming');
  assert.ok(argv.includes('--cd'), 'Must set working directory');
  assert.ok(argv.includes('/tmp/workspace'));
  assert.ok(argv.includes('--model'));
  assert.ok(argv.includes('o3'));
  assert.ok(argv.includes('-c'));
  assert.ok(argv.includes('features.multi_agent=false'), 'Must disable native multi-agent delegation');
});

test('CodexAdapter normalizes Codex JSONL events into ProviderEvents', () => {
  const adapter = new CodexAdapter({ command: 'codex' });
  const rawLine = JSON.stringify({
    type: 'item_completed',
    item: {
      type: 'agent_message',
      text: 'Codex completed analysis',
    },
  });

  const event = adapter.parseStreamEvent(rawLine);
  assert.equal(event.type, 'message.assistant');
  assert.equal(event.text, 'Codex completed analysis');
});
