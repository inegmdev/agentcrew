---
id: TASK-40
title: "Specialist Role Catalog Definition & Store API"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - store
  - agents
  - api
milestone: m-3
dependencies:   - TASK-37
priority: high
type: feature
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Define a curated catalog of specialized agent roles with avatar SVGs, system prompts, role tags, and default CLI providers, served via a REST API.

**Blocked by:** TASK-37
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Catalog includes Frontend, Backend, DevOps, QA, Architect, Security, PM, Git Expert, and Custom definitions
- [ ] #2 Each specialist specifies role description, avatar SVG/path, category, default system instructions, and default CLI adapter
- [ ] #3 GET /api/v1/store/specialists endpoint returns the catalog with current CLI qualification status
- [ ] #4 Supports querying specialists filtered by category (Engineering, Quality, Operations, Product)
- [ ] #5 Unit and contract tests verify catalog integrity and schema
<!-- AC:END -->
