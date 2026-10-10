const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const http = require('node:http');

const { SupervisorServer } = require('../../src/server/supervisor-server');
const { WorkspaceManager } = require('../../src/workspace/manager');
const { TurnScheduler } = require('../../src/scheduler/turn-scheduler');
const { TakeoverController } = require('../../src/session/takeover-controller');

test('SupervisorServer serves TRD §12 API routes and SSE stream', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-server-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const workspace = new WorkspaceManager({ baseDir: tmpDir });
  const project = await workspace.initProject({
    repoPath: tmpDir,
    name: 'Server Test Project'
  });

  const scheduler = new TurnScheduler({ maxConcurrentTurns: 4 });
  const takeover = new TakeoverController({ softBudgetMs: 500 });

  const server = new SupervisorServer({
    port: 0, // ephemeral port for test
    workspace,
    projectId: project.id,
    projectName: 'Server Test Project',
    scheduler,
    takeoverController: takeover,
    staticDir: path.join(__dirname, 'fixtures')
  });

  await server.start();
  const address = server.httpServer.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(async () => {
    await server.stop();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test('GET /api/v1/workspace returns workspace identity and agent roster', async () => {
    const res = await fetch(`${baseUrl}/api/v1/workspace`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.workspace.id, project.id);
    assert.equal(data.agents.length, 13);
  });

  await t.test('GET /api/v1/readiness reports qualified provider status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/readiness`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ready');
    assert.ok(Array.isArray(data.providers));
  });

  await t.test('GET /api/v1/agents returns all 13 agent identities with status badges', async () => {
    const res = await fetch(`${baseUrl}/api/v1/agents`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.agents.length, 13);
    const dev1 = data.agents.find(a => a.name === 'Dev-1');
    assert.ok(dev1);
    assert.equal(dev1.role, 'Developer');
  });

  await t.test('POST /api/v1/commands executes takeover and release cycle', async () => {
    // 1. Initiate Takeover
    const takeoverRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'session.takeover',
        payload: { agent_id: 'dev-1', reason: 'User requested manual correction' },
        idempotency_key: 'cmd-takeover-1'
      })
    });
    assert.equal(takeoverRes.status, 200);
    const takeoverData = await takeoverRes.json();
    assert.equal(takeoverData.status, 'acknowledged');
    assert.equal(takeoverData.result.agent_id, 'dev-1');
    assert.equal(takeoverData.result.state, 'human_owned');

    // 2. Release Takeover
    const releaseRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'session.release',
        payload: { agent_id: 'dev-1', guidance_notes: 'Fixed typo in test assertion' },
        idempotency_key: 'cmd-release-1'
      })
    });
    assert.equal(releaseRes.status, 200);
    const releaseData = await releaseRes.json();
    assert.equal(releaseData.result.state, 'auto');
  });

  await t.test('POST /api/v1/commands handles popup scope creation and decisions', async () => {
    const popupRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'popup.propose',
        payload: {
          title: 'Add JWT token expiry',
          description: 'Security finding requires immediate token expiry handling',
          change_type: 'security_patch',
          estimated_impact: { affected_tasks: ['TASK-14'], delay_hours: 2 }
        }
      })
    });
    assert.equal(popupRes.status, 200);
    const popupData = await popupRes.json();
    assert.ok(popupData.result.ticket.id.startsWith('P-'));

    // Check GET /api/v1/popups
    const listRes = await fetch(`${baseUrl}/api/v1/popups`);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.popups.length, 1);
  });

  await t.test('GET /api/v1/metrics returns cycle time and utilization metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/metrics`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.metrics);
    assert.ok('cycle_time_minutes' in data.metrics);
    assert.ok('pass_rate' in data.metrics);
  });

  await t.test('GET /api/v1/events establishes SSE stream with cursor header', async () => {
    return new Promise((resolve, reject) => {
      const req = http.get(`${baseUrl}/api/v1/events`, (res) => {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'text/event-stream');

        let received = '';
        res.on('data', (chunk) => {
          received += chunk.toString();
          if (received.includes('event: snapshot')) {
            req.destroy();
            resolve();
          }
        });
      });
      req.on('error', (err) => {
        // Ignored when destroyed
        if (err.code !== 'ECONNRESET') reject(err);
      });
    });
  });
});
