# Memba production recap — 2026-09-10 21:05:16 AEST

## Session reference

This recap belongs to the Codex production setup session on 2026-09-10 (Australia/Melbourne time). Resume from this conversation and this file: `.agents/2026-09-10-production-recap.md`.

## Current production status

- Production domain is configured on Vercel and the homepage is rendering.
- GitHub CI/CD is working from the `main` branch.
- Clerk production sign-in is working at `/sign-in`.
- The first production Clerk user has signed up.
- Google login remains disabled; magic-link login remains planned.

## Completed during this production setup

- Created the Supabase production schema for:
  - organisations
  - locations
  - employees
  - organisation_memberships
  - customers
  - product_families
  - products
  - product_variants
  - inventory
  - inventory_movements
  - orders
  - order_items
  - daily_registers
  - cash_reconciliations
  - transfers
  - audit_logs
- Added Clerk identity linkage through `employees.clerk_user_id`.
- Seeded Rug Galaxy (`RGG`), Melton (`MEL`), and Sumit’s platform `SUPER_ADMIN` membership.
- Enabled RLS on all production tables.
- Added organisation isolation, platform Super Admin access, and location-level permissions.
- Removed the insecure global RLS auto-enable helper.
- Added private authorization helpers and indexes.
- Supabase security advisor was clean after the RLS fixes.
- Added verified Clerk webhook support at `/api/webhooks/clerk` for users, organisations, and memberships.
- Added server-only Supabase REST access.
- Added `/api/organisations` as the first production data API.
- Updated Clerk middleware public routes to include `/`, `/login`, `/sign-in`, `/sign-up`, and `/api/webhooks/*`.
- Made Clerk sign-in/sign-up routing explicit and enabled dynamic Clerk rendering.
- Updated the provider to bootstrap hosted sessions from Supabase instead of demo LocalStorage data.
- Hosted sessions now show `Workspace unavailable` instead of silently falling back to demo data if production bootstrap fails.

## Important code state

The following changes exist in the working tree and need to be committed/pushed to `main` before they are live:

- `proxy.ts`
- `app/layout.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`
- `app/api/organisations/route.ts`
- `app/api/webhooks/clerk/route.ts`
- `lib/supabase/rest.ts`
- `components/memba-provider.tsx`

Validation passed on 2026-09-10:

- `npm run typecheck`
- `npm run lint` with one pre-existing warning in `.agents/skills/clerk-tanstack-patterns/templates`
- `git diff --check`

## Current blocker

The hosted app displayed `Workspace unavailable` because the initial bootstrap relied on Supabase accepting the Clerk JWT directly. The bootstrap route has now been changed to authenticate with Clerk and use the server-only Supabase key with explicit membership filtering.

The fix has not yet been verified on Vercel. Supabase MCP token refresh and direct DNS resolution were unavailable from the agent environment during the last check.

The Supabase schema was applied directly through MCP, but the project still has no source-controlled local migration history. Capture the live schema into a version-controlled migration before making further database changes.

## First tasks for tomorrow

1. Push the current working-tree changes to `main` and confirm the Vercel deployment contains the latest commit.
2. Sign in as the seeded Clerk user and confirm the dashboard no longer shows `Workspace unavailable`.
3. Open `/api/organisations` while signed in and inspect Vercel Runtime Logs if it returns `401`, `403`, or `502`.
4. Confirm Vercel Production has `SUPABASE_PROJECT_URL`, `SUPABASE_SECRET_KEY`, `CLERK_SECRET_KEY`, and the Clerk publishable key configured.
5. Re-authenticate Supabase MCP if required, then verify Sumit’s employee row and platform membership using read-only queries.
6. Capture the live Supabase schema, policies, functions, indexes, and seed logic into a local migration.
7. Implement the next production slice: organisation, location, and people management writes through server actions/API routes.
8. Add RLS and API integration tests before migrating catalogue, inventory, POS, registers, transfers, and audit logs.

## Prompt to begin tomorrow

Continue the Memba POS production setup from `.agents/2026-09-10-production-recap.md`.

This is a continuation of the Codex production setup session from 2026-09-10. Use the recap and the current conversation as the handoff reference; do not restart the project setup from scratch.

The Vercel production domain and Clerk production sign-in are working. The current working tree contains a production bootstrap fix that authenticates with Clerk, syncs the current user into Supabase, and loads only the user’s permitted organisations, locations, memberships, and employees through `/api/organisations`. Hosted sessions must never fall back to demo LocalStorage data.

First, inspect the current git status and confirm whether the latest auth/provider/API changes are deployed on `main`. Then test the signed-in production flow and diagnose any remaining `Workspace unavailable` response using safe Vercel logs and read-only Supabase queries. Never print `.env.local` or deployment secrets.

After the bootstrap is confirmed, use the Supabase and Supabase Postgres skills to capture the live schema into a source-controlled migration, verify the seeded Clerk user and platform Super Admin membership, and implement the next incremental production slice for organisation, location, and people management. Preserve RLS, organisation isolation, location-level permissions, Clerk webhook verification, and server-only secret usage. Run `npm run typecheck`, `npm run lint`, and `git diff --check` before finishing.

`codex resume, then select Continue Memba POS setup (01a084c3-26e3-7a51-9522-9c437f219f64)`
