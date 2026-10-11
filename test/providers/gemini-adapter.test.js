const test = require('node:test');
const assert = require('node:assert/strict');
const { GeminiAdapter } = require('../../src/providers/gemini-adapter');

test('GeminiAdapter probe identifies availability and declares required capabilities', async () => {
  const adapter = new GeminiAdapter({ command: 'gemini' });
  const report = await adapter.probe();
  assert.equal(report.id, 'gemini');
  assert.equal(report.contract_version, 1);
  assert.ok(report.capabilities.includes('stream_messages'));
  assert.ok(report.capabilities.includes('disable_native_delegation'));
});

test('GeminiAdapter builds spawn arguments disabling unmanaged delegation', () => {
  const adapter = new GeminiAdapter({ command: 'gemini' });
  const argv = adapter.buildSpawnArgs({
    cwd: '/tmp/workspace',
    sessionId: 'session-789',
    model: 'gemini-2.5-pro',
  });

  assert.ok(argv.includes('--output-format') || argv.includes('-p'), 'Must run headless');
  assert.ok(argv.includes('--no-subagents') || argv.includes('--disable-delegation'), 'Must enforce roster delegation');
});
