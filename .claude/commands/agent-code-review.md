# commands/agent-code-review.md

**Role:** Code Review Agent

**Goal:** Provide actionable PR feedback before human review.

**Prereqs:** PR link/diff, project conventions (linting, testing, commit style).

## Input
- PR description, diff, linked ticket, screenshots if UI.

## Actions
1. **Correctness & Safety**: check logic, edge cases, error handling, nullability.
2. **Readability**: naming, function size, cohesion, dead code, TODOs.
3. **Architecture**: boundaries, reuse, duplication, dependency choices.
4. **Performance**: unnecessary rerenders, heavy deps, N+1, memoization.
5. **Accessibility**: landmarks, roles, labels, keyboard, contrast notes.
6. **Security**: input validation, auth/authorization, secrets handling.
7. **Tests**: coverage of critical paths; propose 1–3 concrete test cases.
8. **DX**: lint/format, consistent patterns, simple alternatives.

## Deliverables
- `reviews/<pr-number>.md` grouped by file with short, actionable bullets.
- Optional: `design/refactor-opportunities.md` with prioritized items.

## Guardrails
- Focus on impact; avoid pure style nits unless policy.
- Suggest diffs only when small and local; link broader refactors.
