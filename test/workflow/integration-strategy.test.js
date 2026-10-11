const test = require('node:test');
const assert = require('node:assert/strict');
const { IntegrationStrategyManager } = require('../../src/workflow/integration-strategy');

test('IntegrationStrategyManager supports iteration branch strategy targeting iteration/<id>', () => {
  const manager = new IntegrationStrategyManager({
    strategy: 'iteration_branch',
    iterationId: 'iter-october',
    targetBranch: 'main',
  });

  const branchConfig = manager.getIntegrationTarget();
  assert.equal(branchConfig.strategy, 'iteration_branch');
  assert.equal(branchConfig.branch, 'iteration/iter-october');
  assert.equal(branchConfig.finalTarget, 'main');
});

test('IntegrationStrategyManager supports task_prs strategy opening PRs directly to target', () => {
  const manager = new IntegrationStrategyManager({
    strategy: 'task_prs',
    targetBranch: 'main',
  });

  const branchConfig = manager.getIntegrationTarget();
  assert.equal(branchConfig.strategy, 'task_prs');
  assert.equal(branchConfig.branch, 'main');
});

test('IntegrationStrategyManager enforces human merge authorization by default', () => {
  const manager = new IntegrationStrategyManager({
    strategy: 'iteration_branch',
    autopilotMerge: false,
  });

  const decision = manager.canMerge({
    ciStatus: 'success',
    qaApproved: true,
  });

  assert.equal(decision.autoMergeAllowed, false);
  assert.equal(decision.requiresHumanApproval, true);

  const approved = manager.authorizeMerge({ approver: 'operator' });
  assert.equal(approved.allowed, true);
  assert.equal(approved.approver, 'operator');
});
