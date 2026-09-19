---
id: TASK-8
title: agentcrew doctor and the first CI workflow
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - testing
  - cli
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-6 -
    Tests-run-against-mocked-CLIs-no-vendor-credentials-in-CI.md
  - PRODUCT.md
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
agentcrew doctor and the first CI workflow, per PRODUCT.md §12.

doctor reports: Node version against the §14.3 floor, which CLIs are present and at
what version, auth status per CLI as a boolean and never a value, database reachable
and migrated, daemon port free, hooks installed and executable. --json prints a
machine-readable report; a broken install exits non-zero.

The workflow runs node --test on ubuntu-latest and windows-latest, plus the
idempotency job: run setup on a fixture repo, snapshot the tree, run it again,
assert an empty diff. It configures no secrets, per §12.1, so it runs green on a
fork.

Add the credential-free drift check of §12.5: install the real CLIs and assert from
--version and --help that every flag §9.3 relies on still exists.

doctor is what an operator pastes into an issue, so its output must be safe to
publish.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 doctor --json emits a stable machine-readable report and exits non-zero on a broken install
- [ ] #2 a test asserts doctor output contains no secret-shaped string even when credentials are present in the environment
- [ ] #3 setup run twice on a fixture repo produces an empty diff
- [ ] #4 the workflow is green on ubuntu-latest and windows-latest with no secrets configured
- [ ] #5 the flag-surface drift check fails loudly when a flag from §9.3 disappears
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
