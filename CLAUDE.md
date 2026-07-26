# agentcrew — Agent Instructions

## Session start

- Always load `docs/MEMORY.md` at the start of every new session, before
  making changes — it holds distilled product/architecture knowledge so you
  don't re-derive it from scratch.
- Then read today's and yesterday's `memory/YYYY-MM-DD.md` if they exist.
  Don't read older logs unless hunting something specific.

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
