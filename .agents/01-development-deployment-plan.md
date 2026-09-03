# Memba Development and Deployment Plan

## 1. Goal

Build the complete Memba frontend and realistic workflows first, deploy every useful increment for review, and defer Clerk and Supabase connections without coupling UI components to browser storage or a specific database.

The production target is:

`Next.js 16 on Vercel -> Clerk -> server actions/route handlers -> authorization + services -> repository -> Supabase Postgres`

The frontend-development target is:

`Next.js 16 on Vercel/local dev -> development session -> application commands/queries -> localStorage repository`

The application service contracts, validation schemas, DTOs, permissions, and domain rules remain the same in both modes. Only the session and repository adapters change.

## 2. Important Constraint: localStorage and Server Code

Browser `localStorage` cannot be read by Server Components, Server Actions, or Route Handlers. It is also private to one browser and is not shared between users or devices.

Therefore the development mode will:

- use a client-side localStorage repository behind typed application interfaces;
- invoke the same use-case names and Zod contracts intended for server actions;
- keep calculations and inventory rules in pure shared domain services;
- provide a development identity/role switcher instead of real authentication;
- use browser-safe UUID generation and a versioned, deterministic seed dataset;
- reserve actual `"use server"` entry points and `/api/*` Route Handlers for the Supabase/Clerk adapter, because pretending that server code can persist to localStorage would create a false architecture.

LocalStorage is suitable for independent UI development and acceptance-flow demos. It is not suitable for shared staging, concurrency tests, atomic transaction tests, or multi-user demonstrations. Those tests begin when the Supabase development project is connected.

## 3. Tenancy and Roles

Introduce `Organization` as the top-level tenant now, even if the initial deployment has only one organization.

Hierarchy:

`Platform -> Organization -> Locations -> inventory, orders, transfers, customers, users`

Roles:

| Role | Scope | Core access |
| --- | --- | --- |
| `SUPER_ADMIN` | Platform | View all organizations, stores, users and admins; create/activate/archive organizations; appoint organization admins; platform support and audit visibility |
| `ADMIN` | Organization | Full access within one organization, including locations, users, products, reports, and settings |
| `STORE_MANAGER` | Assigned locations | Store reporting, staff, adjustments, refunds, and transfer approval/receipt |
| `STORE_USER` | Assigned locations | POS, inventory search, own/recent sales, and transfer requests |

Prefer memberships instead of storing one role directly on a user:

- `users`: identity profile keyed later by Clerk user ID;
- `organizations`: retailer/business account and status;
- `organization_memberships`: user, organization, role, status;
- `location_memberships`: optional user-to-location assignments;
- every tenant-owned operational table includes `organization_id`;
- every service/repository query requires an organization context rather than accepting an optional filter;
- super-admin access is checked explicitly and audited; it does not silently bypass organization scoping.

Open design decision: whether one person may belong to multiple organizations. The recommended schema supports it at little extra cost.

## 4. Application Boundaries

Use feature-oriented code with a strict server boundary:

```text
app/
  (auth)/login/
  (workspace)/...
  super-admin/...
  api/webhooks/clerk/route.ts
  api/invoices/[id]/route.ts
features/
  products/ inventory/ sales/ transfers/ customers/ reporting/ organizations/
    components/
    schemas.ts
    actions.ts
lib/
  domain/          # pure money, GST, inventory, order and transfer rules
  application/     # use cases and DTOs
  auth/            # session provider and permission checks
  repositories/    # interfaces plus local and Postgres implementations
  storage/local/   # versioned localStorage database, seeds and migrations
  db/              # Prisma client and transaction helpers (connection phase)
prisma/
  schema.prisma
  migrations/
  seed.ts
```

Rules:

- React components never mutate inventory or calculate authoritative financial totals.
- UI reads/writes through typed query/command facades.
- All inputs are parsed by shared Zod schemas at the boundary.
- Money is represented as integer cents in TypeScript; PostgreSQL can use integer cents or `DECIMAL(12,2)` consistently.
- DTOs expose only fields required by the screen.
- Server Components call the data/application layer directly; they do not make internal HTTP calls to Route Handlers.
- Server Actions handle first-party UI mutations and re-check authentication, organization scope, and permission on every invocation.
- Route Handlers are public HTTP boundaries only where an HTTP endpoint is genuinely needed: Clerk webhooks, invoice downloads, email/provider callbacks, health checks, and future integrations.
- Domain/application services contain complete-sale, transfer, receive, adjustment, refund, GST, snapshot, and audit rules.

## 5. Development Environments and Deployments

| Environment | Deployment | Data/Auth mode | Purpose |
| --- | --- | --- | --- |
| Local | `next dev` | localStorage + dev identity | Fast feature work |
| Pull request | Vercel Preview | Build/shell preview until shared services exist; then Clerk dev + Supabase dev | Visual review initially, integrated review later |
| Development | Stable Vercel branch URL | Clerk development + Supabase development | Shared integration and stakeholder testing |
| Production | Vercel production | Clerk production + Supabase production | Live operations |

