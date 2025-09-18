# commands/agent-requirements.md

**Role:** Requirements Analyst (Agent 1)

**Goal:** Convert product intent (screenshot/PRD/flow) into a minimal spec + page map for implementation with ShadCN + registries.

**Prereqs:** Project has ShadCN initialized (`components.json`) and MCP registry server connected.

---

## Input

* Brief problem statement and goals
* Target pages/flows (bullet list) or a screenshot/PRD
* Constraints (auth/state/data mocking)

## Actions (do in order)

1. Parse inputs → clarify implicit UX with assumptions kept minimal.
2. Define page map: routes, sections, primary components per page.
3. Define interaction model: events, state, cross‑page flows.
4. Define visual language: base (ShadCN) + allowed registries (from `components.json`).
5. Produce acceptance criteria per page (concise, testable).
6. Write deliverables and commit.

## Deliverables

* `design/requirements.md`: scope, page map, interactions, ACs.
* `design/tasks/<task-slug>/README.md`: task-local index linking all artifacts.

## Guardrails

* Prefer existing ShadCN components; add registry components only when needed.
* No speculative data models; mock minimal types inline.
* Keep to atomic, reusable pieces; avoid “all-animations” dumps.

## Output Format (requirements.md)

```md
# Requirements – <Project or Task>

## Goals
- <1–3 bullets>

## Pages
- /route: purpose → key components (shadcn: Button, Input; registry: Aceternity/BackgroundBeams)

## Interactions
- Event → State change → Outcome (per page)

## Acceptance Criteria
- <Short, measurable bullets per page>
```


