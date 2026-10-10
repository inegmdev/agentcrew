const { EventEmitter } = require('node:events');

/**
 * Concurrency-capped Turn Scheduler enforcing the global 4-turn limit (TRD §7).
 */
class TurnScheduler {
  constructor(opts = {}) {
    this.maxConcurrency = opts.maxConcurrency || 4;
    this.activeCount = 0;
    this.queue = [];
    this.bus = new EventEmitter();
  }

  get queueLength() {
    return this.queue.length;
  }

  enqueue(turnId, taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        turnId,
        taskFn,
        resolve,
        reject,
      });
      this._drain();
    });
  }

  _drain() {
    while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      this.activeCount++;

      (async () => {
        try {
          const result = await item.taskFn();
          item.resolve(result);
        } catch (err) {
          item.reject(err);
        } finally {
          this.activeCount--;
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
