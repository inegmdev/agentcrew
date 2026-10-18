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
    staticDir: path.join(__dirname, 'fixtures'),
    liveProviders: false
  });
  let providerFailure = false;
  let capturedReview = null;
  server.liveProviders = true;
  server.repoDataService.getPullRequestReviewContext = async (number) => ({
    number,
    title: 'Live provider review title',
    author: 'review-author',
    body: 'PR description from GitHub',
    baseBranch: 'main',
    headBranch: 'feature/review',
    diff: 'diff --git a/src/example.js b/src/example.js\n+const reviewed = true;',
    diffTruncated: false
  });
  server.chatService = {
    async generateResponse(agentId, prompt, options) {
      capturedReview = { agentId, prompt, options };
      if (providerFailure) throw new Error('codex: quota exceeded');
      return '[Arthur (Architect)]: Provider reviewed the supplied diff.';
    }
  };

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
    assert.equal(takeoverData.result.agent_id, 'Dev-1');
    assert.equal(takeoverData.result.state, 'human_owned');
    const token = takeoverData.result.takeover_token;

    const conflictRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command_type: 'session.takeover', payload: { agent_id: 'dev-1' } })
    });
    assert.equal(conflictRes.status, 409, 'a second tab cannot take the same agent');

    const invalidChatRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command_type: 'session.exec', payload: { agent_id: 'dev-1', command: 'hello', mode: 'chat', takeover_token: 'wrong' } })
    });
    assert.equal(invalidChatRes.status, 403);

    const validChatRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command_type: 'session.exec', payload: { agent_id: 'dev-1', command: 'hello', mode: 'chat', takeover_token: token } })
    });
    assert.equal(validChatRes.status, 200, 'human chat is allowed during an agent hold');

    // 2. Release Takeover
    const releaseRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'session.release',
        payload: { agent_id: 'dev-1', takeover_token: token, guidance_notes: 'Fixed typo in test assertion' },
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

  await t.test('agent.ask sends live PR context to the provider and returns its answer', async () => {
    const askRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'agent.ask',
        payload: {
          agent_id: 'Arthur (Architect)',
          pr_number: 26,
          pr_title: 'Interactive Web UI',
          question: 'What is the architectural blast radius?',
          author: 'Dev-2'
        }
      })
    });
    assert.equal(askRes.status, 200);
    const askData = await askRes.json();
    assert.equal(askData.status, 'acknowledged');
    assert.ok(askData.result.answer.includes('Provider reviewed'));
    assert.equal(askData.result.pr_number, 26);
    assert.equal(askData.result.author, 'review-author');
    assert.equal(capturedReview.agentId, 'Arthur (Architect)');
    assert.match(capturedReview.prompt, /Live provider review title/);
    assert.match(capturedReview.options.reviewContext, /review-author/);
    assert.match(capturedReview.options.reviewContext, /diff --git a\/src\/example.js/);
    assert.equal(capturedReview.options.throwOnProviderError, true);
  });

  await t.test('agent.ask returns provider failures instead of fabricated review text', async () => {
    providerFailure = true;
    const askRes = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'agent.ask',
        payload: { pr_number: 26, question: 'What changed?' }
      })
    });
    const askData = await askRes.json();
    assert.equal(askRes.status, 500);
    assert.match(askData.error, /quota exceeded/);
    assert.equal(askData.result, undefined);
    providerFailure = false;
  });

  await t.test('GET /api/v1/tasks returns backlog tasks array', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.tasks));
  });

  await t.test('GET /api/v1/pull-requests returns PR array', async () => {
    const res = await fetch(`${baseUrl}/api/v1/pull-requests`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.pullRequests));
  });

  await t.test('GET /api/v1/repositories returns active repositories and worktrees', async () => {
    const res = await fetch(`${baseUrl}/api/v1/repositories`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.repositories));
    assert.ok(data.repositories.length >= 1);
  });

  await t.test('GET /api/v1/analytics returns KPIs and repository activity', async () => {
    const res = await fetch(`${baseUrl}/api/v1/analytics`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.analytics);
    assert.ok(data.analytics.kpis);
    assert.ok(data.analytics.repositories);
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
