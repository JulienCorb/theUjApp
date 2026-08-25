# AGENTS.md — @theuj/web

Vite SPA (React 19 + TypeScript, TanStack Router + Query, Tailwind v4 + shadcn/ui) in `apps/web/`. No SSR, no server functions — this is a pure client-side SPA. Part of the `@theuj/monorepo` pnpm workspace; see the root `AGENTS.md` for monorepo-wide conventions.

## Layout

```
apps/web/
├── src/
│   ├── routes/          # file-based routes (TanStack Router)
│   ├── routeTree.gen.ts # auto-generated (committed, never edit)
│   ├── router.tsx       # router factory — single createRouter entry point
│   ├── main.tsx         # mounts <RouterProvider>
│   ├── lib/             # tuyau client, auth store, query client, utils
│   └── styles.css       # Tailwind v4 import + shadcn theme tokens
├── vite.config.ts
└── tsconfig.json
```

## Commands

Run from the repo root:

- `pnpm --filter @theuj/web dev` — Vite dev server on port 3000
- `pnpm --filter @theuj/web build` — production build
- `pnpm --filter @theuj/web lint` — ESLint
- `pnpm --filter @theuj/web typecheck` — `tsc --noEmit`
- `pnpm --filter @theuj/web format` — Prettier write + ESLint fix

Root scripts are suffixed `:api` / `:web` (e.g. `pnpm lint:web`, `pnpm typecheck:web`) — no combined commands.

## Dependencies

- **Package name:** `@theuj/web` (scoped, matches `@theuj/api`).
- TanStack deps are **version-pinned** (never `"latest"`) to avoid drift.
- `@theuj/api` is consumed as `workspace:*` — the API's Tuyau type registry is the frontend's type-safe API layer.
- `@tuyau/core` uses pnpm `catalog:` (version defined once in root `pnpm-workspace.yaml`, shared with `@theuj/api` to prevent version drift).
- pnpm is the only package manager (`pnpm@10.34.5` pinned in root `package.json`). No npm/yarn.

## Codegen

- `src/routeTree.gen.ts` is **auto-generated** by the TanStack Router Vite plugin and **committed** (like `.adonisjs/` in the API). Never edit it manually — it regenerates on dev/build. Add/modify route files under `src/routes/` and the plugin updates the tree.
- The file has `@ts-nocheck` + `eslint-disable` at the top — it's excluded from lint/type enforcement. `.vscode/settings.json` marks it read-only.
- `tsr generate` can regenerate manually if needed (`generate-routes` script).

## Path aliases

Both `#/*` and `@/*` map to `./src/*` (defined in both `tsconfig.json` `paths` and `package.json` `imports`). Prefer `#/*` (the Node subpath import — works in all tooling without TS resolution).

## API layer (Tuyau)

- **Type-safe client:** `createTuyauReactQueryClient` from `@tuyau/react-query`, consuming the registry from `@theuj/api/registry`. Wired in `src/lib/tuyau.ts`.
- **Auth:** bearer access token (AdonisJS `tokensGuard` on the backend). Token is **in-memory only** (never `localStorage`/`sessionStorage`) — mitigates XSS token theft. Injected per-request as `Authorization: Bearer <token>`.
- **Do NOT copy the starter kit's cookie/session setup** (`credentials: 'include'`) — this backend uses `tokensGuard`, not cookies. The `@theuj/api` auth is stateless and token-based.
- **Response wrapper:** all API responses are wrapped in `{ data: ... }` by the backend's `serialize()`. The Tuyau client types reflect this.
- **Token expiry:** 7 days. Plan a 401 → redirect-to-login flow. No refresh token yet.
- **Vite dev proxy:** `/api` → `http://localhost:3333` in `vite.config.ts` (avoids CORS in dev; CORS is `origin: true` in dev on the backend).

## Router

- **Factory pattern:** `src/router.tsx` exports `getRouter()` — the single `createRouter` entry point. `main.tsx` imports and mounts it. This is where router context (auth state, QueryClient) gets injected.
- **Type registration:** `declare module '@tanstack/react-router'` with `Register.router` lives in `router.tsx`. All hooks (`useNavigate`, `useParams`, `Link`) are typed from this.
- **Code splitting:** `autoCodeSplitting: true` in the Vite plugin. Use `.lazy.tsx` convention for large route components.
- **Auth guards:** protected routes use a layout route (`_authenticated.tsx`) with `beforeLoad` → `throw redirect({ to: '/login' })` when no token. Router context carries auth state.
- `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`, `scrollRestoration: true`, `defaultStructuralSharing: true`.
- App is wrapped in `<StrictMode>` in `main.tsx`.

## Devtools

- TanStack Devtools (unified `TanStackDevtools` component) + Router Devtools panel are rendered in `src/routes/__root.tsx`.
- **Production:** devtools must be stripped from production builds. Either guard with `import.meta.env.DEV` or configure `removeDevtoolsOnBuild` in the `devtools()` Vite plugin. Currently unguarded — TODO.
