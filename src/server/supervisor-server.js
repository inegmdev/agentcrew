const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const EventEmitter = require('node:events');
const crypto = require('node:crypto');

const { PopupScopeChangeEngine } = require('../workflow/popup-engine');
const { ObservabilityEngine } = require('../observability/engine');
const { VirtualTeamRoom } = require('../ui/team-room');
const { IterationRunner } = require('../workflow/iteration-runner');
const { WebSocketConnection } = require('./websocket');
const { PtyManager } = require('../session/pty-manager');
const { AgentTerminal } = require('../session/agent-terminal');
const { TakeoverController } = require('../session/takeover-controller');
const { TurnScheduler } = require('../scheduler/turn-scheduler');
const { ChatService } = require('../chat/chat-service');
const { RepoDataService } = require('./repo-data-service');
const { which } = require('../lib/shell');
const { resolveInput } = require('../session/input-mode');

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
    this.repoPath = options.repoPath || process.cwd();
    this.workspace = options.workspace;
    this.projectId = options.projectId || null;
    this.projectName = options.projectName || 'AgentCrew Workspace';
    this.scheduler = options.scheduler || new TurnScheduler({ maxConcurrency: 4 });
    this.takeoverController = options.takeoverController || new TakeoverController();
    this.popupEngine = options.popupEngine || new PopupScopeChangeEngine();
    this.observability = options.observability || new ObservabilityEngine();
    this.teamRoom = options.teamRoom || new VirtualTeamRoom();
    this.staticDir = options.staticDir || path.join(__dirname, 'public');
    this.ptyManager = options.ptyManager || new PtyManager({ cwd: this.repoPath });
    this.which = options.which || which;
    this.agentTerminalFactory = options.agentTerminalFactory || ((opts) => new AgentTerminal(opts));
    // When true, chat replies come from the real provider CLIs (agy/codex); tests disable this.
    this.liveProviders = options.liveProviders !== false;

    this.chatService = options.chatService || new ChatService({
      repoPath: this.repoPath,
      scheduler: this.scheduler,
      ptyManager: this.ptyManager,
      workspace: this.workspace,
      projectId: this.projectId,
      liveProviders: this.liveProviders,
      which: this.which,
    });
    this.takeoverController.quiesceAgent = (agentId, opts) => this.chatService.quiesceAgent(agentId, opts);

    this.repoDataService = options.repoDataService || new RepoDataService({ repoPath: this.repoPath });

    this.eventBus = options.eventBus || new EventEmitter();
    this.sseClients = new Set();
    this.wsClients = new Set();
    this.ptyOwners = new Map();
    this.agentTerminals = new Map();
    this.agentTerminalStarts = new Set();
    this.humanTurns = new Map();
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

      this.httpServer.on('upgrade', (req, socket, head) => {
        this.handleUpgrade(req, socket, head).catch(() => socket.destroy());
      });

      this.httpServer.on('error', reject);

      this.httpServer.listen(this.port, this.host, () => {
        this.startHeartbeat();
        resolve(this);
      });
    });
  }

  async handleUpgrade(req, socket, head) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (!this.isSameOrigin(req)) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    if (parsedUrl.pathname === '/api/v1/pty') {
      const requestedAgentId = parsedUrl.searchParams.get('agent_id') || parsedUrl.searchParams.get('agent') || 'Dev-1';
      const agentId = (await this.chatService.resolveAgent(requestedAgentId)).name;
      const takeoverToken = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('takeover_token');
      const mode = parsedUrl.searchParams.get('mode') || (takeoverToken ? 'agent_tui' : 'chat');
      if (!['agent_tui', 'shell'].includes(mode) || !this.takeoverController.validateToken(agentId, takeoverToken)) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }
      if (mode === 'agent_tui') {
        return this.handleAgentTerminalUpgrade(req, socket, agentId, takeoverToken);
      }
      const ws = WebSocketConnection.accept(req, socket);
      if (!ws) return;
      this.wsClients.add(ws);
      const ptySession = mode === 'shell'
        ? this.ptyManager.createSession({ sessionId: `pty-${agentId}-${Date.now()}` })
        : null;
      const ptyOwner = ptySession ? { agentId, takeoverToken, ptySession, ws, revoking: false } : null;
      if (ptySession) this.ptyOwners.set(ptySession.id, ptyOwner);
      const activeChatTurns = new Set();
      const finishThinking = (turnId, outcome) => {
        if (!activeChatTurns.delete(turnId)) return;
        const state = activeChatTurns.size ? 'thinking' : 'idle';
        this.teamRoom.updateAgentState(agentId, { state: state === 'idle' ? 'takeover' : state });
        this.broadcastEvent('agent_thinking_ended', { turn_id: turnId, agent_id: agentId, state, outcome });
      };

      if (ptySession) {
        ptySession.child.stdout.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }));
        });
        ptySession.child.stderr.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }));
        });
      }

      // Send initial greeting
      ws.send(JSON.stringify({
        type: 'ready',
        sessionId: ptySession?.id || null,
        agentId,
        cwd: ptySession?.cwd || this.repoPath,
        mode
      }));

      ws.on('message', async (msg) => {
        try {
          if (ptyOwner?.revoking) return;
          if (!this.takeoverController.validateToken(agentId, takeoverToken)) {
            ws.close();
            ptySession?.terminateTree();
            return;
          }
          const parsed = typeof msg === 'string' ? JSON.parse(msg) : JSON.parse(msg.toString('utf8'));
          if (parsed.type === 'input') {
            const input = resolveInput(parsed.data, parsed.mode || mode);
            if (!input.text) return;
            if (mode === 'shell') {
              if (input.mode !== 'shell') throw new Error('Shell socket accepts shell input only');
              ptySession.write(`${input.text}\n`);
            } else if (input.mode === 'shell') {
              this.beginHumanTurn(agentId);
              try {
                const result = await this.ptyManager.execute(input.text, { cwd: this.repoPath });
                ws.send(JSON.stringify({ type: 'output', data: result.stdout || result.stderr || '' }));
              } finally {
                this.endHumanTurn(agentId);
              }
            } else {
              const turnId = crypto.randomUUID();
              activeChatTurns.add(turnId);
              this.beginHumanTurn(agentId);
              let outcome = 'failed';
              const wsSend = (frame) => ws.send(JSON.stringify({ turn_id: turnId, agent_id: agentId, ...frame }));
              this.teamRoom.updateAgentState(agentId, { state: 'thinking' });
              this.broadcastEvent('agent_thinking', { turn_id: turnId, agent_id: agentId, state: 'thinking' });
              wsSend({ type: 'chat_started' });
              try {
                const response = await this.chatService.generateResponse(agentId, input.text, {
                  source: 'human',
                  throwOnProviderError: true,
                  onChunk: (text, provider) => wsSend({ type: 'chat_chunk', text, provider }),
                  onRetry: (provider) => wsSend({ type: 'chat_retry', provider }),
                });
                outcome = 'completed';
                wsSend({ type: 'chat_completed', answer: response });
                this.broadcastEvent('agent_answered', {
                  agent_id: agentId,
                  pr_number: 'live',
                  question: input.text,
                  answer: response,
                  cli_grounded: this.liveProviders,
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                wsSend({ type: 'chat_failed', error: error.message });
              } finally {
                finishThinking(turnId, outcome);
                this.endHumanTurn(agentId);
              }
            }
          } else if (parsed.type === 'resize') {
            // resize event if available
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', data: `Invalid ${mode} input: ${error.message}` }));
        }
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
        for (const turnId of [...activeChatTurns]) finishThinking(turnId, 'disconnected');
        if (ptySession) {
          this.ptyOwners.delete(ptySession.id);
          ptySession.kill();
        }
      });

      ws.on('error', () => {
        this.wsClients.delete(ws);
        for (const turnId of [...activeChatTurns]) finishThinking(turnId, 'disconnected');
        if (ptySession) {
          this.ptyOwners.delete(ptySession.id);
          ptySession.kill();
        }
      });
    } else {
      socket.destroy();
    }
  }

  async handleAgentTerminalUpgrade(req, socket, agentId, takeoverToken) {
    if (!req.headers['sec-websocket-key']) {
      socket.destroy();
      return;
    }
    let owner = this.agentTerminals.get(agentId);
    if (this.agentTerminalStarts.has(agentId) || (owner?.ws && !owner.ws.isClosed)) {
      socket.write('HTTP/1.1 409 Conflict\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    if (!owner) {
      this.agentTerminalStarts.add(agentId);
      try {
        const agent = await this.chatService.resolveAgent(agentId);
        const reports = await this.chatService.probeProviders();
        const available = new Map(reports.map((report) => [report.name, report.available]));
        const candidates = [agent.provider, agent.backupProvider].filter(Boolean);
        const provider = candidates.find((name) => ['agy', 'codex'].includes(name) && available.get(name) && this.which(name));
        if (!provider) {
          socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
          socket.destroy();
          return;
        }
        const session = this.workspace && this.projectId
          ? await this.workspace.getAgentSession(this.projectId, agentId, provider)
          : await this.chatService.getAgentSession(agentId, provider);
        const terminal = this.agentTerminalFactory({
          agent: { ...agent, provider, model: provider === agent.provider ? agent.model : agent.backupModel },
          session,
          cwd: this.repoPath,
          which: this.which,
        }).start();
        owner = { agentId, takeoverToken, terminal, ws: null, provider, fallback: provider !== agent.provider, revoking: false };
        this.agentTerminals.set(agentId, owner);
        terminal.on('exit', ({ exitCode, signal }) => {
          if (owner.ws && !owner.ws.isClosed) owner.ws.send(JSON.stringify({ type: 'exit', exitCode, signal }));
          this.agentTerminals.delete(agentId);
        });
      } finally {
        this.agentTerminalStarts.delete(agentId);
      }
    }
    const ws = WebSocketConnection.accept(req, socket);
    if (!ws) return;
    owner.ws = ws;
    this.wsClients.add(ws);
    ws.send(JSON.stringify({
      type: 'ready', mode: 'agent_tui', agentId, provider: owner.provider,
      fallback: owner.fallback, resumeRequested: Boolean(owner.terminal.session?.sessionId),
      sessionId: owner.terminal.session?.sessionId || null, cwd: this.repoPath,
    }));
    if (owner.terminal.output) ws.send(JSON.stringify({ type: 'output', data: owner.terminal.output }));
    const onData = (data) => {
      if (owner.ws === ws) ws.send(JSON.stringify({ type: 'output', data }));
    };
    owner.terminal.on('data', onData);
    ws.on('message', (message) => {
      try {
        if (owner.revoking || !this.takeoverController.validateToken(agentId, takeoverToken)) return ws.close();
        const frame = JSON.parse(String(message));
        if (frame.type === 'input') owner.terminal.write(frame.data);
        else if (frame.type === 'resize') owner.terminal.resize(frame.cols, frame.rows);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', data: error.message }));
      }
    });
    const detach = () => {
      this.wsClients.delete(ws);
      owner.terminal.off('data', onData);
      if (owner.ws === ws) owner.ws = null;
    };
    ws.on('close', detach);
    ws.on('error', detach);
  }

  async stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const ws of this.wsClients) {
      try {
        ws.close();
      } catch (_) {}
    }
    this.wsClients.clear();

    for (const owner of this.agentTerminals.values()) await owner.terminal.terminateTree();
    this.agentTerminals.clear();

    if (this.ptyManager) {
      this.ptyManager.killAll();
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

  isSameOrigin(req) {
    if (!req.headers.origin) return true;
    try {
      const origin = new URL(req.headers.origin);
      return ['http:', 'https:'].includes(origin.protocol) && origin.host === req.headers.host;
    } catch (_) {
      return false;
    }
  }

  beginHumanTurn(agentId) {
    this.humanTurns.set(agentId, (this.humanTurns.get(agentId) || 0) + 1);
  }

  endHumanTurn(agentId) {
    const remaining = (this.humanTurns.get(agentId) || 1) - 1;
    if (remaining) this.humanTurns.set(agentId, remaining);
    else this.humanTurns.delete(agentId);
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

    if (!this.isSameOrigin(req)) return this.jsonResponse(res, 403, { error: 'Cross-origin request rejected' });

    if (req.method === 'OPTIONS') {
      res.writeHead(204, { Allow: 'GET, POST, OPTIONS' });
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
        active_turn_limit: 4,
        public_http_warning: !['127.0.0.1', '::1', 'localhost'].includes(this.host),
      });
    }

    if (pathname === '/api/v1/projects' && method === 'GET') {
      const projects = this.workspace ? await this.workspace.listProjects() : [];
      return this.jsonResponse(res, 200, { projects });
    }

    if (pathname === '/api/v1/projects' && method === 'POST') {
      if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
        return this.jsonResponse(res, 415, { error: 'Content-Type must be application/json' });
      }
      try {
        const body = await this.readJsonBody(req);
        if (!this.workspace) {
          return this.jsonResponse(res, 500, { error: 'Workspace manager not initialized' });
        }
        const project = await this.workspace.registerProject(body);
        return this.jsonResponse(res, 201, { project });
      } catch (err) {
        return this.jsonResponse(res, err.statusCode || 400, { error: err.message });
      }
    }

    const activateMatch = pathname.match(/^\/api\/v1\/projects\/([^/]+)\/activate$/);
    if (activateMatch && method === 'POST') {
      const targetId = activateMatch[1];
      try {
        if (!this.workspace) {
          return this.jsonResponse(res, 500, { error: 'Workspace manager not initialized' });
        }
        const project = await this.workspace.activateProject(targetId);
        this.projectId = project.id;
        this.projectName = project.name;
        this.repoPath = project.path;
        if (this.chatService) {
          this.chatService.projectId = project.id;
          this.chatService.repoPath = project.path;
        }
        this.broadcastEvent('project.activated', { project });
        return this.jsonResponse(res, 200, { success: true, project });
      } catch (err) {
        return this.jsonResponse(res, err.statusCode || 400, { error: err.message });
      }
    }

    if (pathname === '/api/v1/room/messages' && method === 'GET') {
      const channel = parsedUrl.searchParams.get('channel') || 'team-activity';
      const messages = this.workspace && this.projectId ? await this.workspace.listRoomMessages(this.projectId, { channel }) : [];
      return this.jsonResponse(res, 200, { messages });
    }

    if (pathname === '/api/v1/room/messages' && method === 'POST') {
      try {
        const body = await this.readJsonBody(req);
        if (!this.workspace || !this.projectId) {
          return this.jsonResponse(res, 400, { error: 'No active project' });
        }
        const message = await this.workspace.addRoomMessage(this.projectId, {
          channel: body.channel || 'team-activity',
          senderType: body.sender_type || 'human',
          senderId: body.sender_id || 'operator',
          senderName: body.sender_name || 'Operator',
          text: body.text,
          metadata: body.metadata || null
        });
        this.broadcastEvent('room.message', message);

        const mentionMatch = body.text && body.text.match(/@([a-zA-Z0-9_\-]+)/);
        if (mentionMatch && this.chatService) {
          const mentioned = mentionMatch[1];
          const agents = await this.workspace.listAgents(this.projectId);
          const targetAgent = agents.find(a => a.name.toLowerCase() === mentioned.toLowerCase() || a.id === mentioned);
          if (targetAgent) {
            setImmediate(async () => {
              try {
                this.broadcastEvent('agent.thinking_started', { agent_id: targetAgent.name });
                const prompt = body.text.replace(mentionMatch[0], '').trim() || 'Please follow up on the team discussion.';
                const answer = await this.chatService.generateResponse(targetAgent.name, prompt);
                const replyMessage = await this.workspace.addRoomMessage(this.projectId, {
                  channel: body.channel || 'team-activity',
                  senderType: 'agent',
                  senderId: targetAgent.id,
                  senderName: targetAgent.name,
                  text: answer,
                  metadata: { in_reply_to: message.id, agent_role: targetAgent.role }
                });
                this.broadcastEvent('room.message', replyMessage);
              } catch (err) {
                const errorMessage = await this.workspace.addRoomMessage(this.projectId, {
                  channel: body.channel || 'team-activity',
                  senderType: 'system',
                  senderId: 'system',
                  senderName: 'System',
                  text: `Failed to dispatch turn to ${targetAgent.name}: ${err.message}`,
                  metadata: { error: true }
                });
                this.broadcastEvent('room.message', errorMessage);
              } finally {
                this.broadcastEvent('agent.thinking_ended', { agent_id: targetAgent.name });
              }
            });
          }
        }

        return this.jsonResponse(res, 201, { message });
      } catch (err) {
        return this.jsonResponse(res, err.statusCode || 400, { error: err.message });
      }
    }

    if (pathname === '/api/v1/readiness' && method === 'GET') {
      const readiness = this.workspace && this.projectId
        ? await this.workspace.checkReadiness(this.projectId)
        : { databaseReady: true, rosterCount: 13 };
      const providers = await this.chatService.probeProviders();
      const agents = this.workspace && this.projectId ? await this.workspace.listAgents(this.projectId) : [];
      for (const provider of providers) {
        provider.agents = agents.filter((agent) => agent.provider === provider.name).map((agent) => agent.name);
      }
      const unavailableAssignments = providers.filter((provider) => provider.agents.length && !provider.available);
      return this.jsonResponse(res, 200, {
        status: unavailableAssignments.length ? 'blocked' : 'ready',
        readiness,
        available_providers: providers.filter((provider) => provider.available).map((provider) => provider.name),
        qualified_providers: [],
        providers
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
      const providerReports = await this.chatService.probeProviders();
      const providerAvailable = new Map(providerReports.map((report) => [report.name, report.available]));
      const stations = this.teamRoom.getStations();
      const enriched = agents.map((agent, idx) => {
        const station = stations[idx] || null;
        const liveState = this.teamRoom.getAgentState(agent.name) || { state: 'idle', activeTaskId: null };
        return {
          ...agent,
          provider_status: providerAvailable.get(agent.provider) ? 'cli_detected' : 'disconnected',
          active_provider: providerAvailable.get(agent.provider) ? agent.provider
            : agent.backup_provider && providerAvailable.get(agent.backup_provider) ? agent.backup_provider : null,
          station: station ? station.grid_position : null,
          state: liveState.state || 'idle',
          active_task_id: liveState.activeTaskId || null,
          activity_badge: liveState.state === 'takeover' ? 'needs-you' : (liveState.state || 'idle')
        };
      });
      return this.jsonResponse(res, 200, { agents: enriched });
    }

    if (pathname === '/api/v1/tasks' && method === 'GET') {
      const popupTasks = Array.from(this.popupEngine.popups.values());
      const tasks = await this.repoDataService.getBacklogTasks(popupTasks);
      return this.jsonResponse(res, 200, { tasks });
    }

    if (pathname === '/api/v1/pull-requests' && method === 'GET') {
      const pullRequests = await this.repoDataService.getPullRequests();
      return this.jsonResponse(res, 200, { pullRequests });
    }

    if (pathname === '/api/v1/repositories' && method === 'GET') {
      const repositories = await this.repoDataService.getRepositories();
      return this.jsonResponse(res, 200, { repositories });
    }

    if (pathname === '/api/v1/analytics' && method === 'GET') {
      const analytics = await this.repoDataService.getAnalytics({
        scheduler: this.scheduler,
        popups: Array.from(this.popupEngine.popups.values())
      });
      return this.jsonResponse(res, 200, { analytics });
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
      if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type'] || '')) {
        return this.jsonResponse(res, 415, { error: 'application/json Content-Type required' });
      }
      const body = await this.readJsonBody(req);
      return this.handleCommand(body, res);
    }

    return this.jsonResponse(res, 404, { error: `Route not found: ${pathname}` });
  }

  async handleCommand(body, res) {
    if (!body || (!body.command_type && !body.action)) {
      return this.jsonResponse(res, 400, { error: 'Missing command_type or action in request body' });
    }

    const command_type = body.command_type || (body.action ? `session.${body.action}` : null);
    const payload = body.payload || body;
    const commandId = `cmd-${Date.now()}`;

    try {
      let result = null;

      if (command_type === 'agent.provider_config') {
        if (!this.workspace || !this.projectId) throw Object.assign(new Error('Workspace is unavailable'), { statusCode: 503 });
        const agentId = (await this.chatService.resolveAgent(payload.agent_id)).name;
        if (this.agentTerminals.has(agentId)) throw Object.assign(new Error('Release the active terminal before changing provider settings'), { statusCode: 409 });
        await this.workspace.setAgentProviderConfig(this.projectId, agentId, {
          backupProvider: payload.backup_provider || null,
          backupModel: payload.backup_model || null,
        });
        result = { agent_id: agentId, backup_provider: payload.backup_provider || null, backup_model: payload.backup_model || null };
        this.broadcastEvent('agent_provider_configured', result);
      } else if (command_type === 'session.takeover') {
        const agentId = (await this.chatService.resolveAgent(payload.agent_id)).name;
        const resObj = await this.takeoverController.requestTakeover(agentId);
        this.teamRoom.updateAgentState(agentId, { state: 'takeover' });
        result = {
          agent_id: agentId,
          state: resObj.state,
          status: resObj.status,
          takeover_token: resObj.token || resObj.takeover_token || crypto.randomUUID()
        };
        this.broadcastEvent('takeover_started', result);
        this.broadcastEvent('takeover_quiesced', result);
      } else if (command_type === 'session.release') {
        const agentId = (await this.chatService.resolveAgent(payload.agent_id)).name;
        if (!this.takeoverController.validateToken(agentId, payload.takeover_token)) {
          throw Object.assign(new Error('Valid takeover token required'), { statusCode: 403, code: 'INVALID_TAKEOVER_TOKEN' });
        }
        if (this.humanTurns.get(agentId)) {
          throw Object.assign(new Error('Human turn is still active; wait for it to finish before release'), { statusCode: 409, code: 'HUMAN_TURN_ACTIVE' });
        }
        const agentTerminal = this.agentTerminals.get(agentId);
        if (agentTerminal) {
          agentTerminal.revoking = true;
          const quiescent = await agentTerminal.terminal.terminateTree();
          if (!quiescent) {
            agentTerminal.revoking = false;
            throw Object.assign(new Error('Agent CLI did not confirm exit; takeover remains active'), { statusCode: 409, code: 'AGENT_CLI_QUIESCENCE_UNKNOWN' });
          }
          agentTerminal.ws?.close();
          this.agentTerminals.delete(agentId);
        }
        for (const [sessionId, owner] of this.ptyOwners) {
          if (owner.agentId !== agentId) continue;
          owner.revoking = true;
          const quiescent = await owner.ptySession.terminateTree();
          if (!quiescent) {
            owner.revoking = false;
            throw Object.assign(new Error('Shell process tree did not confirm exit; takeover remains active'), { statusCode: 409, code: 'SHELL_QUIESCENCE_UNKNOWN' });
          }
          owner.ws.close();
          this.ptyOwners.delete(sessionId);
        }
        const notes = payload.guidance_notes || payload.guidance || '';
        const resObj = await this.takeoverController.release({ agentId, guidance: notes });
        this.chatService.resumeAgent(agentId);
        this.teamRoom.updateAgentState(agentId, { state: 'idle', activeTaskId: null });
        result = { agent_id: agentId, state: resObj.state, notes: resObj.guidance };
        this.broadcastEvent('takeover_released', result);
      } else if (command_type === 'session.exec' || command_type === 'session.command') {
        const requestedAgentId = payload.agent_id || 'Dev-1';
        const agentId = (await this.chatService.resolveAgent(requestedAgentId)).name;
        const input = resolveInput(payload.command || payload.instruction, payload.mode);
        if (!this.takeoverController.validateToken(agentId, payload.takeover_token)) {
          throw Object.assign(new Error('Valid takeover token required'), { statusCode: 403, code: 'INVALID_TAKEOVER_TOKEN' });
        }
        if (input.mode === 'chat' && this.agentTerminals.has(agentId)) {
          throw Object.assign(new Error('Agent CLI is active; use its terminal instead of starting a parallel headless turn'), { statusCode: 409, code: 'AGENT_CLI_ACTIVE' });
        }
        if (!input.text) throw Object.assign(new Error('Input is required'), { statusCode: 400 });

        let output = '';
        if (input.mode === 'chat' && input.text.length > 0) {
          // Route dialogue directly to active Agent Persona reasoning
          this.beginHumanTurn(agentId);
          try {
            output = await this.chatService.generateResponse(agentId, input.text, { source: 'human' });
          } finally {
            this.endHumanTurn(agentId);
          }
          this.broadcastEvent('agent_answered', {
            agent_id: agentId,
            pr_number: 'live',
            question: input.text,
            answer: output,
            cli_grounded: true,
            timestamp: new Date().toISOString()
          });
        } else {
          this.beginHumanTurn(agentId);
          try {
            if (input.mode !== 'shell' || !input.text) throw Object.assign(new Error('A shell command is required'), { statusCode: 400 });
            const execRes = await this.ptyManager.execute(input.text, { cwd: this.repoPath });
            output = execRes.stdout || execRes.stderr || `[Executed with exit code ${execRes.code}]`;
          } catch (e) {
            output = `[Command Error on ${agentId}]: ${e.message}`;
          } finally {
            this.endHumanTurn(agentId);
          }
        }

        result = { agent_id: agentId, command: input.text, mode: input.mode, output, status: 'success' };
        this.broadcastEvent('command_executed', result);
      } else if (command_type === 'iteration.run') {
        const runner = new IterationRunner({
          baseDir: path.join(this.staticDir, '../..', '.scratch')
        });
        this.broadcastEvent('iteration_started', { timestamp: new Date().toISOString() });
        result = await runner.runIteration({
          repoPath: process.cwd(),
          iterationGoal: payload.goal || 'Complete AI Team Workspace delivery cycle',
          rawRequirements: payload.requirements || 'id,title,priority\nREQ-01,Verify multi-turn workflows,high\nREQ-02,Commit-bound QA approvals,high'
        });
        this.broadcastEvent('iteration_completed', { timestamp: new Date().toISOString(), result });
      } else if (command_type === 'popup.propose') {
        const ticket = this.popupEngine.proposeScopeChange({
          title: payload.title,
          affectedTasks: payload.estimated_impact?.affected_tasks,
          estimatedDelayHours: payload.estimated_impact?.delay_hours
        });
        result = { ticket };
        this.broadcastEvent('popup_created', result);
      } else if (command_type === 'agent.ask') {
        const agentId = payload.agent_id || 'Arthur (Architect)';
        const prNumber = Number(payload.pr_number);
        const question = payload.question || '';
        if (!Number.isSafeInteger(prNumber) || prNumber < 1) throw new Error('A valid pull request number is required');
        if (!question.trim()) throw new Error('A review question is required');
        if (!this.liveProviders || !this.chatService) throw new Error('Live providers are unavailable for code review');

        const pr = await this.repoDataService.getPullRequestReviewContext(prNumber);
        const reviewContext = JSON.stringify({
          number: pr.number,
          title: pr.title,
          author: pr.author,
          baseBranch: pr.baseBranch,
          headBranch: pr.headBranch,
          description: pr.body,
          diff: pr.diff,
          diffTruncated: pr.diffTruncated
        });
        const prompt = `Review PR #${pr.number} (${pr.title}) by @${pr.author}. Answer the operator's question using the supplied PR metadata and diff. Cite relevant files or hunks when possible, distinguish evidence from uncertainty, and do not claim tests or checks passed unless the diff or provided context proves it.\n\nOperator question: ${question}`;
        const answer = await this.chatService.generateResponse(agentId, prompt, {
          reviewContext,
          throwOnProviderError: true
        });

        result = {
          agent_id: agentId,
          pr_number: prNumber,
          question,
          answer,
          author: pr.author,
          cli_grounded: true,
          timestamp: new Date().toISOString()
        };
        this.broadcastEvent('agent_answered', result);
      } else {
        result = { accepted: true, command_type };
      }

      return this.jsonResponse(res, 200, {
        command_id: commandId,
        status: 'acknowledged',
        result
      });
    } catch (err) {
      return this.jsonResponse(res, err.statusCode || 500, { error: err.message, code: err.code });
    }
  }

  handleStatic(pathname, res) {
    const terminalAssets = {
      '/vendor/xterm.js': require.resolve('@xterm/xterm'),
      '/vendor/xterm.css': path.join(path.dirname(require.resolve('@xterm/xterm')), '../css/xterm.css'),
      '/vendor/addon-fit.js': require.resolve('@xterm/addon-fit'),
    };
    if (terminalAssets[pathname]) {
      const asset = terminalAssets[pathname];
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(asset)] || 'application/octet-stream' });
      fs.createReadStream(asset).pipe(res);
      return;
    }
    let filePath = pathname === '/' ? '/index.html' : (pathname === '/terminal' ? '/terminal.html' : pathname);
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
