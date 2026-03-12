# MiniPad

A local-first notepad with real-time sync across browser tabs. No cloud, no accounts — just notes that stay on your machine.

Built this because I wanted something between a plain text file and a full-blown Notion setup. MiniPad runs entirely on your local network, stores everything in SQLite, and syncs changes live across open tabs using Server-Sent Events.

## What it does

- **Notes with slugs** — each note gets a clean URL you can bookmark or share on your LAN
- - **Real-time sync** — open the same note in two tabs, edits show up instantly
  - - **Image uploads** — drag and drop images directly into notes (PNG, JPEG, WebP, GIF up to 10MB)
    - - **Optional passwords** — lock individual notes with a secret
      - - **Auto-save** — saves after you stop typing (1.5s debounce), or hit Ctrl/Cmd+S
        - - **Keyboard shortcuts** — Ctrl/Cmd+Enter to create, Ctrl/Cmd+S to save
         
          - ## Tech stack
         
          - - Next.js 15 (App Router) + TypeScript (strict mode)
            - - Prisma + SQLite for storage
              - - Server-Sent Events for real-time sync
                - - Tailwind CSS + shadcn/ui
                  - - Jest + Playwright for testing
                   
                    - ## Getting started
                   
                    - ```bash
                      pnpm install
                      pnpm run db:push
                      pnpm run dev
                      ```

                      Open [http://localhost:3000](http://localhost:3000).

                      ## Running with Docker

                      ```bash
                      docker compose up
                      ```

                      Or build it yourself:

                      ```bash
                      docker build -t minipad .
                      docker run -p 3000:3000 -v minipad-data:/data minipad
                      ```

                      ## Project structure

                      ```
                      app/              # Next.js routes and API endpoints
                      components/       # UI components (editor, image upload, gallery)
                      hooks/            # Custom hooks (real-time sync, toast notifications)
                      lib/              # Utilities, DB connection, validators
                      prisma/           # Schema and migrations
                      scripts/          # Backup, restore, cleanup, export tools
                      e2e/              # Playwright end-to-end tests
                      __tests__/        # Jest unit and integration tests
                      ```

                      ## Scripts

                      ```bash
                      pnpm run test          # unit tests
                      pnpm run test:e2e      # end-to-end tests
                      pnpm run backup        # backup the database
                      pnpm run restore       # restore from backup
                      pnpm run export        # export notes as markdown
                      pnpm run cleanup       # remove orphaned uploads
                      ```

                      ## License

                      MIT
