const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DEFAULT_ROSTER = [
  { name: 'Alice', role: 'Business Analyst', provider: 'agy', model: 'gemini-2.5-pro' },
  { name: 'Peter', role: 'Product Owner', provider: 'agy', model: 'gemini-2.5-pro' },
  { name: 'Arthur', role: 'Architect', provider: 'codex', model: 'o3' },
  { name: 'Dev-1', role: 'Developer', provider: 'codex', model: 'o3' },
  { name: 'Dev-2', role: 'Developer', provider: 'codex', model: 'o3' },
  { name: 'Dev-3', role: 'Developer', provider: 'agy', model: 'gemini-2.5-pro' },
  { name: 'Dev-4', role: 'Developer', provider: 'agy', model: 'gemini-2.5-pro' },
  { name: 'QA-1', role: 'Tester', provider: 'gemini', model: 'gemini-2.5-pro' },
  { name: 'QA-2', role: 'Tester', provider: 'gemini', model: 'gemini-2.5-pro' },
  { name: 'QA-3', role: 'Tester', provider: 'agy', model: 'gemini-2.5-pro' },
  { name: 'QA-4', role: 'Tester', provider: 'agy', model: 'gemini-2.5-pro' },
  { name: 'Integrator-1', role: 'Integrator', provider: 'codex', model: 'o3' },
  { name: 'Integrator-2', role: 'Integrator', provider: 'agy', model: 'gemini-2.5-pro' },
];

class WorkspaceManager {
  constructor(opts = {}) {
    this.baseDir = opts.baseDir || path.join(process.env.HOME || '', '.agentcrew');
  }

  async initProject({ repoPath, name } = {}) {
    const projectId = crypto.randomUUID();
    const projectDir = path.join(this.baseDir, 'projects', projectId);
    fs.mkdirSync(projectDir, { recursive: true });

    const dbPath = path.join(projectDir, 'agentcrew.db');
    const db = new DatabaseSync(dbPath);

    // Initialize TRD SQLite schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        repo_path TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        avatar TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        task_id TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();
    const insertProject = db.prepare(`
      INSERT INTO projects (id, name, repo_path, created_at)
      VALUES (?, ?, ?, ?)
    `);
    insertProject.run(projectId, name || path.basename(repoPath), repoPath, now);

    const insertAgent = db.prepare(`
      INSERT INTO agents (id, project_id, name, role, provider, model, avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const member of DEFAULT_ROSTER) {
      insertAgent.run(
        crypto.randomUUID(),
        projectId,
        member.name,
        member.role,
        member.provider,
        member.model,
        `avatar-${member.role.toLowerCase().replace(/\s+/g, '-')}`,
        now
      );
    }

    db.close();

    return {
      id: projectId,
      dbPath,
      projectDir,
    };
  }

  async listAgents(projectId) {
    const dbPath = path.join(this.baseDir, 'projects', projectId, 'agentcrew.db');
    const db = new DatabaseSync(dbPath);
    const query = db.prepare('SELECT * FROM agents WHERE project_id = ? ORDER BY rowid ASC');
    const rows = query.all(projectId);
    db.close();
    return rows;
  }

  async checkReadiness(projectId) {
    const agents = await this.listAgents(projectId);
    const providers = [...new Set(agents.map(a => a.provider))];
    return {
      repoLinked: true,
      databaseReady: true,
      rosterCount: agents.length,
      configuredProviders: providers,
    };
  }
}

module.exports = { WorkspaceManager, DEFAULT_ROSTER };
