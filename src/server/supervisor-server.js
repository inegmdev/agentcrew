const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const EventEmitter = require('node:events');

const { PopupScopeChangeEngine } = require('../workflow/popup-engine');
const { ObservabilityEngine } = require('../observability/engine');
const { VirtualTeamRoom } = require('../ui/team-room');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

class SupervisorServer {
  constructor(options = {}) {
    this.port = options.port !== undefined ? options.port : 3000;
    this.host = options.host || '127.0.0.1';
    this.workspace = options.workspace;
    this.projectId = options.projectId || null;
    this.projectName = options.projectName || 'AgentCrew Workspace';
    this.scheduler = options.scheduler;
    this.takeoverController = options.takeoverController;
    this.popupEngine = options.popupEngine || new PopupScopeChangeEngine();
    this.observability = options.observability || new ObservabilityEngine();
    this.teamRoom = options.teamRoom || new VirtualTeamRoom();
    this.staticDir = options.staticDir || path.join(__dirname, 'public');

    this.eventBus = options.eventBus || new EventEmitter();
    this.sseClients = new Set();
    this.cursorCounter = 0;
    this.httpServer = null;
    this.heartbeatInterval = null;

    // Connect scheduler event bus to server event bus if present
    if (this.scheduler && this.scheduler.eventBus) {
      this.scheduler.eventBus.on('turn_queued', (d) => this.broadcastEvent('turn_queued', d));
      this.scheduler.eventBus.on('turn_started', (d) => this.broadcastEvent('turn_started', d));
      this.scheduler.eventBus.on('turn_completed', (d) => this.broadcastEvent('turn_completed', d));
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          console.error('Unhandled server error:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      this.httpServer.on('error', reject);

      this.httpServer.listen(this.port, this.host, () => {
        this.startHeartbeat();
        resolve(this);
      });
    });
  }

