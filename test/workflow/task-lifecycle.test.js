const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { TaskLifecycleManager } = require('../../src/workflow/task-lifecycle');

test('TaskLifecycleManager manages task worktree paths and stage progressions', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-task-'));
  const manager = new TaskLifecycleManager({ baseDir: tmpDir });

  const task = await manager.claimTask({
    taskId: 'TASK-18',
    agentName: 'Dev-1',
  });

  assert.equal(task.stage, 'design');
  assert.equal(task.owner, 'Dev-1');
  assert.ok(task.worktreePath.includes('task-TASK-18'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('TaskLifecycleManager tracks design reviews and escalates after 2 failed rework cycles', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-task-'));
  const manager = new TaskLifecycleManager({ baseDir: tmpDir });

  await manager.claimTask({ taskId: 'TASK-18', agentName: 'Dev-1' });

  // Cycle 1 rejection
  const review1 = manager.submitReview({
    taskId: 'TASK-18',
    reviewer: 'Architect',
    verdict: 'reject',
    feedback: 'Missing database transaction safety',
  });
  assert.equal(review1.stage, 'rework');
  assert.equal(review1.reworkCount, 1);
  assert.equal(review1.escalatedToOperator, false);

  // Cycle 2 rejection -> escalation
  const review2 = manager.submitReview({
    taskId: 'TASK-18',
    reviewer: 'Architect',
    verdict: 'reject',
    feedback: 'Transaction isolation still not addressed',
  });
  assert.equal(review2.reworkCount, 2);
  assert.equal(review2.escalatedToOperator, true);
  assert.equal(review2.status, 'blocked_escalation');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
