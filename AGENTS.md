# AGENTS.md

Monorepo managed by **pnpm** workspaces, containing two apps: an AdonisJS 7 backend API and a Vite React SPA. API routes live under `/api/v1`.

## Layout

```
theUjApp/            # @theuj/monorepo (pnpm workspace root)
├── apps/api/        # @theuj/api — AdonisJS backend
└── apps/web/        # @theuj/web — Vite React SPA
```

## Package manager

Package manager is **pnpm** (`packageManager` pinned in root `package.json`) — do not use npm/yarn. There is a single `pnpm-lock.yaml` at the repo root; app-level lockfiles are gitignored and must not be committed.

## Commands

Run from the repo root. Scripts are suffixed `:api` / `:web` — there are no combined commands (run each explicitly).

- `pnpm dev:api` — backend dev server with HMR (`node ace serve --hmr`)
- `pnpm dev:web` — Vite dev server on port 3000
- `pnpm test:api` — Japa (API test suite — see `apps/api/AGENTS.md`)
- `pnpm build:api` / `pnpm build:web` — production builds
- `pnpm lint:api` / `pnpm lint:web` — ESLint
- `pnpm typecheck:api` / `pnpm typecheck:web` — `tsc --noEmit`
- `pnpm format:api` / `pnpm format:web` — Prettier write (+ ESLint fix on web)

## Where things live

- **API** — ace commands, codegen (Tuyau), tests, backend conventions: see `apps/api/AGENTS.md`
- **Web** — router, hooks, shadcn/ui, Tuyau client: see `apps/web/AGENTS.md`

## Cross-app contract

- **Tuyau type registry:** `.adonisjs/` in `apps/api/` is the committed public interface of `@theuj/api`. The web app consumes it as `@theuj/api/registry` (a `workspace:*` dep) — it is the type-safe API layer between the two apps. See `apps/api/AGENTS.md` for regeneration rules.
- **Formatting:** each app has its own Prettier config and `.prettierignore` (API uses `@adonisjs/prettier-config`; web has its own config with `semi: false`, `singleQuote: true`, `trailingComma: "all"`).
- **Tooling:** eslint + Prettier per workspace, no turbo/oxlint (deliberately rejected — keep the commands above stable).
