const { which: defaultWhich } = require('../lib/shell');
const { TurnScheduler } = require('../scheduler/turn-scheduler');
const { AgyAdapter } = require('../providers/agy-adapter');
const { CodexAdapter } = require('../providers/codex-adapter');
const { GeminiAdapter } = require('../providers/gemini-adapter');
const { PtyManager } = require('../session/pty-manager');
const { DEFAULT_ROSTER } = require('../workspace/manager');

/**
 * Role contracts defined in PRD §6 (PRD-TEAM-03).
 */
const ROLE_CONTRACTS = {
  'Business Analyst': {
    role: 'Business Analyst',
    accepts: 'Source snapshots, customer clarification, popup proposals',
    produces: 'Requirement IDs, spec revisions, assumptions, ambiguity list',
    authority: 'Clarifies meaning; cannot silently change approved scope',
  },
  'Product Owner': {
    role: 'Product Owner',
    accepts: 'Specs, iteration goal/deadline, architecture constraints, capacity',
    produces: 'Tasks, DoDs, dependencies, iteration checklist, impact/replan proposal',
    authority: 'Prioritizes ready work; operator accepts commitment changes',
  },
  'Architect': {
    role: 'Architect',
    accepts: 'Specs, constraints, developer designs, integration questions',
    produces: 'Architecture requirements/decisions, design review, resolution rationale',
    authority: 'Judges architecture; cannot waive acceptance or mandatory human gates',
  },
  'Developer': {
    role: 'Developer',
    accepts: 'Ready task, approved applicable design constraints',
    produces: 'Detailed design, TDD evidence, code commits, handoff',
    authority: 'Implements agreed scope; requests design approval before coding',
  },
  'Tester': {
    role: 'Tester',
    accepts: 'Candidate commit, DoD, requirements, test instructions',
    produces: 'Independent tests, regression/acceptance report, defects, evidence',
    authority: 'Can reject work; does not replace developer-owned TDD',
  },
  'Integrator': {
    role: 'Integrator',
    accepts: 'Reviewed candidate, design agreement, tester evidence, CI',
    produces: 'PR review, integration result, conflict handoff, release evidence bundle',
    authority: 'Coordinates merges under policy; consults architect for design conflicts',
  },
};

/**
 * Deep ChatService module routing chat turns through ProviderPlugin adapters
 * and TurnScheduler concurrency ceiling (TRD §5, §7; TASK-30).
 */
class ChatService {
  constructor(opts = {}) {
    this.repoPath = opts.repoPath || process.cwd();
    this.scheduler = opts.scheduler || new TurnScheduler({ maxConcurrency: 4 });
    this.ptyManager = opts.ptyManager || new PtyManager({ cwd: this.repoPath });
    this.workspace = opts.workspace || null;
    this.projectId = opts.projectId || null;
    this.which = opts.which || defaultWhich;
    this.liveProviders = opts.liveProviders !== undefined
      ? opts.liveProviders
      : Boolean(process.env.AGENTCREW_LIVE_PROVIDERS);
    this.sessionCache = new Map();

    this.adapters = {
      agy: opts.adapters?.agy || new AgyAdapter(),
      codex: opts.adapters?.codex || new CodexAdapter(),
      gemini: opts.adapters?.gemini || new GeminiAdapter(),
    };
  }

  async getAgentSession(agentId) {
    if (this.sessionCache.has(agentId)) {
      return this.sessionCache.get(agentId);
    }
    if (this.workspace && this.projectId) {
      try {
        const session = await this.workspace.getAgentSession(this.projectId, agentId);
        if (session) {
          this.sessionCache.set(agentId, session);
          return session;
        }
      } catch (_) {}
    }
    return null;
  }

  async saveAgentSession(agentId, sessionData) {
    this.sessionCache.set(agentId, sessionData);
    if (this.workspace && this.projectId) {
      try {
        await this.workspace.saveAgentSession(this.projectId, agentId, sessionData);
      } catch (_) {}
    }
  }

  buildRolePrompt({ agentName, role, gitContext, userPrompt } = {}) {
    const contract = ROLE_CONTRACTS[role] || {
      accepts: 'Task assignments and user queries',
      produces: 'Technical findings and status updates',
      authority: 'Acts within assigned scope and responsibilities',
    };

    const gitInfo = gitContext ? `\nRepository context: ${gitContext}` : '';

    return [
      `You are ${agentName}, serving as ${role} in an autonomous engineering team workspace.`,
      `Role contract:`,
      `- Accepts: ${contract.accepts}`,
      `- Produces: ${contract.produces}`,
      `- Authority & limits: ${contract.authority}`,
      gitInfo,
      `Human operator asks or says: "${userPrompt}"`,
      `Answer concisely and authoritatively directly from your role's perspective (2-4 sentences max).`,
    ].filter(Boolean).join('\n');
  }

  async resolveAgent(agentId) {
    if (this.workspace && this.projectId) {
      try {
        const agents = await this.workspace.listAgents(this.projectId);
        const match = agents.find(
          (a) => a.name.toLowerCase() === agentId.toLowerCase() || a.id === agentId
        );
        if (match) {
          return {
            name: match.name,
            role: match.role,
            provider: match.provider || 'agy',
            model: match.model || 'gemini-2.5-pro',
          };
        }
      } catch (_) {}
    }

    const cleanId = agentId.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    const fallback = DEFAULT_ROSTER.find(
      (m) => m.name.toLowerCase() === agentId.toLowerCase() ||
             m.role.toLowerCase() === agentId.toLowerCase() ||
             m.name.toLowerCase() === cleanId ||
             m.role.toLowerCase() === cleanId
    );

    if (fallback) {
      return {
        name: fallback.name,
        role: fallback.role,
        provider: fallback.provider,
        model: fallback.model,
      };
    }

    return {
      name: agentId,
      role: 'Agent',
      provider: 'agy',
      model: 'gemini-2.5-pro',
    };
  }