Configuration:

- `NEXT_PUBLIC_DATA_MODE=local` enables only the browser adapter and a visible development-mode badge; this mode is permitted only on localhost.
- Production builds fail if local mode or the development identity switcher is enabled.
- Non-local deployments fail fast unless shared development or production services are configured.
- Server secrets never use `NEXT_PUBLIC_*` and are only imported by server-only modules.
- Maintain `.env.example` with names and descriptions, never credentials.
- Vercel Preview/Development/Production variables are separate.
- Use a stable seed reset action in local mode; store a `schemaVersion` and migrate or reset incompatible browser data safely.
- Add CI gates for lint, typecheck, unit tests, and production build before deployment promotion.

Do not use static export: Server Actions, Route Handlers, Clerk, invoice generation, and Postgres require a server-capable deployment. Vercel's normal Next.js runtime is the intended target.

## 6. Delivery Phases

### Phase 0 — Contracts and Deployment Foundation

- Establish route groups, workspace shell, responsive navigation, error/loading boundaries, and design tokens.
- Define IDs, enums, DTOs, money/GST utilities, Zod schemas, repository interfaces, permission policy, organization context, and action result/error format.
- Add organization-aware sample data: at least two organizations for super-admin testing, five locations for the primary organization, all four roles, 15+ products, inventory, orders, payments, transfers, and movements.
- Build versioned localStorage persistence, reset/seed control, development identity/organization/location switcher, and development-mode banner.
- Configure Vercel preview deployments and CI without external service secrets.

Exit: deployed shell can switch personas and organizations and persists seeded mock data per browser.

### Phase 1 — Identity and Administration UI

- Mimic login, logout, session expiry, unauthorized, inactive user, and inactive organization states.
- Build role-aware navigation and route guards for UX; keep permission checks inside every command/query too.
- Build super-admin dashboard for multiple independent retail businesses: organizations, organization detail, all locations, users/admins, create/edit/archive organization, and assign initial admin.
- Build explicit super-admin impersonation: select organization and target user, enter a reason, show a persistent impersonation banner, provide one-click exit, use a short-lived impersonation session, and audit start/end and every privileged mutation with both actor and effective user IDs. Never expose or assume the target user's Clerk credentials.
- Build organization admin locations/users/settings screens.

Exit: permission acceptance checks pass for UI and application commands, including a store user receiving forbidden when attempting to create a location.

### Phase 2 — Catalogue and Inventory

- Products, variants, images/placeholders, archive behavior, inventory by location, global/product search, filters and pagination-shaped query contracts.
- Stock adjustments and immutable inventory movement history.
- All inventory mutations go through inventory services and create audit entries.

Exit: realistic catalogue and stock workflows work under all personas and organization boundaries.

### Phase 3 — POS and Orders

- Fast product search, multi-item cart, optional customer, quantities, discounts, Cash/EFT payments, drafts, success screen, orders and order detail.
- Recalculate prices, GST and totals in the domain service; never trust browser totals.
- Complete-sale use case performs the full logical transaction in local mode and supports rollback by committing one immutable next-state snapshot only after all validations pass.
- Persist order-item snapshots and stock movements.

Exit: sale, insufficient-stock, GST and multi-item PRD acceptance scenarios pass.

### Phase 4 — Invoices and Customers

- Invoice view and print stylesheet first; then PDF/download and email UI states using mock delivery receipts.
- Customer list/detail and optional association with orders.
- Keep document generation and delivery behind provider interfaces for later React PDF/Resend connection.

Exit: completed sales produce stable historical invoices and all user-facing delivery states are demonstrable.

### Phase 5 — Transfers

- Create/request, approve, dispatch, receive, and cancel using the full `REQUESTED -> APPROVED -> IN_TRANSIT -> RECEIVED` workflow, plus cancellation rules.
- Enforce source/destination rules and inventory transitions through transfer/inventory services.
- Record movements and audit history.

Exit: dispatch/receipt acceptance scenario passes without direct UI stock edits.

### Phase 6 — Dashboards and Reports

- Staff, manager, organization-admin, and super-admin dashboards.
- Sales/payment/GST/inventory reports with date/location filters and permission-safe aggregates.
- Reconciliation view and export-shaped interfaces; defer nonessential integrations.

Exit: each role sees only allowed organizations and locations, with totals derived from underlying records.

### Phase 7 — Production Connections

