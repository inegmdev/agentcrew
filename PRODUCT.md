# agentcrew — Product specification index

Updated: 2026-10-11. **Start here before implementing an existing supervisor task.**

The detailed specification is split by audience:

- [PRD](docs/PRD.md): agreed product requirements, workflows, user stories, and acceptance.
- [TRD](docs/TRD.md): proposed implementation design, interfaces, schemas, and verification gates.
- [Accepted scope decision](backlog/decisions/decision-7%20-%20AI-Team-Workspace-v1-product-scope-and-supersession-of-supervisor-assumptions.md): October direction and explicit supersessions.
- [Proposed technical baseline](backlog/decisions/decision-8%20-%20Proposed-technical-baseline-for-the-AI-Team-Workspace.md): engineering choices pending adoption.
- [Historical supervisor specification](docs/archive/PRODUCT-supervisor-2026-09-19.md): preserved September design; historical assumptions only.

## Document authority

Accepted decisions govern architecture; explicitly superseded parts of older decisions
no longer apply. The PRD owns user-visible requirements. The TRD implements those
requirements and labels proposed engineering defaults and unverified capabilities.
This index preserves old section references; it does not duplicate the normative body.
If a conflict appears, record/correct it rather than silently selecting whichever text
is convenient. Current user instructions take precedence over repository documents.

The existing installer and board watcher are built. The role-based team, supervisor,
provider plugins, worktrees, and dashboard suite are **not yet built**. The October
PRD/TRD do not change executable behavior by themselves.

## Legacy section compatibility

The headings below deliberately preserve every old numbered section/subsection anchor.
Existing tasks citing `PRODUCT.md §N` must follow the mapped document before implementation.

## 1. Purpose and scope

Product scope and release boundaries now live in PRD §§1–2. The installer remains built; the AI Team Workspace is specified, not implemented.

