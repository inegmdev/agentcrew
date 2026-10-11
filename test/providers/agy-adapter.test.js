const test = require('node:test');
const assert = require('node:assert/strict');
const { AgyAdapter } = require('../../src/providers/agy-adapter');

test('AgyAdapter probe returns capabilities matching TRD §5', async () => {
  const adapter = new AgyAdapter({
    command: 'agy',
  });
  const report = await adapter.probe();
  assert.equal(report.id, 'agy');
  assert.equal(report.contract_version, 1);
  assert.ok(report.capabilities.includes('stream_messages'));
  assert.ok(report.capabilities.includes('interrupt_turn'));
  assert.ok(report.capabilities.includes('disable_native_delegation'));
});

test('AgyAdapter builds correct CLI arguments for stream-json session with disabled native delegation', () => {
  const adapter = new AgyAdapter({ command: 'agy' });
  const argv = adapter.buildSpawnArgs({
    cwd: '/tmp/workspace',
    sessionId: 'session-123',
    resumeFrom: null,
    model: 'gemini-2.5-pro',
  });

  assert.ok(argv.includes('-p'), 'Must run in print/stream mode');
  assert.ok(argv.includes('--input-format'), 'Must specify --input-format');
  assert.ok(argv.includes('stream-json'), 'Must use stream-json input');
  assert.ok(argv.includes('--output-format'), 'Must specify --output-format');
  assert.ok(argv.includes('--disable-slash-commands'), 'Must disable slash commands / sub-agents');
});

test('AgyAdapter normalizes stream-json chunks into ProviderEvents', async () => {
  const adapter = new AgyAdapter({ command: 'agy' });
  const rawNdjson = JSON.stringify({
    type: 'message.assistant',
    text: 'Hello operator',
  });

  const parsed = adapter.parseStreamEvent(rawNdjson);
  assert.equal(parsed.type, 'message.assistant');
  assert.equal(parsed.text, 'Hello operator');
});