- Add Prisma schema and migrations targeting Supabase Postgres; use the Supabase pooler/runtime connection appropriate for Vercel plus a direct migration connection.
- Implement Postgres repositories while retaining local repositories for story/demo development.
- Add Clerk provider, middleware/proxy integration as required by the installed Clerk version, session adapter, webhook verification, user synchronization, invitations, organization membership mapping, and secure impersonation claims/session exchange.
- Implement database transactions and row locking/conditional updates for sale completion and transfer receipt.
- Add tenant indexes and organization-scoped uniqueness constraints for SKUs, readable order numbers, location codes, and other business identifiers. Internal UUIDs remain globally unique.
- Create RLS as defense in depth if queries use Supabase's data API; server-side authorization remains mandatory. If only Prisma uses a privileged direct connection, RLS alone cannot enforce app-user isolation.
- Migrate deterministic seed scenarios to Supabase development and run concurrency/integration tests.

Exit: changing the configured adapters runs the same screens and use cases against shared development services.

### Phase 8 — Production Readiness and Launch

- Connect image storage, invoice PDF/email, monitoring, rate limits for public endpoints, structured logs, backups, restore drill, retention policy, privacy/security review, and audit review.
- Add end-to-end critical paths, cross-tenant isolation tests, accessibility checks, tablet/mobile checks, and performance baselines.
- Create production Clerk/Supabase/Vercel projects, apply migrations, seed only the first super admin and organization, verify custom domain and email DNS, and complete a staging rehearsal.
- Use a launch checklist and rollback plan; promote the tested commit rather than rebuilding an untested branch.

Exit: PRD definition of done plus cross-tenant isolation, transaction concurrency, backup, monitoring, and deployment rollback checks pass.

## 7. Testing Strategy

- Unit: money/GST, inventory availability, discounts, permissions, status transitions, order snapshots.
- Contract: run a shared repository test suite against localStorage and Postgres implementations.
- Application: complete sale, adjust stock, dispatch/receive transfer, refund, organization administration, and forbidden actions.
- Integration: Prisma constraints, transactions, concurrent sales, Clerk webhook idempotency, organization scoping.
- End-to-end: one critical journey per persona on desktop and tablet.
- Deployment smoke: login/session, seed visibility, sale, invoice, transfer, dashboard, health endpoint, and error reporting.

Local-mode tests validate behavior but do not prove database atomicity or multi-user concurrency. Those are explicit Supabase-development gates.

## 8. Recommended Initial Decisions

- Use Prisma as specified by the PRD unless there is a strong preference for Drizzle.
- Use Clerk only for identity/session and invitations; keep business roles, organization status, multi-organization memberships, multi-location assignments, and impersonation audit records in Postgres.
- Treat Clerk Organizations as optional identity-provider metadata, not the sole authorization source. Postgres remains authoritative for application permissions.
- Make `organization_id` mandatory on all operational data now; users may have memberships in multiple organizations and locations.
- Keep one codebase and adapter switch, not separate mock and production applications.
- Use Server Actions for app mutations, direct DAL/application calls for Server Component reads, and Route Handlers for externally addressable endpoints.
- Apply discounts at order-item level. Staff may enter item discounts while building a sale, but a discounted sale cannot be finalized until a manager enters their approval code at checkout. One approval authorizes the finalized set of item discounts; changing an item, price, quantity, or discount after approval invalidates it and requires approval again.
- If the authenticated billing user is a `STORE_MANAGER`, `ADMIN`, or `SUPER_ADMIN`, no approval code is required; their active authorized session supplies the approval identity.
- Store the original unit price, discount type/value, calculated discount amount, reason when required, requesting salesperson, approving manager, approval timestamp, and an integrity reference to the approved cart state on the order/item snapshots and audit record.
- Manager approval codes must be individually assigned, hashed at rest, never logged or returned to clients, rate-limited/locked after repeated failures, revocable, and verified server-side once Clerk/Postgres are connected. Local mode mimics the same behavior with seeded development-only codes.
- Restrict localStorage and the development persona switcher to local development. Any remotely deployed interactive environment uses shared Supabase development data.

## 9. Confirmed Product Decisions

- Memba supports multiple independent retail businesses.
- A user may belong to multiple organizations and multiple locations.
- Super admins may impersonate organization users, subject to explicit session controls and comprehensive auditing.
- Only super admins create organizations unless this policy is changed later.
- Transfers use the full `REQUESTED -> APPROVED -> IN_TRANSIT -> RECEIVED` workflow.
- Staff may request price overrides or discounts; manager approval is required.
- Discounts are item-level. At finalization, a manager enters their code to approve the complete discounted cart. A manager or higher role performing the sale does not need a passcode.
- localStorage is strictly for local development and is never the persistence layer for a remote deployment.
- SKUs and readable order numbers are unique per organization.

## 10. Discount Approval Rules

- Discounts are applied to individual order items, not only to the order total.
- Every staff-created discounted sale requires approval when it is finalized; there is no threshold exemption.
- A manager approves in person by entering their individual approval code at the POS.
- One approval covers the finalized discounted cart. Any subsequent cart or discount change invalidates that approval.
- A manager, organization admin, or super admin who is the authenticated billing user can finalize without entering a separate code.
- Approval records identify the billing user and approving manager separately and are immutable audit data.
