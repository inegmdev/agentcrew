const test = require('node:test');
const assert = require('node:assert/strict');
const { ObservabilityEngine } = require('../../src/observability/engine');

test('ObservabilityEngine calculates cycle times, pass rates, and stacked utilization', () => {
  const engine = new ObservabilityEngine();

  engine.recordTaskMetric({
    taskId: 'TASK-18',
    cycleTimeMs: 120000,
    blockedTimeMs: 15000,
    qaResult: 'pass',
  });

  engine.recordTaskMetric({
    taskId: 'TASK-19',
    cycleTimeMs: 60000,
    blockedTimeMs: 5000,
    qaResult: 'pass',
  });

  const metrics = engine.getDeliveryMetrics();
  assert.equal(metrics.completedTaskCount, 2);
  assert.equal(metrics.averageCycleTimeMs, 90000);
  assert.equal(metrics.qaPassRate, 1.0);

  // Stacked agent utilization tracking
  engine.recordAgentActivity('Dev-1', {
    executingMs: 80000,
    queuedMs: 10000,
    humanWaitMs: 5000,
    idleMs: 5000,
  });

  const dev1Util = engine.getAgentUtilization('Dev-1');
  assert.equal(dev1Util.executingMs, 80000);
  assert.equal(dev1Util.queuedMs, 10000);
  assert.equal(dev1Util.totalObservedMs, 100000);
});

test('ObservabilityEngine compiles post-iteration retrospective report for PO assignment', () => {
  const engine = new ObservabilityEngine();

  engine.recordTaskMetric({
    taskId: 'TASK-18',
    cycleTimeMs: 100000,
    blockedTimeMs: 20000,
    qaResult: 'pass',
  });

  const retro = engine.generateRetrospectiveReport({
    iterationId: 'iter-october',
    goal: 'Deliver Auth & Export',
  });

  assert.equal(retro.iterationId, 'iter-october');
  assert.equal(retro.assignedTo, 'Peter (Product Owner)');
  assert.ok(retro.summary.includes('completed'));
});
