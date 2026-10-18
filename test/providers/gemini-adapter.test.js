const test = require('node:test');
const assert = require('node:assert/strict');
const { GeminiAdapter } = require('../../src/providers/gemini-adapter');

test('GeminiAdapter reports delegation control as unqualified even when installed', async () => {
  const adapter = new GeminiAdapter({ command: 'gemini' });
  const report = await adapter.probe({ which: () => '/usr/bin/gemini' });
  assert.equal(report.id, 'gemini');
  assert.equal(report.contract_version, 1);
  assert.equal(report.available, false);
  assert.match(report.reason, /delegation control is not qualified/);
  assert.deepEqual(report.capabilities, []);
});

test('GeminiAdapter probe reports missing runner as unavailable', async () => {
  const adapter = new GeminiAdapter({ command: 'gemini' });
  const report = await adapter.probe({ which: () => false });
  assert.equal(report.available, false);
  assert.match(report.reason, /not found on PATH/);
});

test('GeminiAdapter keeps headless arguments available for future qualification', () => {
  const adapter = new GeminiAdapter({ command: 'gemini' });
  const argv = adapter.buildSpawnArgs({
    cwd: '/tmp/workspace',
    sessionId: 'session-789',
    model: 'gemini-2.5-pro',
  });

  assert.ok(argv.includes('--output-format') || argv.includes('-p'), 'Must run headless');
  assert.equal(argv.includes('--disable-delegation'), false);
});
