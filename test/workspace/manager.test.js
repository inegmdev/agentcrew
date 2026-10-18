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

test('WorkspaceManager persists and retrieves agent provider session (TASK-29)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-test-'));
  const manager = new WorkspaceManager({ baseDir: tmpDir });

  const project = await manager.initProject({
    repoPath: process.cwd(),
    name: 'test-project',
  });

  // Verify non-existent session
  const none = await manager.getAgentSession(project.id, 'Alice');
  assert.equal(none, null);

  // Save session
  await manager.saveAgentSession(project.id, 'Alice', {
    provider: 'agy',
    sessionId: 'session-alice-uuid-999',
  });

  // Retrieve session
  const session = await manager.getAgentSession(project.id, 'Alice');
  assert.equal(session.provider, 'agy');
  assert.equal(session.sessionId, 'session-alice-uuid-999');

  // Update session
  await manager.saveAgentSession(project.id, 'Alice', {
    provider: 'agy',
    sessionId: 'session-alice-uuid-1000',
  });
  const updated = await manager.getAgentSession(project.id, 'Alice');
  assert.equal(updated.sessionId, 'session-alice-uuid-1000');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('WorkspaceManager persists explicit backup settings and separate provider conversations', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-provider-config-'));
  const manager = new WorkspaceManager({ baseDir: tmpDir });
  const project = await manager.initProject({ repoPath: tmpDir, name: 'test' });
  await manager.setAgentProviderConfig(project.id, 'QA-1', { backupProvider: 'codex', backupModel: 'o3' });
  const qa = (await manager.listAgents(project.id)).find((agent) => agent.name === 'QA-1');
  assert.equal(qa.backup_provider, 'codex');
  assert.equal(qa.backup_model, 'o3');
  await manager.saveAgentSession(project.id, 'QA-1', { provider: 'gemini', sessionId: 'gemini-1' });
  await manager.saveAgentSession(project.id, 'QA-1', { provider: 'codex', sessionId: 'codex-1' });
  assert.equal((await manager.getAgentSession(project.id, 'QA-1', 'gemini')).sessionId, 'gemini-1');
  assert.equal((await manager.getAgentSession(project.id, 'QA-1', 'codex')).sessionId, 'codex-1');
  await assert.rejects(manager.setAgentProviderConfig(project.id, 'QA-1', { backupProvider: 'gemini' }), /differ/);
  const restarted = new WorkspaceManager({ baseDir: tmpDir });
  const sameProject = await restarted.getOrInitProject({ repoPath: tmpDir, name: 'test' });
  assert.equal(sameProject.id, project.id);
  assert.equal((await restarted.listAgents(project.id)).find((agent) => agent.name === 'QA-1').backup_provider, 'codex');
});

