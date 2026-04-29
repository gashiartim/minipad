# Contributing to MiniPad

Thanks for helping improve MiniPad. This is a small, focused app: **local-first notes** with **Socket.io** sync, **Prisma** storage, and a **Next.js 15** UI.

## Setup

Requirements:

- **Node.js 20+** (see `.nvmrc`)
- **pnpm** (`corepack enable pnpm`)

```bash
pnpm install
cp .env.example .env
pnpm run db:generate
pnpm run db:migrate
pnpm run dev
```

Open http://localhost:3000 (served by `node server.js`, which enables Socket.io at `/api/socketio`).

### Docker

```bash
docker compose up --build
```

Uses PostgreSQL; ensure `DATABASE_URL` in compose matches your expectations (see `.env.example`).

## Checks before you open a PR

Run the same commands CI runs:

```bash
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
```

End-to-end tests use Playwright (optional locally):

```bash
pnpm exec playwright install
pnpm exec playwright test
```

## Code style

- **TypeScript** strict mode; avoid `any` unless there is no practical alternative.
- **ESLint** (`next/core-web-vitals`, `next/typescript`) must pass.
- **Formatting:** Prettier config is in `prettier.config.js` — match existing style (single quotes in TS/TSX where the file already uses them).
- Prefer **small, reviewable** PRs tied to an issue or a clear problem statement.

## What belongs in scope

In scope:

- Bugs, security hardening, tests, docs, and performance for the **self-hosted notepad** use case.
- Improvements to real-time sync, editor behavior, or deployment **without** turning the project into a hosted SaaS.

Out of scope (unless discussed first):

- Large unrelated refactors, new product verticals, or features that require mandatory third-party accounts.

## Pull requests

- Describe **what** changed and **why** (user-visible behavior).
- Link related issues if any.
- Update `CHANGELOG.md` under Unreleased (or the maintainer will batch at release time).
- Do **not** commit secrets, `.env`, or local database files.

## Community standards

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Report security issues via [SECURITY.md](./SECURITY.md), not public issues.
