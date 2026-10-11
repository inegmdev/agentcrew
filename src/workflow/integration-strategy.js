/**
 * Manages repository branch integration strategies and merge authorization gates (PRD §5, §8; TRD §9).
 */
class IntegrationStrategyManager {
  constructor(opts = {}) {
    this.strategy = opts.strategy || 'iteration_branch';
    this.iterationId = opts.iterationId || 'iteration-default';
    this.targetBranch = opts.targetBranch || 'main';
    this.autopilotMerge = Boolean(opts.autopilotMerge);
  }

  getIntegrationTarget() {
    if (this.strategy === 'iteration_branch') {
      return {
        strategy: 'iteration_branch',
        branch: `iteration/${this.iterationId}`,
        finalTarget: this.targetBranch,
      };
    }

    return {
      strategy: 'task_prs',
      branch: this.targetBranch,
    };
  }

  canMerge({ ciStatus, qaApproved } = {}) {
    const isChecksGreen = ciStatus === 'success' && Boolean(qaApproved);

    if (this.autopilotMerge && isChecksGreen) {
      return {
        autoMergeAllowed: true,
        requiresHumanApproval: false,
      };
    }

    return {
      autoMergeAllowed: false,
      requiresHumanApproval: true,
      checksReady: isChecksGreen,
    };
  }

  authorizeMerge({ approver } = {}) {
    return {
      allowed: true,
      approver: approver || 'operator',
      authorizedAt: new Date().toISOString(),
    };
  }
}

module.exports = { IntegrationStrategyManager };
