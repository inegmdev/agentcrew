const test = require('node:test');
const assert = require('node:assert/strict');
const { QualityVerificationManager } = require('../../src/workflow/qa-verification');

test('QualityVerificationManager issues commit-bound approval and invalidates on new commit', () => {
  const manager = new QualityVerificationManager();

  const report = manager.recordQaVerification({
    taskId: 'TASK-19',
    commitHash: 'commit-aaa111',
    tester: 'QA-1',
    verdict: 'pass',
    evidenceBundle: { testsRun: 15, failures: 0 },
  });

  assert.equal(report.status, 'approved');
  assert.equal(report.commitHash, 'commit-aaa111');

  // Verify candidate check against approved commit
  const checkPass = manager.isRevisionApproved('TASK-19', 'commit-aaa111');
  assert.equal(checkPass.approved, true);

  // A new commit appears without new QA verification
  const checkNewCommit = manager.isRevisionApproved('TASK-19', 'commit-bbb222');
  assert.equal(checkNewCommit.approved, false);
  assert.equal(checkNewCommit.reason, 'commit_mismatch_invalidated');
});
