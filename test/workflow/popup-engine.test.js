const test = require('node:test');
const assert = require('node:assert/strict');
const { PopupScopeChangeEngine } = require('../../src/workflow/popup-engine');

test('PopupScopeChangeEngine creates P-xxx ticket and compiles impact analysis', () => {
  const engine = new PopupScopeChangeEngine();

  const popup = engine.proposeScopeChange({
    title: 'Add CSV export format to reports',
    requestedBy: 'operator',
    affectedTasks: ['TASK-18'],
    reusableWorkSummary: 'Database schema and query logic reusable',
    discardedWorkSummary: 'Old JSON-only serializer discarded',
    estimatedDelayHours: 4,
  });

  assert.ok(popup.id.startsWith('P-'));
  assert.equal(popup.status, 'awaiting_approval');
  assert.equal(popup.affectedTasks[0], 'TASK-18');
  assert.equal(popup.impact.estimatedDelayHours, 4);
});

test('PopupScopeChangeEngine pauses affected tasks and requires operator sign-off', () => {
  const engine = new PopupScopeChangeEngine();

  const popup = engine.proposeScopeChange({
    title: 'Add CSV export',
    affectedTasks: ['TASK-18'],
  });

  // Verify affected tasks are marked paused
  assert.equal(engine.isTaskPaused('TASK-18'), true);
  assert.equal(engine.isTaskPaused('TASK-20'), false);

  // Approval commits the scope change and unpauses tasks
  const approved = engine.approveScopeChange(popup.id, {
    approver: 'operator',
    revisedCommitmentNotes: 'Added 4h budget to iteration',
  });

  assert.equal(approved.status, 'approved');
  assert.equal(engine.isTaskPaused('TASK-18'), false);
});
