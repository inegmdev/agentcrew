---
id: decision-6
title: Tests run against mocked CLIs; no vendor credentials in CI
date: '2026-09-19 16:15'
status: accepted
---
## Context

The system's core is nondeterministic, slow, credentialed and spawns
processes. A live test is also a leak surface that is specific to this project
rather than generic: the agent under test has shell access, and agentcrew
archives everything it says into a database and blob store. Uploading that as a
build artefact publishes whatever the agent read, and runner log masking is
literal string matching that fails on anything transformed or split.

The repo today has no tests, no workflows and zero dependencies.

## Decision

**No vendor credentials in CI, at all.** Everything runs against mocked CLIs
and recorded fixtures. Keep the zero-dependency stance and use `node:test`, so
CI stays a single `node --test`.

Five pieces, in build order:

1. **Fake CLI binaries** for `claude`, `agy` and `gemini`: small Node scripts
   accepting the real flag surface, honouring `--session-id`, emitting scripted
   stream-json, and able to hang, exit 143, ignore `SIGINT`, or spawn a child
   that outlives its parent. This is the only honest way to test decision-5 on
   Windows.
2. **Recorded fixtures**, captured from real sessions and committed. Record the
   ugly paths deliberately: a rate-limit retry storm, `agent_needs_input`, a
   crash mid-turn, a tool-call loop. Those four drive the whole health ladder.
3. **Injected clock, ids and filesystem root**, so watchdog tests run in
   virtual time instead of twenty real minutes.
4. **A contract suite every adapter must pass** against its fake binary: minted
   session id echoed in init, resume continues the right session, interrupt
   ends the turn, hard kill leaves no orphans, a malformed line does not crash
   the parser. Adding a CLI means making the contract green.
5. **`agentcrew doctor --json`**, the user-facing gate: Node version, which
   CLIs are present and at what version, auth status per CLI without printing
   values, database reachable and migrated, port free, hooks installed and
   executable. Non-zero exit on failure.

**Drift detection lives outside CI.** `npm run record:fixtures` is run by a
maintainer on their own machine, against real CLIs, and commits the refreshed
fixtures. CI validates fixtures against the event schema. A refreshed fixture
that fails validation is the vendor announcing a change. Credential-free drift
detection that does run in CI: install the real CLIs and assert from
`--version` and `--help` that every flag the adapters use still exists with the
same accepted values. That needs no auth and catches renames and removals,
which are the common breakage.

**The honesty rule: every mock behaviour traces to a recorded line.** A
hand-written mock encodes assumptions and will confirm your own bugs.

**Gemini CLI is a mocked adapter for legacy corporate users.** It is retained
deliberately even though Google shut the CLI down for free, Pro and Ultra tiers
on 18 June 2026, because a locked-down corporate machine may permit nothing
else. Its fixtures must be recorded from a real run before the adapter is
called supported; until then it ships marked unverified.

Two jobs beyond unit tests: an **idempotency** job that runs setup on a fixture
repo, snapshots the tree, runs it again and asserts an empty diff; and a matrix
across ubuntu and windows, because decision-5 genuinely diverges.

## Consequences

- Forks and pull requests need no secrets, so the whole suite runs everywhere.
- Green CI proves the code agrees with the mocks, never that it agrees with a
  vendor. This is stated in the docs so nobody mistakes coverage for
  confidence.
- Mocks cannot prove real authentication failure, real rate limiting, real
  latency, or a corporate TLS-intercepting proxy. Those are still simulated as
  health states, because the supervisor must handle them, but simulation is not
  evidence.
- The mock ships as a product feature, `--adapter mock`, so a user can try
  agentcrew with no credentials. That keeps it exercised instead of rotting in
  a test directory.
- Fixture refresh joins the release checklist. If nobody runs it, drift
  accumulates silently, and that is the accepted cost of keeping secrets out of
  the pipeline.
