const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { WorkspaceManager } = require('../../src/workspace/manager');
const { RequirementsManager } = require('../../src/planning/requirements-manager');
const { TurnScheduler } = require('../../src/scheduler/turn-scheduler');
const { TakeoverController } = require('../../src/session/takeover-controller');
const { TaskLifecycleManager } = require('../../src/workflow/task-lifecycle');
const { QualityVerificationManager } = require('../../src/workflow/qa-verification');
const { IntegrationStrategyManager } = require('../../src/workflow/integration-strategy');
const { PopupScopeChangeEngine } = require('../../src/workflow/popup-engine');
const { ObservabilityEngine } = require('../../src/observability/engine');
const { VirtualTeamRoom } = require('../../src/ui/team-room');
const { IterationRunner } = require('../../src/workflow/iteration-runner');

test('IterationRunner completes end-to-end iteration across 13 agent identities and produces delivery bundle', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-e2e-'));
  const runner = new IterationRunner({ baseDir: tmpDir });

  const result = await runner.runIteration({
    repoPath: process.cwd(),
    iterationGoal: 'AI Team Workspace v1 Increment',
    rawRequirements: 'id,title,description\nREQ-01,User Auth,Email and password login\nREQ-02,Dashboard,Live Kanban and team room',
  });

  assert.equal(result.status, 'delivered');
  assert.equal(result.rosterCount, 13);
  assert.equal(result.completedTasks.length, 2);
  assert.equal(result.acceptanceChecklistPassed, true);
  assert.ok(result.deliveryEvidenceBundle.gitRevision);
  assert.ok(result.deliveryEvidenceBundle.testLogs);
  assert.ok(result.deliveryEvidenceBundle.retrospectiveReport);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
