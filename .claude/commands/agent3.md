---

# commands/agent-implement.md

**Role:** Implementer (Agent 3)

**Goal:** Generate minimal, production‑ready UI code using ShadCN + selected registry components; keep structure clean.

**Prereqs:** `design/requirements.md` + `design/component-research.md` exist.

---

## Input

* Requirements + research docs

## Actions (do in order)

1. Create/extend file structure: `app/(marketing)/…`, `components/ui/…`.
2. Install listed components via MCP (`registry.install`).
3. Implement page shells first (layout, nav, theme provider).
4. Add components per research doc. Avoid unlisted extras.
5. Wire interactions (local state, server actions mocked if needed).
6. Add minimal accessibility: labels, roles, focus order.
7. Output diffs and file list.

## Deliverables

* Updated source files
* `design/implementation-notes.md`: what changed, commands run

## Guardrails

* No animation spam. Stick to choices in research doc.
* Keep Tailwind classes tidy; extract variants when repeated.
* Validate responsive at 360/768/1280 widths.

## Done Checklist

* Builds, routes render
* No unused deps/components
* Lighthouse a11y ≥ 90 (rough pass acceptable)
