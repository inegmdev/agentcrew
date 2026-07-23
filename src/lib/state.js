const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.homedir(), '.agentcrew');
const STATE_FILE = path.join(STATE_DIR, 'state.json');

function load() {
  if (!fs.existsSync(STATE_FILE)) {
    return { version: 1, tools: {}, projects: [] };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function save(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

function registerProject(projectPath) {
  const state = load();
  const resolved = path.resolve(projectPath);
  const existing = state.projects.find((p) => p.path === resolved);
  if (existing) {
    existing.lastSeenAt = new Date().toISOString();
  } else {
    state.projects.push({
      path: resolved,
      name: path.basename(resolved),
      addedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });
  }
  save(state);
  return state;
}

function markTool(name, info) {
  const state = load();
  state.tools[name] = { ...(state.tools[name] || {}), ...info, checkedAt: new Date().toISOString() };
  save(state);
  return state;
}

module.exports = { STATE_DIR, STATE_FILE, load, save, registerProject, markTool };