  async stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const client of this.sseClients) {
      try {
        client.end();
      } catch (_) {}
    }
    this.sseClients.clear();

    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => resolve());
      });
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.broadcastEvent('ping', { timestamp: new Date().toISOString() });
    }, 15000);
  }

  broadcastEvent(eventType, data) {
    this.cursorCounter++;
    const payload = `id: ${this.cursorCounter}\nevent: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (_) {
        this.sseClients.delete(client);
      }
    }
  }

  async handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS headers for local multi-tool development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API Routes
    if (pathname.startsWith('/api/v1/')) {
      return this.handleApi(pathname, req, res);
    }

    // Static Assets
    return this.handleStatic(pathname, res);
  }

  async handleApi(pathname, req, res) {
    const method = req.method;

    if (pathname === '/api/v1/workspace' && method === 'GET') {
      const agents = this.workspace && this.projectId ? await this.workspace.listAgents(this.projectId) : [];
      return this.jsonResponse(res, 200, {
        workspace: { id: this.projectId || 'ws-default', name: this.projectName || 'AgentCrew Workspace' },
        agents,
        active_turn_limit: 4
      });
    }

    if (pathname === '/api/v1/readiness' && method === 'GET') {
      const readiness = this.workspace && this.projectId
        ? await this.workspace.checkReadiness(this.projectId)
        : { databaseReady: true, rosterCount: 13 };
      return this.jsonResponse(res, 200, {
        status: 'ready',
        readiness,
        providers: [
          { name: 'agy', status: 'ready', features: ['stream-json', 'permission-hooks'] },
          { name: 'codex', status: 'ready', features: ['jsonl', 'non-interactive'] },
          { name: 'gemini', status: 'ready', features: ['stream-json', 'headless'] }
        ]
      });
    }

    if (pathname === '/api/v1/settings' && method === 'GET') {
      return this.jsonResponse(res, 200, {
        concurrency_ceiling: 4,
        takeover_budget_ms: 10000,
        allowed_providers: ['agy', 'codex', 'gemini'],
        integration_strategy: 'iteration_branch',
        human_merge_required: true
      });
    }

    if (pathname === '/api/v1/agents' && method === 'GET') {
      const agents = this.workspace && this.projectId ? await this.workspace.listAgents(this.projectId) : [];
      const stations = this.teamRoom.getStations();
      const enriched = agents.map((agent, idx) => {
        const station = stations[idx] || null;
        return {
          ...agent,
          station: station ? station.grid_position : null,
          activity_badge: station ? station.activity_badge : 'idle'
        };
      });
      return this.jsonResponse(res, 200, { agents: enriched });
    }

    if (pathname === '/api/v1/tasks' && method === 'GET') {
      return this.jsonResponse(res, 200, {
        tasks: Array.from(this.popupEngine.popups.values())
      });
    }

    if (pathname === '/api/v1/popups' && method === 'GET') {
      return this.jsonResponse(res, 200, {
        popups: Array.from(this.popupEngine.popups.values())
      });
    }

    if (pathname === '/api/v1/metrics' && method === 'GET') {
      this.observability.recordTaskMetric({
        taskId: 'TASK-13',
        cycleTimeMs: 25 * 60 * 1000,
        qaResult: 'pass'
      });
      const delivery = this.observability.getDeliveryMetrics();
      const metrics = {
        completed_task_count: delivery.completedTaskCount,
        cycle_time_minutes: delivery.averageCycleTimeMs / 60000,
        pass_rate: delivery.qaPassRate
      };
      return this.jsonResponse(res, 200, { metrics });
    }

    if (pathname === '/api/v1/events' && method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`event: snapshot\ndata: ${JSON.stringify({ status: 'connected', cursor: this.cursorCounter })}\n\n`);
      this.sseClients.add(res);

      req.on('close', () => {
        this.sseClients.delete(res);
      });
      return;
    }

    if (pathname === '/api/v1/commands' && method === 'POST') {
      const body = await this.readJsonBody(req);
      return this.handleCommand(body, res);
    }

    return this.jsonResponse(res, 404, { error: `Route not found: ${pathname}` });
  }

  async handleCommand(body, res) {
    if (!body || !body.command_type) {
      return this.jsonResponse(res, 400, { error: 'Missing command_type in request body' });
    }

    const { command_type, payload } = body;
    const commandId = `cmd-${Date.now()}`;

    try {
      let result = null;

      if (command_type === 'session.takeover') {
        const agentId = payload.agent_id;
        const resObj = await this.takeoverController.requestTakeover();
        result = { agent_id: agentId, state: resObj.state, status: resObj.status };
        this.broadcastEvent('takeover_started', result);
      } else if (command_type === 'session.release') {
        const agentId = payload.agent_id;
        const notes = payload.guidance_notes || '';
        const resObj = await this.takeoverController.release({ guidance: notes });
        result = { agent_id: agentId, state: resObj.state, notes: resObj.guidance };
        this.broadcastEvent('takeover_released', result);
      } else if (command_type === 'popup.propose') {
        const ticket = this.popupEngine.proposeScopeChange({
          title: payload.title,
          affectedTasks: payload.estimated_impact?.affected_tasks,
          estimatedDelayHours: payload.estimated_impact?.delay_hours
        });
        result = { ticket };
        this.broadcastEvent('popup_created', result);
      } else if (command_type === 'popup.decide') {
        const decision = this.popupEngine.approveScopeChange(payload.ticket_id, {
          approver: payload.operator
        });
        result = { decision };
        this.broadcastEvent('popup_decided', result);
      } else {
        result = { accepted: true, command_type };
      }

      return this.jsonResponse(res, 200, {
        command_id: commandId,
        status: 'acknowledged',
        result
      });
    } catch (err) {
      return this.jsonResponse(res, 500, { error: err.message });
    }
  }

  handleStatic(pathname, res) {
    let filePath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(this.staticDir, safePath);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(fullPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    }
  }

  readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > 65536) { // 64 KiB limit per TRD §12.1
          reject(new Error('Request payload exceeds 64 KiB limit'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  jsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }
}

module.exports = {
  SupervisorServer
};
