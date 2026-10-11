---
id: TASK-13
title: 'Provider Qualification Spikes (agy, Codex, Gemini)'
status: Done
assignee: []
created_date: '2026-10-10 22:31'
updated_date: '2026-10-10 22:50'
labels: []
milestone: m-1
dependencies: []
priority: high
type: spike
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify interactive streaming, in-band interrupts, tool permission prompting, native resume, and enforcement of disable_native_delegation across official CLI binaries. Build mock test doubles and recorded stream-json fixtures for CI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 agy interactive stream, interrupt, and permission prompts verified
- [x] #2 Codex interactive stream, interrupt, and permission prompts verified
- [x] #3 Gemini interactive stream, interrupt, and permission prompts verified
- [x] #4 disable_native_delegation capability verified for all three CLIs
- [x] #5 Mock test doubles and recorded JSON-RPC/stream-json fixtures created for CI
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented and verified ProviderPlugin adapters for agy, Codex, and Gemini. Verified stream-json/jsonl execution args, turn interruption capabilities, and enforced disable_native_delegation. Built deterministic MockCLI test harness with recorded fixtures for CI.
<!-- SECTION:FINAL_SUMMARY:END -->
