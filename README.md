# MiniPad

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

**Local-first web notepad** with **real-time sync** across open tabs, **rich text** (TipTap), **image uploads**, and optional **per-note passwords**. Data stays on your machine or LAN—no vendor account required for core use.

Live site: [minipad.app](https://minipad.app) · Source: [github.com/gashiartim/minipad](https://github.com/gashiartim/minipad)

*(Replace the image above with a real screenshot or short GIF of the home screen + editor: drop files under `docs/` and link them here.)*

## Features

- **Slug URLs** — each note has a clean path you can bookmark or share on your network
- **Socket.io sync** — edits propagate live between tabs on the same instance
- **Rich text** — formatting via TipTap; plain text still stored for fallback
- **Images** — drag-and-drop or paste (PNG, JPEG, WebP, GIF; size limits apply)
- **Optional secret** — protects edits and uploads for a note
- **Auto-save** — debounced save while typing; **Ctrl/Cmd+S** still works

## Stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Custom **`node server.js`** wrapping Next.js **and** Socket.io (`/api/socketio`)
- Prisma — **SQLite** by default; **PostgreSQL** in Docker
- Tailwind CSS, Radix-based UI, Jest + Playwright in-repo

## Requirements

- **Node.js 20+**
- **pnpm** (recommended: `corepack enable pnpm`)

## Install from source

```bash
git clone https://github.com/gashiartim/minipad.git
cd minipad
pnpm install
cp .env.example .env
pnpm run db:generate
pnpm run db:migrate
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Why `pnpm run dev`?** It runs `node server.js`, which is required for Socket.io. Plain `next dev` does not start the Socket.io server, so live sync will not work.

## Build & production

```bash
pnpm run build
pnpm start
```

`next.config.mjs` uses `output: "standalone"` for compact Docker images.

### Docker (PostgreSQL)

```bash
docker compose up --build
```

Set `POSTGRES_PASSWORD` in `.env` if you change defaults. Uploaded images are stored under a Docker volume / `data/uploads` depending on layout.

## Configuration

See [`.env.example`](./.env.example). The app needs **`DATABASE_URL`**; **`PORT`** and **`NODE_ENV`** are optional with sensible defaults.

- **SQLite:** `DATABASE_URL="file:./data/app.db"` (ensure the directory exists or let the app create it).
- **Postgres:** use the connection string from Docker Compose or your host.

No external SaaS API keys are required for core functionality.

## Usage (tools)

From repo root, with `.env` loaded via your shell or Prisma:

```bash
pnpm run backup    # JSON backup of notes + image metadata
pnpm run restore   # restore from backup file
pnpm run export    # export notes as Markdown
pnpm run cleanup   # remove orphaned upload files
```

Restore/cleanup scripts expect `DATABASE_URL` to point at the same database you backed up.

## Architecture (high level)

| Path | Purpose |
|------|---------|
| `app/` | App Router pages and `api/` routes |
| `components/` | UI, editor, gallery, forms |
| `hooks/` | Real-time socket hook, toast helpers |
| `lib/` | DB, validation, rate limits, socket helpers |
| `prisma/` | Schema (`schema.prisma` SQLite dev; Docker build swaps in Postgres schema) |
| `scripts/` | Backup, restore, export, cleanup, Docker entrypoint |
| `server.js` | Next.js + Socket.io HTTP server |
| `e2e/` | Playwright tests |
| `__tests__/` | Jest unit/integration tests |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, commands, and PR expectations.

## Security

See [SECURITY.md](./SECURITY.md) for how to report vulnerabilities and a short threat model.

## License

MIT — see [LICENSE](./LICENSE). Copyright 2026 Artim Gashi.
