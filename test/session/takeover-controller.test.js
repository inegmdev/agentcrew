const test = require('node:test');
const assert = require('node:assert/strict');
const { TakeoverController } = require('../../src/session/takeover-controller');

test('TakeoverController transitions from auto -> pausing -> human_owned within soft budget', async () => {
  const controller = new TakeoverController({
    sessionId: 'session-takeover-1',
    softBudgetMs: 50,
  });

  assert.equal(controller.state, 'auto');

  const acquirePromise = controller.requestTakeover();
  assert.equal(controller.state, 'pausing');

  await acquirePromise;
  assert.equal(controller.state, 'human_owned');
  assert.equal(controller.isAutonomousAllowed(), false);
});

test('TakeoverController authorizes human-directed tools and denies autonomous tools', async () => {
  const controller = new TakeoverController({
    sessionId: 'session-takeover-2',
    softBudgetMs: 10,
  });

  await controller.requestTakeover();

  // Autonomous attempts are denied
  const autoToolDecision = controller.evaluateToolCall({
    source: 'autonomous',
    toolName: 'read_file',
  });
  assert.equal(autoToolDecision.allowed, false);

  // Human operator decisions are allowed
  const humanToolDecision = controller.evaluateToolCall({
    source: 'human',
    toolName: 'read_file',
  });
  assert.equal(humanToolDecision.allowed, true);
});

test('TakeoverController releases session back to auto with guidance notes', async () => {
  const controller = new TakeoverController({
    sessionId: 'session-takeover-3',
    softBudgetMs: 10,
  });

  await controller.requestTakeover();
  assert.equal(controller.state, 'human_owned');

  const releaseResult = await controller.release({
    guidance: 'Fixed syntax error in config; resume implementation.',
  });

  assert.equal(controller.state, 'auto');
  assert.equal(releaseResult.guidance, 'Fixed syntax error in config; resume implementation.');
  assert.equal(controller.isAutonomousAllowed(), true);
});
