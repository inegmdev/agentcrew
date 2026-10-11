const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { RequirementsManager } = require('../../src/planning/requirements-manager');

test('RequirementsManager imports CSV requirements with stable hashes', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-req-'));
  const manager = new RequirementsManager({ storageDir: tmpDir });

  const csvContent = 'id,title,description\nREQ-1,Login with email,Users can login with email\nREQ-2,Export CSV,Users can export data to CSV';
  const imported = await manager.importRequirements({
    type: 'csv',
    filename: 'customer-specs.csv',
    content: csvContent,
  });

  assert.ok(imported.id);
  assert.equal(imported.itemCount, 2);
  assert.ok(imported.hash, 'Must generate content sha256 hash');
  assert.equal(imported.items[0].id, 'REQ-1');
  assert.equal(imported.items[1].id, 'REQ-2');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('RequirementsManager creates joint planning package for operator approval', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-req-'));
  const manager = new RequirementsManager({ storageDir: tmpDir });

  const pkg = await manager.createPlanningPackage({
    iterationGoal: 'Deliver User Auth & Export',
    requirements: ['REQ-1', 'REQ-2'],
    tasks: [
      { title: 'Implement Auth', dod: ['Password encrypted', 'Session token issued'] },
      { title: 'Implement Export', dod: ['CSV generated', 'Download triggered'] },
    ],
    acceptanceChecklist: [
      'End-to-end login flow green',
      'Exported CSV matches database records',
    ],
  });

  assert.equal(pkg.status, 'awaiting_approval');
  assert.equal(pkg.tasks.length, 2);
  assert.equal(pkg.acceptanceChecklist.length, 2);

  const approved = await manager.approvePlanningPackage(pkg.id, { approver: 'operator' });
  assert.equal(approved.status, 'approved');
  assert.ok(approved.approvedAt);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('RequirementsManager imports active tasks directly from repo backlog', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-backlog-'));
  const tasksDir = path.join(tmpDir, 'backlog', 'tasks');
  fs.mkdirSync(tasksDir, { recursive: true });

  fs.writeFileSync(path.join(tasksDir, 'task-1 - Auth.md'), `---
id: TASK-1
title: Auth Service
status: To Do
priority: high
---
## Details
`);
  fs.writeFileSync(path.join(tasksDir, 'task-2 - Complete.md'), `---
id: TASK-2
title: Done Item
status: Done
---
`);

  const manager = new RequirementsManager({ storageDir: path.join(tmpDir, 'reqs') });
  const imported = await manager.importFromBacklog({ repoPath: tmpDir });

  assert.equal(imported.itemCount, 1);
  assert.equal(imported.items[0].id, 'TASK-1');
  assert.equal(imported.items[0].title, 'Auth Service');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
