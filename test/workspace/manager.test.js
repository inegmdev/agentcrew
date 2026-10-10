const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { WorkspaceManager } = require('../../src/workspace/manager');

test('WorkspaceManager initializes SQLite database and project identity', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-test-'));
  const manager = new WorkspaceManager({ baseDir: tmpDir });

  const project = await manager.initProject({
    repoPath: process.cwd(),
    name: 'test-project',
  });

  assert.ok(project.id, 'Project must have a UUID');
  assert.ok(fs.existsSync(project.dbPath), 'agentcrew.db must exist on disk');

  const agents = await manager.listAgents(project.id);
  assert.equal(agents.length, 13, 'Must seed default 13 agent identities');
  
  const roles = agents.map(a => a.role);
  assert.ok(roles.includes('Business Analyst'));
  assert.ok(roles.includes('Product Owner'));
  assert.ok(roles.includes('Architect'));
  assert.equal(roles.filter(r => r === 'Developer').length, 4);
  assert.equal(roles.filter(r => r === 'Tester').length, 4);
  assert.equal(roles.filter(r => r === 'Integrator').length, 2);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('WorkspaceManager retrieves project readiness check', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-test-'));
  const manager = new WorkspaceManager({ baseDir: tmpDir });

  const project = await manager.initProject({
    repoPath: process.cwd(),
    name: 'test-project',
  });

  const readiness = await manager.checkReadiness(project.id);
  assert.equal(readiness.repoLinked, true);
  assert.equal(readiness.databaseReady, true);
  assert.equal(readiness.rosterCount, 13);
  assert.ok(readiness.configuredProviders.length > 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
