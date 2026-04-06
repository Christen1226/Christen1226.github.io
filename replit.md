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

## Artifacts

### Numbers (Mobile — Expo SDK 54)
Dance competition tracker for parents. Located at `artifacts/numbers`.

**Auth**: Clerk (`@clerk/expo`) with email/password, Google OAuth, and Apple OAuth.
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` auto-provisioned via `setupClerkWhitelabelAuth()`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` injected at dev-time via the `dev` script in `package.json`
- ClerkProvider wraps the entire app in `app/_layout.tsx`
- Unauthenticated users → redirected to `/(auth)/sign-in` from `(tabs)/_layout.tsx`
- Auth screens: `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`
- User identity (`isSignedIn`, `userName`, `userInitials`) derived from Clerk's `useUser()` in `context/AppContext.tsx`
- Profile photo stored in AsyncStorage under key `profileImage`

**API Server**: Express at `artifacts/api-server` with Clerk proxy middleware (`/__clerk`).
- Clerk middleware (`@clerk/express`) installed; API routes are currently public (no `requireAuth` guard).
