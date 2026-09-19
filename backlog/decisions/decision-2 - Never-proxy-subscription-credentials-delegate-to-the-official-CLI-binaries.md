---
id: decision-2
title: Never proxy subscription credentials; delegate to the official CLI binaries
date: '2026-09-12 12:57'
status: accepted
---
## Context

The goal is flat-rate inference: use the coding subscriptions already paid for
instead of per-token API billing. Two architectures were considered.

**A. Credential proxy** (cli-proxy-api). Extracts the OAuth session, speaks the
vendor wire protocol itself, presents an OpenAI endpoint on 127.0.0.1:8317.

**B. Subprocess wrapper.** Spawns the genuine CLI binary per session and
presents an OpenAI-compatible endpoint in front of it. The credential never
leaves the official client.

The distinction that matters is where the credential lives, not what the
endpoint looks like.

Terms as swept on 2026-09-12:

| Vendor | Stance | Enforcement |
|---|---|---|
| Anthropic | Subscription OAuth in any other product, tool or service is a Consumer Terms violation, stated 4 Apr 2026 | Server-side client attestation; third-party clients get 400 and bill as extra usage |
| Google | Antigravity terms ban third-party tools and proxies against Antigravity quota | Bans issued; Gemini CLI shut down for free/Pro/Ultra on 18 Jun 2026 |
| OpenAI | Subscriptions are personal, one user; automated programmatic access outside the API is restricted | Account restriction |

So architecture A does not even deliver the saving on Anthropic anymore. It
fails closed or bills per token, with a ban attached.

Architecture B stands differently. `claude -p` is a documented, supported
headless mode, and programmatic use through it still draws on subscription
limits. The vendor sees its own client. It is not automatically clean though:
sharing one host's endpoint across a team is account sharing under all three
sets of terms, and sustained automated traffic can trip abuse classifiers
regardless of the letter.

Separately, and independent of terms: a chat-completions endpoint is a poor
shape for a coding agent. Completions are stateless, so each call replays the
history through a full agent loop. Tool calling does not map, because the CLI
runs its own tools rather than emitting `tool_calls` for Hermes to execute.
Unattended operation needs the permission prompts disabled. The result is an
agent inside an agent with a silently broken tool protocol.

## Decision

agentcrew never handles, extracts, forwards or proxies a vendor credential.

- Do not install, bundle or configure cli-proxy-api or any equivalent.
- Detect the installed CLIs, report auth status, and guide the user through
  each vendor's own login flow. Nothing beyond that.
- Drive the official binaries as subprocesses over their own stdio, so the
  credential never leaves the client it belongs to. Settled in decision-3.
- **No endpoint is exposed at all.** The earlier plan wrapped a CLI as an
  OpenAI-compatible server; decision-3 removed the need for it. With no
  listener there is nothing to share, so the account-sharing risk is designed
  out rather than warned about.
- agentcrew's own supervisory reasoning, such as the LLM watchdog, needs real
  function calling, so it takes an API key or a local model. That cost is
  accepted, not engineered around.
- CI uses no vendor credentials whatsoever, see decision-6.

## Consequences

- Orchestration inference is not free. Delegated coding work runs on the
  subscription; the planning loop does not.
- The stack stops depending on undocumented vendor endpoints, which the
  selection criterion in MEMORY.md rejects anyway.
- Onboarding gains an auth-status check per detected CLI, in
  `src/steps/detectAgents.js`.
- This is a reading of published terms, not legal advice, and those terms
  changed three times in 2026. Re-check before relying on it, and ask before
  running any of this on a corporate account.
