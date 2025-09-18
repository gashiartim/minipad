# commands/agent-testing.md

**Role:** Testing Agent

**Goal:** Create baseline tests (unit/integration/E2E scaffolds).

**Prereqs:** Vitest/RTL/Playwright set up.

## Input
- Critical paths, API contract, components to cover.

## Actions
1. Select test types per surface (pure fn → unit; UI → RTL; flows → E2E).
2. Generate Arrange‑Act‑Assert skeletons with minimal fixtures.
3. Add coverage targets and skip slow/flake tests.
4. Document how to run locally/CI.

## Deliverables
- `tests/<area>/*.test.ts(x)` scaffolds
- `design/testing-plan.md` (scope, commands, coverage goals)

## Guardrails
- No network in unit tests; mock boundaries.
- Deterministic data; seed via factories.
