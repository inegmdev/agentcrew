/** Per-agent takeover ownership. Ownership is granted only after quiescence is confirmed. */
class TakeoverController {
  constructor(opts = {}) {
    this.softBudgetMs = opts.softBudgetMs ?? 10000;
    this.quiesceAgent = opts.quiesceAgent || (async () => ({ quiescent: true }));
    this.sessions = new Map();
  }

  getState(agentId) {
    return this.sessions.get(agentId)?.state || 'auto';
  }

  isAutonomousAllowed(agentId) {
    return this.getState(agentId) === 'auto';
  }

  validateToken(agentId, token) {
    const session = this.sessions.get(agentId);
    return Boolean(session && session.state === 'human_owned' && token && session.token === token);
  }

  async requestTakeover(agentId) {
    if (!agentId) throw Object.assign(new Error('agent_id is required'), { statusCode: 400 });
    const current = this.sessions.get(agentId);
    if (current && current.state !== 'auto') {
      throw Object.assign(new Error(`Agent ${agentId} is already ${current.state}`), { statusCode: 409, code: 'TAKEOVER_CONFLICT' });
    }
    const session = { state: 'pausing', token: require('node:crypto').randomUUID(), guidance: null };
    this.sessions.set(agentId, session);
    try {
      let budgetTimer;
      const result = await Promise.race([
        this.quiesceAgent(agentId, { timeoutMs: this.softBudgetMs }),
        new Promise((resolve) => { budgetTimer = setTimeout(() => resolve({ quiescent: false, reason: 'Takeover soft budget expired' }), this.softBudgetMs); }),
      ]).finally(() => clearTimeout(budgetTimer));
      if (!result?.quiescent) {
        session.state = 'blocked';
        session.reason = result?.reason || 'Quiescence could not be confirmed';
        throw Object.assign(new Error(session.reason), { statusCode: 409, code: 'TAKEOVER_BLOCKED' });
      }
      session.state = 'human_owned';
      return { status: 'acquired', state: session.state, token: session.token, agentId };
    } catch (error) {
      if (session.state === 'pausing') session.state = 'blocked';
      throw error;
    }
  }

  evaluateToolCall({ agentId, source } = {}) {
    const state = this.getState(agentId);
    if (state !== 'auto') {
      if (state === 'human_owned' && source === 'human') return { allowed: true, decidedBy: 'operator' };
      return { allowed: false, reason: `Agent session is ${state}` };
    }
    return { allowed: source !== 'human', decidedBy: 'auto' };
  }

  async release({ agentId, guidance } = {}) {
    const session = this.sessions.get(agentId);
    if (!session || session.state !== 'human_owned') {
      throw Object.assign(new Error(`Agent ${agentId} is not human-owned`), { statusCode: 409, code: 'TAKEOVER_NOT_OWNED' });
    }
    session.state = 'releasing';
    session.guidance = guidance || null;
    this.sessions.delete(agentId);
    return { status: 'released', state: 'auto', guidance: session.guidance, agentId };
  }
}

module.exports = { TakeoverController };
