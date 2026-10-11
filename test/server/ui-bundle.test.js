const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const { SupervisorServer } = require('../../src/server/supervisor-server');

test('SupervisorServer serves interactive Web UI dashboard bundle', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrew-ui-test-'));

  const server = new SupervisorServer({
    port: 0,
    staticDir: path.join(__dirname, '../../src/server/public')
  });

  await server.start();
  const address = server.httpServer.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(async () => {
    await server.stop();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test('GET / returns index.html with single-page dashboard shell and pixel room canvas', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes('AgentCrew — AI Team Workspace'));
    assert.ok(html.includes('app-sidebar'));
    assert.ok(html.includes('theme-toggle-btn'));
    assert.ok(html.includes('data-theme="light"'));
    assert.ok(html.includes('pixel-room-canvas'));
    assert.ok(html.includes('team-room-grid'));
    assert.ok(html.includes('kanban-board'));
    assert.ok(html.includes('view-overview'));
    assert.ok(html.includes('view-team-room'));
    assert.ok(html.includes('view-reviews'));
    assert.ok(html.includes('view-kanban'));
    assert.ok(html.includes('view-repositories'));
    assert.ok(html.includes('view-observability'));
    assert.ok(html.includes('view-settings'));
    assert.ok(html.includes('pr-details-panel'));
  });

  await t.test('GET /pixel-room.js returns pixel-art isometric engine with theme support', async () => {
    const res = await fetch(`${baseUrl}/pixel-room.js`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/javascript'));
    const js = await res.text();
    assert.ok(js.includes('PixelRoomRenderer'));
    assert.ok(js.includes('setTheme'));
  });

  await t.test('GET /app.js returns client-side dashboard application script with theme switching', async () => {
    const res = await fetch(`${baseUrl}/app.js`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/javascript'));
    const js = await res.text();
    assert.ok(js.includes('/api/v1/events'));
    assert.ok(js.includes('/api/v1/workspace'));
    assert.ok(js.includes('agentcrew_theme'));
    assert.ok(js.includes('theme-toggle-btn'));
  });

  await t.test('GET /style.css returns dashboard stylesheets with light and dark themes', async () => {
    const res = await fetch(`${baseUrl}/style.css`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/css'));
    const css = await res.text();
    assert.ok(css.includes('[data-theme="light"]'));
    assert.ok(css.includes('[data-theme="dark"]'));
    assert.ok(css.includes('pr-details-dock'));
  });

  await t.test('GET /analytics-dashboard-data.js returns typed analytics data', async () => {
    const res = await fetch(`${baseUrl}/analytics-dashboard-data.js`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/javascript'));
    const js = await res.text();
    assert.ok(js.includes('agentCrewAnalyticsData'));
    assert.ok(js.includes('Arthur'));
    assert.ok(js.includes('TASK-26'));
  });

  await t.test('GET /non-existent-asset.xyz returns 404', async () => {
    const res = await fetch(`${baseUrl}/non-existent-asset.xyz`);
    assert.equal(res.status, 404);
  });
});