See [PRD](docs/PRD.md#1-purpose-and-outcomes) and [TRD](docs/TRD.md#2-current-implementation-and-compatibility).

### 1.1 What agentcrew is

See [PRD](docs/PRD.md#1-purpose-and-outcomes) and [TRD](docs/TRD.md#2-current-implementation-and-compatibility).

### 1.2 Non-goals

See [PRD](docs/PRD.md#1-purpose-and-outcomes) and [TRD](docs/TRD.md#2-current-implementation-and-compatibility).

## 2. Use cases

Use the complete iteration journeys and acceptance scenarios. Cross-project aggregation is deferred.

See [PRD](docs/PRD.md#4-experience-and-journeys) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 2.1 Primary: a task driven to done, with a takeover

See [PRD](docs/PRD.md#4-experience-and-journeys) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 2.2 Unattended run

See [PRD](docs/PRD.md#4-experience-and-journeys) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 2.3 Post-mortem

See [PRD](docs/PRD.md#4-experience-and-journeys) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 2.4 Multiple projects at once

See [PRD](docs/PRD.md#4-experience-and-journeys) and [TRD](docs/TRD.md#16-verification-and-delivery).

## 3. Vocabulary

Agent identity, assignment, session, turn, task, and process are distinct. Provider-native IDs are separate from internal IDs.

See [PRD](docs/PRD.md#3-vocabulary-and-users) and [TRD](docs/TRD.md#4-domain-model-and-identity).

## 4. Architecture

One local supervisor per project serves the browser and owns runtime writes. Task worktrees are required in v1. API-backed providers remain a future extension.

See [PRD](docs/PRD.md#2-scope-and-constraints) and [TRD](docs/TRD.md#3-architecture-and-technical-baseline).

### 4.1 Components

See [PRD](docs/PRD.md#2-scope-and-constraints) and [TRD](docs/TRD.md#3-architecture-and-technical-baseline).

### 4.2 Two axes

See [PRD](docs/PRD.md#2-scope-and-constraints) and [TRD](docs/TRD.md#3-architecture-and-technical-baseline).

### 4.3 Direction of flow

See [PRD](docs/PRD.md#2-scope-and-constraints) and [TRD](docs/TRD.md#3-architecture-and-technical-baseline).

## 5. Event model

The event model includes planning, assignments, approvals, reviews, popup changes, integration, and diagnostics. Global replay cursors support sessionless events.

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 5.1 Envelope

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 5.2 Event types

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 5.3 Causality

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 5.4 Process records

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

## 6. Health model

Health, workflow stage, control ownership, and utilization are separate. Inactivity triggers inspection, not a claim of failure. Diagnostics use configured roster capacity.

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#7-scheduler-and-activity-state).

### 6.1 States

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#7-scheduler-and-activity-state).

### 6.2 Detection tiers

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#7-scheduler-and-activity-state).

### 6.3 Timing constraints

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#7-scheduler-and-activity-state).

### 6.4 Hook channel

See [PRD](docs/PRD.md#13-observability-and-diagnostics) and [TRD](docs/TRD.md#7-scheduler-and-activity-state).

## 7. Takeover protocol

Takeover grants exclusive human conversation control. Human-directed tools remain usable under policy; autonomous input is held. Actual interrupt/resume capabilities require verification.

See [PRD](docs/PRD.md#9-human-control-and-approval) and [TRD](docs/TRD.md#8-session-control-and-recovery).

### 7.1 States

See [PRD](docs/PRD.md#9-human-control-and-approval) and [TRD](docs/TRD.md#8-session-control-and-recovery).

### 7.2 Enforcement

See [PRD](docs/PRD.md#9-human-control-and-approval) and [TRD](docs/TRD.md#8-session-control-and-recovery).

### 7.3 Interrupt levels

See [PRD](docs/PRD.md#9-human-control-and-approval) and [TRD](docs/TRD.md#8-session-control-and-recovery).

## 8. Storage

Project intent stays in Markdown; local execution records stay outside the repo. The store now includes commands, outbox operations, revisions, approvals, and causal history.

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 8.1 Locations

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 8.2 Project identity

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 8.3 Tables

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 8.4 Row cap, blobs, retention

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

### 8.5 Daemon and concurrency

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#11-storage-events-and-consistency).

## 9. Adapters

agy, Codex, and Gemini are the required first-release providers. No common flag shape or universal native-resume behavior is assumed. Claude qualification is later.

See [PRD](docs/PRD.md#5-setup-and-settings) and [TRD](docs/TRD.md#5-provider-plugins-and-qualification).

### 9.1 Interface

See [PRD](docs/PRD.md#5-setup-and-settings) and [TRD](docs/TRD.md#5-provider-plugins-and-qualification).

### 9.2 Session identity

See [PRD](docs/PRD.md#5-setup-and-settings) and [TRD](docs/TRD.md#5-provider-plugins-and-qualification).

### 9.3 Supported CLIs

See [PRD](docs/PRD.md#5-setup-and-settings) and [TRD](docs/TRD.md#5-provider-plugins-and-qualification).

## 10. Runtimes

Local processes run in isolated task worktrees; reviewers use exact candidate revisions. OS process lifecycle remains separate from provider protocols.

See [PRD](docs/PRD.md#8-execution-and-delivery) and [TRD](docs/TRD.md#9-worktrees-and-github-integration).

## 11. UI surfaces

Kanban, pixel-art team room, and observability are required, with setup/settings, session/artifact detail, and persistent approvals. Frontend dependencies/build tooling are allowed.

See [PRD](docs/PRD.md#12-dashboard-suite) and [TRD](docs/TRD.md#12-application-interfaces-and-ui).

### 11.1 Board

See [PRD](docs/PRD.md#12-dashboard-suite) and [TRD](docs/TRD.md#12-application-interfaces-and-ui).

### 11.2 Session

See [PRD](docs/PRD.md#12-dashboard-suite) and [TRD](docs/TRD.md#12-application-interfaces-and-ui).

### 11.3 Forensics

See [PRD](docs/PRD.md#12-dashboard-suite) and [TRD](docs/TRD.md#12-application-interfaces-and-ui).

### 11.4 Presentation rules

See [PRD](docs/PRD.md#12-dashboard-suite) and [TRD](docs/TRD.md#12-application-interfaces-and-ui).

## 12. Testing and CI

No vendor credentials in CI. Fake providers and recorded fixtures test contracts; real-provider qualification is separate. Tests and workflows still need implementation.

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 12.1 Rules

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 12.2 Layout

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 12.3 Adapter contract suite

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 12.4 Required fixtures

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 12.5 Drift detection

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

### 12.6 Determinism

See [PRD](docs/PRD.md#16-acceptance-and-traceability) and [TRD](docs/TRD.md#16-verification-and-delivery).

## 13. Repo layout and conventions

Use the proposed artifact layout and module ownership in the TRD. Existing CommonJS installer code remains; new dependency and UI choices are proposed, not installed.

See [PRD](docs/PRD.md#11-knowledge-and-skills) and [TRD](docs/TRD.md#10-imports-artifacts-memory-and-skills).

## 14. Constraints that do not bend

Local ownership, official CLI authentication, and Windows/Linux verification remain. A protected loopback UI is allowed; zero dependencies and no listener are no longer product constraints.

See [PRD](docs/PRD.md#14-quality-and-operational-requirements) and [TRD](docs/TRD.md#13-security-and-access).

### 14.1 Windows parity

See [PRD](docs/PRD.md#14-quality-and-operational-requirements) and [TRD](docs/TRD.md#13-security-and-access).

### 14.2 Credentials

See [PRD](docs/PRD.md#14-quality-and-operational-requirements) and [TRD](docs/TRD.md#13-security-and-access).

### 14.3 Dependencies

See [PRD](docs/PRD.md#14-quality-and-operational-requirements) and [TRD](docs/TRD.md#13-security-and-access).

### 14.4 The selection criterion

See [PRD](docs/PRD.md#14-quality-and-operational-requirements) and [TRD](docs/TRD.md#13-security-and-access).

## 15. Open decisions

The interview settles product choices. Technical defaults are proposed in the TRD; provider controls, Backlog behavior, and external integration remain explicit feasibility gates.

See [PRD](docs/PRD.md#17-delivery-stages-and-risks) and [TRD](docs/TRD.md#16-verification-and-delivery).
