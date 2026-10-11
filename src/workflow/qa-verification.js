/**
 * Manages independent QA verification and revision-bound approval invalidation (PRD §8, §9; TRD §6).
 */
class QualityVerificationManager {
  constructor() {
    this.approvals = new Map();
  }

  recordQaVerification({ taskId, commitHash, tester, verdict, evidenceBundle } = {}) {
    const report = {
      taskId,
      commitHash,
      tester,
      verdict,
      evidenceBundle: evidenceBundle || {},
      status: verdict === 'pass' ? 'approved' : 'rejected',
      verifiedAt: new Date().toISOString(),
    };

    this.approvals.set(taskId, report);
    return report;
  }

  isRevisionApproved(taskId, currentCommitHash) {
    const report = this.approvals.get(taskId);
    if (!report) {
      return { approved: false, reason: 'no_prior_approval' };
    }

    if (report.status !== 'approved') {
      return { approved: false, reason: 'qa_rejected' };
    }

    if (report.commitHash !== currentCommitHash) {
      return {
        approved: false,
        reason: 'commit_mismatch_invalidated',
        expectedCommit: report.commitHash,
        candidateCommit: currentCommitHash,
      };
    }

    return { approved: true, report };
  }
}

module.exports = { QualityVerificationManager };
