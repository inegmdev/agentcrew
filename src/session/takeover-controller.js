/**
 * State machine managing browser session takeover and human intervention (TRD §8).
 * States: auto -> pausing -> human_owned -> releasing -> auto
 */
class TakeoverController {
  constructor(opts = {}) {
    this.sessionId = opts.sessionId;
    this.softBudgetMs = opts.softBudgetMs || 10000;
    this.state = 'auto';
    this.guidance = null;
  }

  isAutonomousAllowed() {
    return this.state === 'auto';
  }

  async requestTakeover() {
    this.state = 'pausing';

    // Simulate waiting for turn quiescence within soft budget
    await new Promise(resolve => setTimeout(resolve, Math.min(this.softBudgetMs, 20)));

    this.state = 'human_owned';
    return { status: 'acquired', state: this.state };
  }

  evaluateToolCall({ source, toolName, input } = {}) {
    if (this.state === 'human_owned') {
      if (source === 'human') {
        return { allowed: true, decidedBy: 'operator' };
      }
      return { allowed: false, reason: 'Session is currently owned by operator' };
    }
    return { allowed: true, decidedBy: 'auto' };
  }

  async release({ guidance } = {}) {
    this.state = 'releasing';
    this.guidance = guidance || null;

    // Transition back to auto
    this.state = 'auto';
    return {
      status: 'released',
      state: this.state,
      guidance: this.guidance,
    };
  }
}

module.exports = { TakeoverController };
