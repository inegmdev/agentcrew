const crypto = require('node:crypto');

/**
 * Manages mid-flight iteration scope change popups (P-xxx) and impact analysis (PRD §10; TRD §6).
 */
class PopupScopeChangeEngine {
  constructor() {
    this.popups = new Map();
    this.pausedTasks = new Set();
    this.counter = 1;
  }

  proposeScopeChange({
    title,
    requestedBy,
    affectedTasks,
    reusableWorkSummary,
    discardedWorkSummary,
    estimatedDelayHours,
  } = {}) {
    const id = `P-${String(this.counter++).padStart(3, '0')}`;
    const tasks = affectedTasks || [];

    for (const taskId of tasks) {
      this.pausedTasks.add(taskId);
    }

    const popup = {
      id,
      title: title || 'Scope modification',
      requestedBy: requestedBy || 'operator',
      affectedTasks: tasks,
      status: 'awaiting_approval',
      impact: {
        reusableWorkSummary: reusableWorkSummary || '',
        discardedWorkSummary: discardedWorkSummary || '',
        estimatedDelayHours: estimatedDelayHours || 0,
      },
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approver: null,
      revisedCommitmentNotes: null,
    };

    this.popups.set(id, popup);
    return popup;
  }

  isTaskPaused(taskId) {
    return this.pausedTasks.has(taskId);
  }

  approveScopeChange(popupId, { approver, revisedCommitmentNotes } = {}) {
    const popup = this.popups.get(popupId);
    if (!popup) throw new Error(`Popup ticket ${popupId} not found`);

    popup.status = 'approved';
    popup.approvedAt = new Date().toISOString();
    popup.approver = approver || 'operator';
    popup.revisedCommitmentNotes = revisedCommitmentNotes || null;

    for (const taskId of popup.affectedTasks) {
      this.pausedTasks.delete(taskId);
    }

    return popup;
  }
}

module.exports = { PopupScopeChangeEngine };
