# agentcrew — Agent Instructions

## Session start

- Always load `.claude/MEMORY.md` at the start of every new session, before
  making changes — it holds distilled product/architecture knowledge so you
  don't re-derive it from scratch.

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

- GitHub issues are the most important backlog — check them when looking
  for what to work on next.

## Style

- Prioritize diagrams over long paragraphs, in chats and docs.
- Favor concision over grammar in chats and docs.

## Commits

- Don't add a Co-Authored-By: Claude trailer to commits.
