# AGENTS.md — @theuj/web

Vite SPA (React 19 + TypeScript, TanStack Router + Query, Tailwind v4 + shadcn/ui) in `apps/web/`. No SSR, no server functions — this is a pure client-side SPA. Part of the `@theuj/monorepo` pnpm workspace; see the root `AGENTS.md` for monorepo-wide conventions.

## Layout

```
apps/web/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn primitives (CLI-generated, no business logic)
│   ├── hooks/           # data-fetching hooks (per-domain)
│   ├── routes/          # file-based routes (TanStack Router)
│   ├── routeTree.gen.ts # auto-generated (committed, never edit)
│   ├── router.tsx       # router factory — single createRouter entry point
│   ├── main.tsx         # mounts <RouterProvider>
│   ├── lib/             # tuyau client, auth store, query client, utils
│   └── styles.css       # Tailwind v4 import + shadcn theme tokens
├── components.json      # shadcn CLI config
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
- **Production:** devtools are stripped from production builds via `import.meta.env.DEV` guard in `__root.tsx`.

## Components (shadcn/ui)

- **`src/components/ui/`** — shadcn-generated primitives only. No business logic, no imports from `#/lib/tuyau`, `#/lib/auth-store`, or any app code. Never import `radix-ui/*` or `@base-ui-components/*` outside this folder.
- **`src/routes/`** — pages. Import UI primitives directly from `#/components/ui/`. Import hooks from `#/hooks/` and lib from `#/lib/`.
- Business components in `src/components/` (outside `ui/`) should be added only when composition/reuse is needed — not preemptively.
- shadcn CLI: `pnpm dlx shadcn@latest add <component>` from `apps/web/`. Config in `components.json`. Style: `new-york`, base color: `neutral`, icons: `lucide`.

## Forms

- **No form library yet.** Auth forms use `useState` + server-side validation (422 errors via Tuyau's `.safe()`).
- TODO: add a form library (React Hook Form or TanStack Form + Zod) when complex forms with client-side validation, dynamic fields, or multi-step flows arrive.

## Data fetching

- **Route components never call `api.*` or `client.*` directly.** All data fetching goes through hooks in `src/hooks/`.
- **Hooks are organized by domain** — `auth.ts`, future `posts.ts`, etc. Each file exports:
  - Custom hooks: `use*` for queries and mutations (e.g. `useProfile`, `useLogin`). No `Query`/`Mutation` suffix — the return value makes the distinction clear.
  - Query options functions: `*QueryOptions` for use in route loaders (`context.queryClient.ensureQueryData(...)`).
  - Plain helpers when needed (e.g. `isAuthenticated()`).
- **No manual query key strings.** Tuyau auto-generates keys via `api.*.queryOptions()`. For cache invalidation, use Tuyau's helpers: `api.routeName.pathKey()` / `api.routeName.pathFilter()`.
- **React Query owns the cache; the router does not.** Route loaders call `context.queryClient.ensureQueryData(*QueryOptions())` to prefetch before render; components read the same cache via the corresponding hook — no duplicate requests.
- **Response wrapper:** mutation/query callbacks receive the full serialized body `{ data: ... }` (backend's `serialize()` contract) — e.g. login success gives `({ data }) => data.token`.
- **Raw HTTP client:** `client.api.*` proxy calls (e.g. `client.api.profile.accessTokens.destroy({})`) are reserved for non-query/mutation usage (imperative calls outside React). Components should not use them directly.

## Testing

- **No test system yet.** Add Vitest + React Testing Library when needed.
- TODO(test): setup test infrastructure
  - Configure Vitest with jsdom / happy-dom
  - Add React Testing Library + user-event
  - Add test utilities (renderWithProviders wrapping QueryClientProvider + RouterProvider)
  - Add e2e tests with Playwright for critical flows (auth, etc.)
  - Configure CI to run tests on PR
