# agentcrew — Handoff / Design Context

This document exists so a fresh session (in a tool that has GitHub access)
can pick this up without re-deriving any of the reasoning below. Everything
here reflects decisions actually made in the conversation that produced this
repo — not just what the code happens to do.

## The goal

Build a repeatable, model-agnostic system for going from an idea to shipped
code, with three separated concerns:

1. A planning loop that reaches shared understanding before any code is
   written.
2. A way to track and execute many vertical-slice tickets across multiple
   projects in parallel, using whichever coding agent CLI is available.
3. A memory layer so agents get smarter about a project over time instead of
   re-deriving context from scratch every session.

## Chosen tools per layer, and why

- **Planning — mattpocock/skills' `/grill-me` → `/to-prd` → `/to-issues`.**
  Chosen explicitly over GitHub's Spec Kit (the user's stated preference).
  Grill-me interrogates until there's no ambiguity left; to-prd writes the
  destination doc; to-issues cuts vertical slices, tagging each HITL (needs a
  human) or AFK (agent can run solo).
- **Execution/tracking — Vibe Kanban** (github.com/BloopAI/vibe-kanban).
  Kanban board across multiple projects, git-worktree isolation per task,
  launches Claude Code / Gemini CLI / Codex / Cursor Agent / others as
  interchangeable executors in streaming mode. Has a "Needs Attention" status
  that fires both when a task finishes and when an agent is blocked waiting
  on input — this is the single queue the user watches across everything.
- **Memory — guild** (github.com/mathomhaus/guild). Single Go binary,
  embedded SQLite, MCP server. Primitives: Oath (standing principles,
  auto-loaded every session), Lore (decisions/observations/research/ideas,
  hybrid search, some types auto-stale), Brief (session handoff note), and
  Quest (guild's own task board — deliberately **not** used here).

## Load-bearing design decisions

1. **Vibe Kanban owns tasks. guild owns memory only.** guild's Quest
   primitive duplicates what Vibe Kanban's board already does (task list,
   dependencies, claiming). Running both as sources of truth for "what's
   being worked on" would cause them to disagree eventually. Agents are
   instructed, via the AGENTS.md block this wizard merges in, to use
   `guild_session_start`, `lore_appraise`, `lore_inscribe`, `quest_brief` —
   and never `quest_accept` / `quest_fulfill`.

2. **Agent-agnostic execution, by explicit user request.** Vibe Kanban
   already supports this natively — invoking whichever CLI as a streamed
   subprocess per task, and letting a human open and take over any running
   session. The wizard doesn't hardcode one agent; it detects which CLIs
   (`claude`, `gemini`, `codex`, `cursor-agent`) are installed and leaves the
   choice to Vibe Kanban per task.

3. **The planning → board bridge is the weakest link, and is handled
   explicitly, not automagically.** `/to-issues` only natively supports
   GitHub, GitLab, or local markdown (`.scratch/<feature>/`) as a tracker —
   **not** Vibe Kanban. Rather than trust the freeform "Other tracker"
   prose-description path (the least deterministic part of the whole
   stack), the design keeps `/to-issues` on local markdown and adds one
   small, independently-testable adapter script
   (`src/adapter/sync-tickets.js`) that turns those files into Vibe Kanban
   cards via its MCP server.
   - **Not yet verified:** the exact MCP tool name/schema Vibe Kanban
     exposes for card creation (assumed `vk_create_card`). The adapter ships
     as a stub behind `--dry-run` for exactly this reason — confirm against
     `npx vibe-kanban --mcp`'s real tool list before implementing
     `createCard()` for real.

4. **This repo is a reusable installer/wizard, not a project scaffold —
   user's explicit choice.** Meant to be cloned once and run against many
   project repos (`agentcrew setup <path>`), then re-run later as the wizard
   itself improves (`agentcrew update`), which loops over every project
   registered in `~/.agentcrew/state.json`. It should stay idempotent —
   confirmed for the AGENTS.md merge (marker-delimited block, tested by
   running it twice); guild's own `init` and the skills installer are
   *expected* to be safe to re-run too, but that's untested.

5. **Install everything from scratch — user's explicit choice**, as opposed
   to "assume already installed" or "detect and install only what's
   missing." The wizard doesn't check before installing guild or the skills
   package.

6. **Some steps are deliberately manual, not automation gaps:**
   - `/setup-matt-pocock-skills` and `/grill-me` require an LLM's judgment —
     a shell script can install the skill files but can't run the skill
     itself.
   - Registering guild as an MCP server inside Vibe Kanban happens in Vibe
     Kanban's UI, which isn't a stable file format worth editing blind.

## Confirmed technical facts (verified during this conversation, not assumed)

- Vibe Kanban's SQLite database: `~/.local/share/vibe-kanban/db.v2.sqlite`
  (Linux/macOS) or `%APPDATA%\bloop\vibe-kanban\data\db.sqlite` (Windows) —
  this is the XDG **data** dir, not the cache dir. Git worktrees live
  separately in a temp dir (e.g.
  `/var/tmp/vibe-kanban/worktrees/<slug>-<repo>/`), cleaned up via
  `git worktree prune` on archive/merge.
- guild's install command:
  `curl -fsSL https://github.com/mathomhaus/guild/releases/latest/download/install.sh | sh`.
  Session flow: `guild_session_start(project=...)` at session start returns
  the Oath, latest Brief, and top quest (if quests are in use). CLI includes
  `guild init`, `guild quest accept/fulfill/journal/brief`, `guild lore
  appraise/inscribe`.
- `to-issues` (mattpocock/skills) tracker support: GitHub, GitLab, local
  markdown, or "Other" (freeform prose description — least reliable).
- Skills install command: `npx skills add https://github.com/mattpocock/skills`
  (whole set) or `--skill <name>` for one specific skill.

## Repo structure — what exists vs. what's a stub

```
agentcrew/
├── README.md                    — full usage docs
├── bin/wizard.js                — CLI entry: `setup <path>` and `update`
├── src/lib/                     — shell exec helpers, state registry, prompts
├── src/steps/                   — one file per setup step (prereqs, detect
│                                   agents, install guild, install skills,
│                                   check vibe-kanban, merge AGENTS.md)
├── src/adapter/sync-tickets.js  — STUB: parses .scratch/ tickets, --dry-run
│                                   works; createCard() throws until the MCP
│                                   tool schema is confirmed and implemented
├── templates/AGENTS.snippet.md  — the guild/Vibe-Kanban boundary
│                                   instructions merged into every onboarded
│                                   repo
└── CHANGELOG.md
```

All steps were smoke-tested (syntax-checked, dry-run parsing tested against
a fake ticket file, AGENTS.md merge tested for idempotency by running it
twice). **Nothing has been tested against a real, running Vibe Kanban or
guild install.**

## Immediate next steps for whoever picks this up

1. Push this repo to a private GitHub repo (the only reason this wasn't
   already done: no GitHub MCP connector was available in the chat this was
   built in).
2. Run `npx vibe-kanban --mcp` for real and confirm the actual tool
   name/schema for card creation; implement `createCard()` in
   `sync-tickets.js` accordingly.
3. Run the wizard against a real project end-to-end and fix whatever the
   dry run above couldn't catch (guild init's actual prompts, the skills
   installer's actual output, etc.).
4. Decide whether the skills installer and guild's `init` are actually
   idempotent on re-run — assumed, not yet verified.
