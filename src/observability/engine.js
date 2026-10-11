/**
 * Computes delivery metrics, stacked agent utilization, and diagnostic retrospectives (PRD §13; TRD §14).
 */
class ObservabilityEngine {
  constructor() {
    this.taskMetrics = [];
    this.agentActivities = new Map();
  }

  recordTaskMetric({ taskId, cycleTimeMs, blockedTimeMs, qaResult } = {}) {
    this.taskMetrics.push({
      taskId,
      cycleTimeMs: cycleTimeMs || 0,
      blockedTimeMs: blockedTimeMs || 0,
      qaResult: qaResult || 'pass',
      recordedAt: new Date().toISOString(),
    });
  }

  getDeliveryMetrics() {
    if (this.taskMetrics.length === 0) {
      return {
        completedTaskCount: 0,
        averageCycleTimeMs: 0,
        qaPassRate: 1.0,
      };
    }

    const totalCycle = this.taskMetrics.reduce((acc, m) => acc + m.cycleTimeMs, 0);
    const passCount = this.taskMetrics.filter(m => m.qaResult === 'pass').length;

    return {
      completedTaskCount: this.taskMetrics.length,
      averageCycleTimeMs: totalCycle / this.taskMetrics.length,
      qaPassRate: passCount / this.taskMetrics.length,
    };
  }

  recordAgentActivity(agentName, { executingMs, queuedMs, humanWaitMs, idleMs } = {}) {
    const existing = this.agentActivities.get(agentName) || {
      executingMs: 0,
      queuedMs: 0,
      humanWaitMs: 0,
      idleMs: 0,
    };

    const updated = {
      executingMs: existing.executingMs + (executingMs || 0),
      queuedMs: existing.queuedMs + (queuedMs || 0),
      humanWaitMs: existing.humanWaitMs + (humanWaitMs || 0),
      idleMs: existing.idleMs + (idleMs || 0),
    };

    updated.totalObservedMs = updated.executingMs + updated.queuedMs + updated.humanWaitMs + updated.idleMs;
    this.agentActivities.set(agentName, updated);
  }

  getAgentUtilization(agentName) {
    return this.agentActivities.get(agentName) || {
      executingMs: 0,
      queuedMs: 0,
      humanWaitMs: 0,
      idleMs: 0,
      totalObservedMs: 0,
    };
  }

  generateRetrospectiveReport({ iterationId, goal } = {}) {
    const metrics = this.getDeliveryMetrics();
    return {
      iterationId: iterationId || 'iteration-unknown',
      assignedTo: 'Peter (Product Owner)',
      summary: `Iteration "${goal || 'General'}" completed ${metrics.completedTaskCount} tasks with ${metrics.qaPassRate * 100}% QA pass rate.`,
      generatedAt: new Date().toISOString(),
      recommendations: [
        'Maintain 4-turn global concurrency ceiling',
        'Keep architectural review cycle capped at 2 iterations before human escalation',
      ],
    };
  }
}

module.exports = { ObservabilityEngine };
