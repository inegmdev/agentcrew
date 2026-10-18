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

  async getOrInitProject({ repoPath, name } = {}) {
    const normalized = fs.realpathSync(repoPath);
    const projectsDir = path.join(this.baseDir, 'projects');
    if (fs.existsSync(projectsDir)) {
      for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dbPath = path.join(projectsDir, entry.name, 'agentcrew.db');
        if (!fs.existsSync(dbPath)) continue;
        const db = new DatabaseSync(dbPath);
        try {
          const row = db.prepare('SELECT id, repo_path FROM projects LIMIT 1').get();
          if (row && fs.existsSync(row.repo_path) && fs.realpathSync(row.repo_path) === normalized) {
            return { id: row.id, dbPath, projectDir: path.dirname(dbPath) };
          }
        } catch (_) {
          // An unrelated or old database is not this workspace.
        } finally {
          db.close();
        }
      }
    }
    return this.initProject({ repoPath: normalized, name });
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
    this.ensureAgentConfig(db);
    const query = db.prepare('SELECT * FROM agents WHERE project_id = ? ORDER BY rowid ASC');
    const rows = query.all(projectId);
    db.close();
    return rows;
  }

  ensureAgentConfig(db) {
    const columns = db.prepare('PRAGMA table_info(agents)').all().map((row) => row.name);
    if (!columns.includes('backup_provider')) db.exec('ALTER TABLE agents ADD COLUMN backup_provider TEXT');
    if (!columns.includes('backup_model')) db.exec('ALTER TABLE agents ADD COLUMN backup_model TEXT');
  }

  async setAgentProviderConfig(projectId, agentId, { backupProvider = null, backupModel = null } = {}) {
    if (backupProvider !== null && !['agy', 'codex', 'gemini'].includes(backupProvider)) {
      throw new Error('Unsupported backup provider');
    }
    if (backupModel !== null && (typeof backupModel !== 'string' || backupModel.length > 120)) {
      throw new Error('Invalid backup model');
    }
    const dbPath = path.join(this.baseDir, 'projects', projectId, 'agentcrew.db');
    const db = new DatabaseSync(dbPath);
    try {
      this.ensureAgentConfig(db);
      const row = db.prepare('SELECT provider FROM agents WHERE project_id = ? AND (id = ? OR name = ?)').get(projectId, agentId, agentId);
      if (!row) throw new Error('Agent not found');
      if (backupProvider === row.provider) throw new Error('Backup provider must differ from primary');
      db.prepare('UPDATE agents SET backup_provider = ?, backup_model = ? WHERE project_id = ? AND (id = ? OR name = ?)')
        .run(backupProvider, backupProvider ? backupModel : null, projectId, agentId, agentId);
    } finally {
      db.close();
    }
  }

  ensureProviderConversations(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS provider_conversations (
      project_id TEXT NOT NULL, agent_id TEXT NOT NULL, provider TEXT NOT NULL,
      session_id TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (project_id, agent_id, provider)
    )`);
    // Preserve the old single-provider row on first access; never overwrite a newer conversation.
    const legacy = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'provider_sessions'").get();
    if (legacy) db.exec(`INSERT OR IGNORE INTO provider_conversations
      SELECT project_id, agent_id, provider, session_id, updated_at FROM provider_sessions`);
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

  async getAgentSession(projectId, agentId, provider = null) {
    const dbPath = path.join(this.baseDir, 'projects', projectId, 'agentcrew.db');
    if (!fs.existsSync(dbPath)) return null;
    const db = new DatabaseSync(dbPath);
    this.ensureProviderConversations(db);
    const stmt = provider
      ? db.prepare('SELECT session_id, provider FROM provider_conversations WHERE project_id = ? AND agent_id = ? AND provider = ?')
      : db.prepare('SELECT session_id, provider FROM provider_conversations WHERE project_id = ? AND agent_id = ? ORDER BY updated_at DESC LIMIT 1');
    const row = provider ? stmt.get(projectId, agentId, provider) : stmt.get(projectId, agentId);
    db.close();
    return row ? { sessionId: row.session_id, provider: row.provider } : null;
  }

  async saveAgentSession(projectId, agentId, { provider, sessionId } = {}) {
    const dbPath = path.join(this.baseDir, 'projects', projectId, 'agentcrew.db');
    if (!fs.existsSync(dbPath)) return;
    const db = new DatabaseSync(dbPath);
    this.ensureProviderConversations(db);
    const stmt = db.prepare(`
      INSERT INTO provider_conversations (project_id, agent_id, provider, session_id, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(project_id, agent_id, provider) DO UPDATE SET
        session_id = excluded.session_id,
        updated_at = excluded.updated_at
    `);
    stmt.run(projectId, agentId, provider, sessionId, new Date().toISOString());
    db.close();
  }
}

module.exports = { WorkspaceManager, DEFAULT_ROSTER };
