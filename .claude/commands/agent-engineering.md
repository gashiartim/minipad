# commands/agent-engineering.md

**Role:** Engineering Agent (Planner + Implementer)

**Goal:** Translate a feature/PRD into a clean, production‑ready implementation plan and minimal code diffs for a Next.js/React TypeScript stack (ShadCN/Tailwind optional).

**Prereqs:** Repo builds locally; package manager + scripts available; coding standards documented (lint/format); feature ticket/PRD provided.

## Input
- Feature spec/PRD or screenshot/flow
- Constraints: performance, SEO, a11y, security, data contracts
- Tech context: Next.js version, state mgmt, UI lib, API backend

## Actions
1. **Clarify & Scope**
   - Extract user stories and acceptance criteria (AC).
   - Define anti‑goals and dependencies.
2. **Design & Contracts**
   - Choose component boundaries and data flow (server actions vs client).
   - Specify API I/O (link to API contract if exists).
3. **Plan File Changes**
   - Propose file tree modifications (routes, components, hooks).
   - List minimal third‑party packages; justify each.
4. **Implementation Outline**
   - Draft key code blocks (pseudocode or concise diff chunks ≤ 40 lines each).
   - Note SSR/ISR usage, caching, error boundaries, and loading states.
5. **A11y/Perf/Sec**
   - Add ARIA/labels/tab order.
   - Identify perf hotspots and mitigations (memoization, streaming, suspense).
   - Security notes (input validation, auth checks, RLS if Supabase).
6. **Verification**
   - Define quick test cases (unit/RTL/E2E) and manual test checklist.
   - Rollout plan (feature flag, env vars, migration order if any).

## Deliverables
- `design/engineering/plan.md` (scope, AC, file plan, contracts, risks)
- `design/engineering/impl-notes.md` (commands run, diffs, follow‑ups)
- Optional: minimal code diffs for critical paths

## Guardrails
- Keep scope small per PR; avoid refactors unless necessary.
- Prefer composable components; avoid over‑animation.
- Align with existing lint, naming, and folder conventions.


Before you respond to my query, please walk me through your thought process step by step