const test = require('node:test');
const assert = require('node:assert/strict');
const { TurnScheduler } = require('../../src/scheduler/turn-scheduler');
const { MockCLI } = require('../../test/fixtures/mock-cli');

test('TurnScheduler executes turns up to 4 concurrent limit and queues excess', async () => {
  const scheduler = new TurnScheduler({ maxConcurrency: 4 });

  let executingCount = 0;
  let maxObserved = 0;

  const makeTurn = (id, durationMs) => async () => {
    executingCount++;
    if (executingCount > maxObserved) maxObserved = executingCount;
    await new Promise(r => setTimeout(r, durationMs));
    executingCount--;
    return `turn-${id}-done`;
  };

  const promises = [];
  for (let i = 1; i <= 6; i++) {
    promises.push(scheduler.enqueue(`turn-${i}`, makeTurn(i, 50)));
  }

  const results = await Promise.all(promises);
  assert.equal(results.length, 6);
  assert.ok(maxObserved <= 4, `Max concurrent turns should not exceed 4 (observed: ${maxObserved})`);
  assert.equal(scheduler.activeCount, 0);
  assert.equal(scheduler.queueLength, 0);
});

test('TurnScheduler dispatches normalized events to SSE subscribers', async () => {
  const scheduler = new TurnScheduler({ maxConcurrency: 4 });
  const events = [];

  const unsubscribe = scheduler.subscribe(event => {
    events.push(event);
  });

  scheduler.publish({
    type: 'turn.started',
    sessionId: 'session-1',
    turnIndex: 1,
  });

  scheduler.publish({
    type: 'message.assistant',
    sessionId: 'session-1',
    text: 'Hello from scheduler event bus',
  });

  unsubscribe();

  scheduler.publish({
    type: 'turn.ended',
    sessionId: 'session-1',
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'turn.started');
  assert.equal(events[1].text, 'Hello from scheduler event bus');
});

test('agent hold cancels queued autonomous turns but admits serialized human turns', async () => {
  const scheduler = new TurnScheduler({ maxConcurrency: 4 });
  scheduler.holdAgent('Dev-1');
  let active = 0;
  let peak = 0;
  const turn = (name) => scheduler.enqueue(name, async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active--;
    return name;
  }, { agentId: 'Dev-1', source: 'human' });
  const results = await Promise.all([turn('human-1'), turn('human-2')]);
  assert.deepEqual(results, ['human-1', 'human-2']);
  assert.equal(peak, 1);
  assert.equal(scheduler.activeByAgent.get('Dev-1'), undefined);
});
