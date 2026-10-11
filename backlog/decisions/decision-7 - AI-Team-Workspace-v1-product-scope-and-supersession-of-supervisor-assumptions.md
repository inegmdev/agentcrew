---
id: decision-7
title: AI Team Workspace v1 product scope and supersession of supervisor assumptions
date: '2026-10-10 21:30'
status: accepted
---
## Context

The 2026-10-10/11 design interview expanded agentcrew from a supervisor for
individual CLI sessions into a local, role-based software-team workspace. The
operator explicitly approved the resulting product plan and requested detailed
PRD/TRD documents. The installer remains; the new platform is not implemented.

The previous specification mixed product requirements, tentative provider flags,
and implementation choices. It also imposed constraints that the new design
explicitly reopens. Preserve the historical records, but identify exactly what
still applies before implementation agents use them.

## Decision

Adopt [the PRD](../../docs/PRD.md) as the product requirements source. Use
[the TRD](../../docs/TRD.md) for the proposed technical design, and
[PRODUCT.md](../../PRODUCT.md) as the compatibility index for existing tasks.
The TRD's new engineering selections are proposals recorded in decision-8;
this accepted decision covers the agreed product behavior below.

- One local human operator, one repository, one active iteration per workspace.
- Default persistent roster: one BA, one PO, one architect, four developers,
  four testers, two integrators. Four active provider turns by default.
- Editable profiles, names, avatars, role contracts, skills, and provider/model
  assignments. Delegation stays within the roster; no extra native helpers.
- Markdown/CSV snapshots feed BA/PO/architect planning. The operator approves
  the iteration goal, scope, tasks/DoDs, architecture, and acceptance package.
- Fixed handoff stages: design review, developer TDD, independent testing,
  integrator review, integrated acceptance. Gates and involvement are configurable.
- Browser chat and takeover control the working agent through provider protocols.
  Human-owned sessions allow human-directed tools while holding autonomous input.
- agy, Codex, and Gemini must satisfy the first-release contract. Each has its
  own adapter and verification; no universal CLI flag or native-ID assumption.
- CLI-first providers have a plugin interface that can later support REST-backed
  execution. Direct API providers and their credential handling are out of v1.
- Worktree per implementation task, exact-commit evidence, configurable iteration-
  branch or direct-to-target integration. Human merges by default; explicit
  autopilot permits merging after required checks.
- Post-start scope/requirement/DoD changes become popup tickets with reusable,
  discarded, added-effort, and delivery-impact analysis. Human approves impact
  and revised commitment even in autopilot; preserve the original baseline.
- Project-owned Markdown holds roles, skills, memories, specs, and handoffs.
  Full runtime history stays outside Git. Memory consolidation is reviewed by
  default; automatic application is configurable and archives prior versions.
- Dashboard suite: Kanban, minimal isometric pixel-art team room, observability,
  plus planning, session/artifact, setup, and Settings views.
- Observability includes live states, evidence-linked KPIs, activity utilization,
  popup impact, and automated diagnostics through configured roster capacity.
  Governing-rule changes proposed by diagnostics require human approval.
- One guarded recovery attempt, configurable bounded rework escalation, explicit
  deadline disposition, and background work independent of browser connection.
- Allow frontend/runtime dependencies and build tooling while preserving local
  ownership and no mandatory agentcrew account/hosted control plane.
- GitHub PRs and existing CI are included; deployments, PI planning, portfolio/
  multi-repo work, learned estimates, external intake connectors, and renaming
  remain later work.

### Supersession map

Only the listed portions are superseded; retained principles remain in force.

| Earlier source | Replaced | Retained |
|---|---|---|
| decision-2 | Absolute no-listener wording; compulsory paid API/local-model supervisory reasoning | No extraction/proxy of provider credentials; official CLIs own authentication; no shared provider endpoint |
| decision-3 | Claude-first ordering, identical flags, universal minted native ID, local-only/no-worktree v1, blanket tool denial in takeover | agentcrew owns orchestration; normalized provider interface; separate process placement; causal events |
| decision-4 | Mandatory separate multi-project UI process | Markdown intent / local event store split; sole project writer; stable project identity; archived history |
| decision-5 | Assumed common init capability names and guaranteed resumability of every abort; blanket human-owned tool denial | Verify interruption first; OS-specific termination isolated in runtime; explicit uncertainty/fallback |
| decision-6 | Zero dependencies, Claude-first mocks, unverified Gemini accepted as release support | Credential-free CI; fake processes; recorded evidence; real qualification distinct from mocks; Windows/Linux testing |
| September PRODUCT.md | Three-screen UI, no frontend build, fixed schema lacking roles/iterations, human-only consolidation, old open defaults | Product traceability, owned data, explicit health/control, durable history |

Historical vendor-policy/retirement assertions in the older records are not
current evidence and must be rechecked if needed. This decision makes no legal,
subscription-entitlement, or unlimited-usage claim.

## Consequences

The existing Supervisor v1 tasks must be reconciled with the new requirements
before implementation, not silently treated as still complete specifications.
Their references remain resolvable through PRODUCT.md's old numbered headings.
The original specification is preserved under docs/archive/.

Provider feasibility is the first implementation gate. If any required provider
cannot enforce permissions, takeover/recovery, or roster-only delegation, report
it as blocked; do not quietly downgrade the release promise or substitute paid APIs.

Documenting the design does not install providers, implement the platform, publish
a PR, or change the current package's Node/runtime behavior.
