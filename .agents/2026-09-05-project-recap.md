# Memba project recap — 2026-09-05

## Current position

Memba is a multi-organisation retail operations and POS frontend for independent retail businesses. Rugs are the primary category, with the catalogue model ready to extend to bedding, flooring and furnishings.

The application is currently in a local-development phase. Data is persisted in the browser with `localStorage`; Supabase Postgres and Clerk are deliberately deferred until the frontend workflows are proven.

## Working today

### Application and access

- Public landing page at `/`.
- Invite-only sign-in layout at `/login` with email/password and Google entry points.
- No public sign-up flow.
- Workspace dashboard at `/dashboard`.
- Role-aware local development personas for super admin, organisation admin, store manager and store user.
- Super admin can view organisations, impersonate users with an audit reason, and create organisations.
- Organisation admins can manage locations, members, products and variants.
- Settings at `/settings` with working role-aware tabs for profile, workspace, access, notifications and development.

### POS and orders

- POS at `/sales/new` and dedicated floor-staff window at `/pos`.
- Open POS window action launches a separate resizable browser window.
- Persistent active sales stored per user and organisation.
- Multiple held sales with visible cards and Resume actions.
- Sale can be held, resumed, voided or completed.
- Item-level discounts.
- Manager approval code required for discounted staff sales; local demo code is `2468`.
- Managers and admins can discount without entering a code.
- Cash and EFT payment modes.
- Order/invoice number sequence is organisation-scoped and unique for completed orders.
- Existing orders open from `/orders` into `/orders/[id]`.
- Invoice Print and Save as PDF actions use the browser print dialog with print styling.

### Catalogue and inventory

- Rug product and variant catalogue with unique SKUs.
- SKU rule is calculated as `productID-colourCode-lengthwidth`, matching the agreed example:

  `MR266-CRGR-160230`

- Variant model supports supplier, article number, barcode, descriptions, features, construction, origin, material, dimensions, weight, design, tags, rooms used in, pricing, GST, reorder level and washable metadata.
- Inventory matrix shows products/variants as rows, all active locations as columns, row totals and grand totals.
- Dedicated stock adjustment page at `/inventory/adjust`.
- Manual variant creation at `/products/variants/new`.
- Admin CSV inventory import calculates SKU from `product_id`, `colour`, `length_cm` and `width_cm`.
- Example CSV is available at `public/memba-inventory-import-example.csv`.
- Inventory movement ledger records stock changes, sales and transfers.

### Transfers and day operations

- Inter-store transfer lifecycle:

  `Requested → Approved → In transit → Received`

- Transfer permissions are role and location aware.
- Daily register workflow in Reports:
  - Open a day per location.
  - View cash sales and EFT sales.
  - Compare expected cash with counted cash.
  - End the day and record variance, user and timestamp.

## Important development-only limitations

- Clerk is not connected yet; the sign-in page currently demonstrates the intended flow and redirects into the local workspace.
- Supabase/Postgres is not connected yet; provider mutations are local and client-side.
- Approval code `2468` is a development fallback and must become a securely hashed server-side credential.
- CSV parsing is intentionally simple and should be replaced with robust quoted-CSV parsing before production.
- PDF currently means browser print-to-PDF, not a generated server PDF file.
- Inventory reservations for held sales are not yet implemented, so held stock is not protected from another sale.
- Notification preferences are currently frontend-local controls.
- Email invitations, password reset and email invoice delivery are UI placeholders.

## Ideal next steps

### 1. Stabilise the domain contracts

- Finalise the Supabase schema for organisations, locations, users, memberships, products, variants, inventory, movements, orders, transfers, daily registers and audit logs.
- Add database constraints for organisation-scoped SKU uniqueness, barcode uniqueness where required, order sequence uniqueness and valid inventory quantities.
- Add migrations and seed data matching the current local demo.

### 2. Introduce the server boundary

- Move provider operations into Next.js Server Actions or Route Handlers.
- Keep the current UI contracts so local and remote repositories can be swapped without rewriting screens.
- Add server-side validation and transaction handling for sale completion, stock adjustment, transfers, register close and CSV imports.

### 3. Connect Clerk authentication

- Replace the demo persona selector with Clerk session identity.
- Implement invite-only onboarding and password reset.
- Add Google OAuth through Clerk.
- Synchronise Clerk users to organisation memberships.
- Enforce every organisation/location permission on the server.

### 4. Add production inventory controls

- Reserve inventory for held sales.
- Add reservation expiry and release when a sale is voided or abandoned.
- Add transfer reservations so source stock cannot be promised twice.
- Add robust CSV import preview, row-level errors, rollback and import history.

### 5. Finish operational workflows

- Add proper cash float/opening balance support.
- Add manager approval audit records for discounts.
- Add refunds, cancellations and returns.
- Generate downloadable invoice PDFs server-side.
- Implement email invoices and invitation emails.
- Add daily register history and exportable reconciliation reports.

### 6. Deployment progression

- Continue localStorage for rapid feature development.
- Deploy frontend previews through Vercel without requiring production credentials.
- Create separate Supabase projects for development, staging and production.
- Add Clerk development and production instances.
- Configure environment variables per deployment target.
- Enable database row-level security, backups, error monitoring and audit retention before production launch.

## Verification status

- TypeScript passes.
- ESLint passes.
- `git diff --check` passes.
- Next.js production builds pass in Webpack mode.
- Turbopack build is blocked in this environment by an internal process-port restriction, not an application compilation error.
