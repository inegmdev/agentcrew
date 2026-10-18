const test = require('node:test');
const assert = require('node:assert/strict');
const { TakeoverController } = require('../../src/session/takeover-controller');

test('takeover ownership is per agent and token-bound', async () => {
  const controller = new TakeoverController({ quiesceAgent: async () => ({ quiescent: true }) });
  const first = await controller.requestTakeover('Dev-1');
  const second = await controller.requestTakeover('Dev-2');
  assert.equal(controller.getState('Dev-1'), 'human_owned');
  assert.equal(controller.getState('Dev-2'), 'human_owned');
  assert.equal(controller.validateToken('Dev-1', first.token), true);
  assert.equal(controller.validateToken('Dev-1', second.token), false);
});

test('concurrent tab takeover conflicts and uncertain quiescence stays blocked', async () => {
  let finish;
  const controller = new TakeoverController({
    softBudgetMs: 100,
    quiesceAgent: () => new Promise((resolve) => { finish = resolve; }),
  });
  const pending = controller.requestTakeover('Dev-1');
  await assert.rejects(controller.requestTakeover('Dev-1'), { code: 'TAKEOVER_CONFLICT' });
  finish({ quiescent: false, reason: 'process exit unknown' });
  await assert.rejects(pending, { code: 'TAKEOVER_BLOCKED' });
  assert.equal(controller.getState('Dev-1'), 'blocked');
  assert.equal(controller.validateToken('Dev-1', 'anything'), false);
});

test('release requires owned session and records guidance', async () => {
  const controller = new TakeoverController({ quiesceAgent: async () => ({ quiescent: true }) });
  await controller.requestTakeover('Dev-1');
  const release = await controller.release({ agentId: 'Dev-1', guidance: 'Resume from the repaired config.' });
  assert.equal(release.guidance, 'Resume from the repaired config.');
  assert.equal(controller.getState('Dev-1'), 'auto');
});
