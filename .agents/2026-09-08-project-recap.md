# Memba project recap — 2026-09-08

## Completed in this pass

- Storewide trading-day screen at `/day` with shared open/closed state.
- Store staff and managers can open the organisation day; managers/admins can close it with counted cash and notes.
- POS is blocked while the organisation day is closed.
- Dashboard now contains required actions and links to day control, transfers and low stock.
- Reports no longer owns day open/close controls.
- Confirmation prompts added for sale completion, product creation, variant creation, stock adjustments, day opening and day closing.
- Functional global search in the app header for products, SKUs, orders and customers.
- Header user block aligned to the right.
- Order numbers now use `ORGCODE-YY-000001` format and sequence per organisation/year.
- Added order statuses: quote, partially paid, paid/unfulfilled, paid, void, cancelled and refunded.
- Managers and above can update order status from order detail with confirmation.
- Added customer module at `/customers` with contact details and linked order history/pending-order counts.
- POS can associate a sale with an existing customer.

## Existing foundation

- LocalStorage development data layer with Supabase/Clerk-ready provider boundaries.
- Organisation, location, people, inventory, variants, transfers, POS, held sales, reports, PDF print flow and settings.
- Super-admin location limits and manager discount approval codes.
- Role-based navigation and organisation/location scoping.

## Supabase and Clerk readiness

The frontend is ready for the integration phase, but I recommend one short hardening pass before connecting production services:

1. Define the Supabase schema and migrations for organisations, memberships, locations, customers, products, variants, inventory movements, orders, transfers, registers and audit logs.
2. Add organisation-scoped Row Level Security policies and server-side mutation functions.
3. Replace LocalStorage provider mutations with server actions/API routes while retaining the current provider interface.
4. Connect Clerk invite-only authentication, Google login, role claims and impersonation/audit handling.
5. Add a migration/import script for the current local seed data and verify order-number sequences under concurrent writes.
6. Add automated tests for closed-day sale blocking, cash reconciliation, role permissions, discount approvals, customer/order associations and status transitions.

The main remaining product decision is the exact fulfilment workflow for quotes, partial payments and paid-unfulfilled orders. The UI/data model now supports those states, but payment capture, fulfilment events and void/refund accounting should be confirmed before production accounting data is stored.
