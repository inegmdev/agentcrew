const path = require('node:path');

/**
 * Manages task worktrees, stage transitions, and architectural review escalations (PRD §8, §9).
 */
class TaskLifecycleManager {
  constructor(opts = {}) {
    this.baseDir = opts.baseDir || path.join(process.cwd(), '.worktrees');
    this.tasks = new Map();
  }

  async claimTask({ taskId, agentName } = {}) {
    const worktreePath = path.join(this.baseDir, `task-${taskId}`);
    const taskRecord = {
      taskId,
      owner: agentName,
      stage: 'design',
      worktreePath,
      reworkCount: 0,
      reviews: [],
      status: 'active',
    };
    this.tasks.set(taskId, taskRecord);
    return taskRecord;
  }

  submitReview({ taskId, reviewer, verdict, feedback } = {}) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.reviews.push({ reviewer, verdict, feedback, ts: new Date().toISOString() });

    if (verdict === 'reject') {
      task.reworkCount += 1;
      task.stage = 'rework';

      // Default PRD escalation threshold: 2 failed rework cycles
      if (task.reworkCount >= 2) {
        task.status = 'blocked_escalation';
        return {
          stage: task.stage,
          reworkCount: task.reworkCount,
          escalatedToOperator: true,
          status: task.status,
        };
      }

      return {
        stage: task.stage,
        reworkCount: task.reworkCount,
        escalatedToOperator: false,
        status: task.status,
      };
    }

    task.stage = 'implementation';
    return {
      stage: task.stage,
      reworkCount: task.reworkCount,
      escalatedToOperator: false,
      status: task.status,
    };
  }
}

module.exports = { TaskLifecycleManager };
