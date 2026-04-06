# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Numbers App (artifacts/numbers)

Expo SDK 54 mobile app — real-time crowd-sourced dance competition tracker for parents.

### Key architecture
- **No auth** — manual name-based identity stored in AsyncStorage under key `"user"` as `{ name, profileImage }`
- **AppContext** — single context with `userLoaded` flag; shows `ProfileSetup` on first launch, then `AppShell`
- **API base URL** — `getApiBase()` in AppContext.tsx reads `EXPO_PUBLIC_DOMAIN`; falls back to deriving from `window.location.hostname` by removing the `expo.` prefix (for Expo web when env var not embedded)
- **Polling** — stage + reports polled every 5 s keyed on `competition?.id`

### Storage keys (AsyncStorage)
- `"user"` — `{ name, profileImage }`
- `"joinedCompetitions"` — array of joined competition objects
- `"dancers_{compId}"` — dancer list per competition
- `"schedule_{compId}"` / `"scoring_{compId}"` — image lists per competition

## API Server (artifacts/api-server)

Express 5 + esbuild. No database — all data persisted to disk under `artifacts/api-server/.data/`:

| File | Contents |
|------|----------|
| `competitions.json` | User-created competitions (`ApiCompetition[]`) |
| `stage.json` | Live stage number per competition (`Record<id, StageState>`) |
| `reports.json` | Community alerts per competition (`Record<id, ApiReport[]>`) |
| `schedule.json` | Schedule images (base64) per competition |
| `scoring.json` | Scoring images (base64) per competition |

Shared persistence helper: `src/persistence.ts` — `loadJson` / `saveJson`.

