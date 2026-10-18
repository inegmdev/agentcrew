const { EventEmitter } = require('node:events');

/**
 * Concurrency-capped Turn Scheduler enforcing the global 4-turn limit (TRD §7).
 */
class TurnScheduler {
  constructor(opts = {}) {
    this.maxConcurrency = opts.maxConcurrency || 4;
    this.activeCount = 0;
    this.queue = [];
    this.heldAgents = new Set();
    this.activeByAgent = new Map();
    this.busyAgents = new Set();
    this.bus = new EventEmitter();
  }

  get queueLength() {
    return this.queue.length;
  }

  holdAgent(agentId) {
    this.heldAgents.add(agentId);
    this.cancelQueuedForAgent(agentId);
  }

  releaseAgent(agentId) {
    this.heldAgents.delete(agentId);
    this._drain();
  }

  cancelQueuedForAgent(agentId) {
    const kept = [];
    for (const item of this.queue) {
      if (item.agentId === agentId && item.source !== 'human') item.reject(Object.assign(new Error('Turn cancelled for takeover'), { code: 'TURN_CANCELLED' }));
      else kept.push(item);
    }
    this.queue = kept;
  }

  enqueue(turnId, taskFn, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        turnId,
        taskFn,
        agentId: metadata.agentId || null,
        source: metadata.source || 'autonomous',
        resolve,
        reject,
      });
      this._drain();
    });
  }

  _drain() {
    while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const index = this.queue.findIndex((item) => {
        if (item.agentId && this.busyAgents.has(item.agentId)) return false;
        if (item.agentId && this.heldAgents.has(item.agentId) && item.source !== 'human') return false;
        return true;
      });
      if (index < 0) return;
      const [item] = this.queue.splice(index, 1);
      this.activeCount++;
      if (item.agentId) this.activeByAgent.set(item.agentId, (this.activeByAgent.get(item.agentId) || 0) + 1);
      if (item.agentId) this.busyAgents.add(item.agentId);

      (async () => {
        try {
          const result = await item.taskFn();
          item.resolve(result);
        } catch (err) {
          item.reject(err);
        } finally {
          this.activeCount--;
          if (item.agentId) {
            const remaining = (this.activeByAgent.get(item.agentId) || 1) - 1;
            if (remaining) this.activeByAgent.set(item.agentId, remaining);
            else this.activeByAgent.delete(item.agentId);
            this.busyAgents.delete(item.agentId);
          }
          this._drain();
        }
      })();
    }
  }

  subscribe(listener) {
    this.bus.on('event', listener);
    return () => {
      this.bus.off('event', listener);
    };
  }

  publish(event) {
    const enriched = {
      ...event,
      ts: new Date().toISOString(),
    };
    this.bus.emit('event', enriched);
  }
}

module.exports = { TurnScheduler };
