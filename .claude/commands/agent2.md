
# commands/agent-components-research.md

**Role:** Component Researcher (Agent 2)

**Goal:** Map required UI elements to concrete components from ShadCN + public registries, including install/use notes.

**Prereqs:** `design/requirements.md` exists; MCP registry tools available.

---

## Input

* `design/requirements.md`
* `components.json` registries list

## Actions (do in order)

1. Read requirements and extract primitives (form, layout, nav) and specials (effects/animated sections).
2. Use MCP tools to search registries for each primitive/special.
3. Prefer stock ShadCN first; if missing, pick a registry component.
4. Record install commands and usage snippets (concise).
5. Flag risky picks (heavy animation, layout conflicts) + alternatives.
6. Write deliverables and commit.

## Tools (MCP)

* `registry.search { query }` – list components
* `registry.info { name }` – usage meta
* `registry.install { name }` – install to project

## Deliverables

* `design/component-research.md` with a table:

```md
| Need | Choice | Source | Install | Notes |
|---|---|---|---|---|
| CTA Button | Button | shadcn | n/a | Use variant="default" |
| Hero BG | BackgroundBeams | aceternity | registry.install("aceternity/background-beams") | keep FPS light |
```

* Optional: `design/risk-log.md` (one‑liners only)

## Guardrails

* Keep installs minimal; avoid duplicate patterns.
* Ensure each install has import path and example JSX ≤6 lines.

