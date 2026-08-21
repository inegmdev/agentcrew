# agentcrew — Agent Instructions

## Session start

- Always load `docs/memory/MEMORY.md` at the start of every new session,
  before making changes — it holds distilled product/architecture knowledge so
  you don't re-derive it from scratch.
- Then review the recent day sections in `docs/memory/MEMORY_SHORTTERM.md`.
  Don't read `docs/memory/archived/` unless hunting something specific.
- Append today's notes under a `## YYYY-MM-DD` section in
  `docs/memory/MEMORY_SHORTTERM.md`.

## Memory cleanup

- Short-term memory is **archived, never deleted**: move old day sections into
  `docs/memory/archived/session_YYYY_MM_DD.md`, clear them from **Active
  logs**, and link the file under **Archive index**.

## Docs

- Always read the docs (architecture, product description) before making
  changes, so decisions stay consistent with prior design intent.
- Always update the docs when creating PRs — don't leave anything outdated.
  If a change affects behavior described in the docs, the docs change in the
  same PR.

## Before opening a PR

- Always run the repo's git actions (CI/CD workflows), if any, to check the
  PR before creating it.

## Backlog

- **GitHub issues are intake.** Bugs and requests land there; it's the front
  door and the first place to look for what matters next.
- **`backlog` owns execution.** Once something is being worked on, it lives
  in `backlog/` as a task. Promotion from issue to task is one-way and
  manual — never sync tasks back to issues.
- Durable decisions go to `backlog decision create`, not into prose.

## Style

- Prioritize diagrams over long paragraphs, in chats and docs.
- Favor concision over grammar in chats and docs.

## Commits

- Don't add a Co-Authored-By: Claude trailer to commits.
