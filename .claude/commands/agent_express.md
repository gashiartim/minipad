
---

# commands/agent-express.md

**Role:** Express Implementer (Quick Tasks)

**Goal:** Apply small, tactical UI changes without running full workflow.

**Use When**

* Adding a component/section
* Minor layout tweak
* Replacing a component with a researched alternative

**Actions**

1. Read `design/component-research.md` if present; else prefer stock ShadCN.
2. Install needed component via MCP.
3. Implement change with minimal edits; avoid refactors.
4. Update `design/implementation-notes.md` (short entry).

**Guardrails**

* No new registry unless justified in 1 sentence.
* Keep code diff focused; do not rename/move unrelated files.

**Output**

* Patched files + 1‑paragraph note

---

# components.json (registry hint)

Ensure your `components.json` includes a `registries` array, e.g.:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "registries": [
    "https://ui.shadcn.com/registry",
    "https://registry.aceternity.com",
    "https://registry.originui.com"
  ]
}
```

> Add/remove registries as needed. Keep list short to reduce noise.