  async generateResponse(agentId, prompt, options = {}) {
    const agent = await this.resolveAgent(agentId);
    const label = `[${agent.name} (${agent.role})]`;

    // Concurrency ceiling: chat turns are enqueued on the TurnScheduler (maxConcurrency: 4)
    const turnId = `chat-${agent.name}-${Date.now()}`;
    return this.scheduler.enqueue(turnId, async () => {
      let gitInfo = '';
      try {
        const gitCheck = await this.ptyManager.execute('git log -n 1 --oneline', { cwd: this.repoPath });
        gitInfo = gitCheck.stdout ? `(Head: ${gitCheck.stdout})` : '';
      } catch (_) {}

      const promptInstructions = this.buildRolePrompt({
        agentName: agent.name,
        role: agent.role,
        gitContext: gitInfo,
        userPrompt: prompt,
      });

      if (!this.liveProviders) {
        return `${label}: [offline] ${prompt}`;
      }

      // Check for active persistent session for this agent
      const existingSession = await this.getAgentSession(agent.name);

      // Order providers: agent's assigned provider first, followed by others
      const order = [agent.provider, 'agy', 'codex']
        .filter((p, i, a) => this.adapters[p] && a.indexOf(p) === i && this.which(p));

      const errors = [];

      for (const name of order) {
        const adapter = this.adapters[name];
        try {
          // Model selection: only apply model if calling assigned provider, and avoid obsolete/unsupported placeholders
          let modelArg = null;
          if (name === agent.provider && agent.model && agent.model !== 'gemini-2.5-pro' && agent.model !== 'o3') {
            modelArg = agent.model;
          }

          const resumeFrom = (existingSession && existingSession.provider === name)
            ? existingSession.sessionId
            : (options.resumeFrom || undefined);

          const spawnArgs = adapter.buildSpawnArgs({
            cwd: this.repoPath,
            model: modelArg,
            resumeFrom,
          });

          let result = null;
          if (name === 'agy') {
            // Adapt agy flags to attach prompt argument without shell escaping and request JSON output for session tracking
            const finalArgs = spawnArgs
              .map((arg) => (arg === '-p' ? `-p=${promptInstructions}` : arg))
              .filter((arg) => arg !== '--input-format' && arg !== 'stream-json' && arg !== '--output-format');

            if (!finalArgs.includes('--output-format') && !finalArgs.some(a => a.startsWith('--output-format='))) {
              finalArgs.push('--output-format', 'json');
            }

            if (this.ptyManager.executeCommand) {
              result = await this.ptyManager.executeCommand(adapter.command || 'agy', finalArgs, {
                cwd: this.repoPath,
                timeoutMs: 45000,
              });
            } else {
              result = await this.ptyManager.execute(
                `${adapter.command || 'agy'} ${finalArgs.map((a) => JSON.stringify(a)).join(' ')}`,
                { cwd: this.repoPath, timeoutMs: 45000 }
              );
            }

            let text = '';
            try {
              const data = JSON.parse(result.stdout || '{}');
              if (data.conversation_id) {
                await this.saveAgentSession(agent.name, {
                  provider: 'agy',
                  sessionId: data.conversation_id,
                });
              }
              if (data.response) {
                text = data.response.trim();
              }
            } catch (_) {}

            if (!text) {
              text = (result.stdout || '').trim();
            }

            if (text && !result.timedOut && result.code === 0) {
              return `${label}: ${text}`;
            }
          } else if (name === 'codex') {
            const finalArgs = [...spawnArgs, promptInstructions];

            if (this.ptyManager.executeCommand) {
              result = await this.ptyManager.executeCommand(adapter.command || 'codex', finalArgs, {
                cwd: this.repoPath,
                timeoutMs: 60000,
              });
            } else {
              result = await this.ptyManager.execute(
                `${adapter.command || 'codex'} ${finalArgs.map((a) => JSON.stringify(a)).join(' ')}`,
                { cwd: this.repoPath, timeoutMs: 60000 }
              );
            }

            // Parse response events and capture thread_id for session tracking
            let answerText = '';
            let threadId = null;
            const lines = (result.stdout || '').split('\n');
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line.trim());
                if (parsed.type === 'thread.started' && parsed.thread_id) {
                  threadId = parsed.thread_id;
                }
              } catch (_) {}

              const event = adapter.parseStreamEvent(line);
              if (event && event.type === 'message.assistant' && event.text) {
                answerText = event.text;
                break;
              }
            }

            if (threadId) {
              await this.saveAgentSession(agent.name, {
                provider: 'codex',
                sessionId: threadId,
              });
            }

            if (!answerText) {
              const codexIdx = lines.findIndex((l) => l.trim() === 'codex');
              if (codexIdx !== -1) {
                answerText = lines
                  .slice(codexIdx + 1)
                  .filter((l) => !l.startsWith('tokens used') && !/^[\d,]+$/.test(l.trim()) && !l.startsWith('--------'))
                  .join('\n')
                  .trim();
              } else {
                answerText = (result.stdout || '').trim();
              }
            }

            if (answerText && !result.timedOut && result.code === 0) {
              return `${label}: ${answerText}`;
            }
          }

          const why = result?.timedOut
            ? 'timed out'
            : ((result?.stderr || '').split('\n')[0] || `exit ${result?.code}`);
          errors.push(`${name}: ${why}`);
        } catch (e) {
          errors.push(`${name}: ${e.message}`);
        }
      }

      return `${label}: (no reply, every provider failed) ${errors.join(' | ')}`;
    });
  }
}

module.exports = {
  ChatService,
  ROLE_CONTRACTS,
};
