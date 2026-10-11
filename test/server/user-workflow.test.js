const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

test('agentcrew server CLI command launches supervisor and handles user workflow', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-cli-server-'));
  const port = 34567; // deterministic test port

  // Spawn node bin/wizard.js server <port>
  const wizardBin = path.join(__dirname, '../../bin/wizard.js');
  const serverProcess = spawn(process.execPath, [wizardBin, 'server', String(port), '--dir', tmpDir], {
    cwd: tmpDir,
    env: { ...process.env, HOME: tmpDir }
  });

  t.after(async () => {
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Wait for server to announce listening
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server did not start within 5s'));
    }, 5000);

    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Listening on http://')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      // console.error('Server err:', data.toString());
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Server exited prematurely with code ${code}`));
      }
    });
  });

  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test('User loads dashboard in browser (GET /)', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('AgentCrew — AI Team Workspace'));
  });

  await t.test('User queries workspace and sees 13 agent identities', async () => {
    const res = await fetch(`${baseUrl}/api/v1/workspace`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.agents.length, 13);
  });

  await t.test('User initiates interactive browser takeover on Dev-1', async () => {
    const res = await fetch(`${baseUrl}/api/v1/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_type: 'session.takeover',
        payload: { agent_id: 'Dev-1', reason: 'User intervention' }
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.result.state, 'human_owned');
  });

  await t.test('Server shuts down gracefully on SIGTERM', async () => {
    const exitPromise = new Promise((resolve) => {
      serverProcess.on('exit', (code, signal) => {
        resolve({ code, signal });
      });
    });

    serverProcess.kill('SIGTERM');
    const { code, signal } = await exitPromise;
    assert.ok(code === 0 || signal === 'SIGTERM');
  });
});

test('agentcrew iterate CLI command runs full 13-agent iteration cycle', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-cli-iterate-'));
  const wizardBin = path.join(__dirname, '../../bin/wizard.js');

  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const proc = spawn(process.execPath, [wizardBin, 'iterate', 'Test Milestone Cycle'], {
    cwd: tmpDir,
    env: { ...process.env, HOME: tmpDir }
  });

  let output = '';
  proc.stdout.on('data', (d) => { output += d.toString(); });
  proc.stderr.on('data', (d) => { output += d.toString(); });

  const code = await new Promise((res) => proc.on('exit', res));
  assert.equal(code, 0);
  assert.ok(output.includes('Iteration finished with status: delivered'));
  assert.ok(output.includes('Identities active: 13'));
});
