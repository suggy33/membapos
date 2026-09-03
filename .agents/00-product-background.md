# Memba

## Rug Retail Inventory Management & Point of Sale System

**Product:** Memba
**Version:** MVP / V1
**Platform:** Responsive web application
**Primary users:** Rug shop staff, store managers, administrators
**Initial footprint:** 4 retail stores + 1 central warehouse

---

# 1. Product Overview

Memba is a simple, modern inventory management and point-of-sale system designed specifically for a multi-store rug retailer.

The system should allow staff to:

- See what inventory is available at each store and warehouse.
- Search rugs quickly by SKU, design, colour, size, category or other attributes.
- Create a customer sale/order.
- Add multiple products to the same order.
- Record Cash or EFT payments.
- Calculate GST automatically.
- Generate and print/email invoices.
- Transfer stock between stores and warehouse.
- Add, edit and remove products.
- Add and manage stores.
- Track inventory movements.
- Provide different dashboards for staff, managers and administrators.

The key philosophy of Memba is:

> **Fast enough to use while standing in front of a customer.**

The interface should therefore prioritise simplicity over feature density.

---

# 2. Product Objectives

Memba should solve five core problems.

### 1. Know where every rug is

Staff should be able to determine whether a rug is:

- in Store A
- in Store B
- in the warehouse
- reserved
- sold
- being transferred

without making phone calls between stores.

### 2. Make sales quickly

A staff member should be able to create a sale in approximately 30–60 seconds.

### 3. Maintain accurate inventory

Every sale, transfer, adjustment or stock receipt should automatically update inventory.

### 4. Give management visibility

Management should know:

- sales today
- sales by store
- sales by employee
- cash collected
- EFT collected
- GST collected
- stock value
- stock movement
- low-stock products
- pending transfers

### 5. Keep the system simple

Staff should require almost no training.

---

# 3. Recommended Technology Stack

## Frontend

**Next.js 16+**

- App Router
- React Server Components
- Server Actions where appropriate
- TypeScript

## Styling

**Tailwind CSS**

Recommended component library:

**shadcn/ui**

Useful components:

- Dialog
- Sheet
- Data Table
- Command
- Dropdown
- Tabs
- Toast
- Calendar
- Form
- Badge
- Card
- Drawer

## Database

### Recommended

**PostgreSQL**

Possible providers:

- Neon
- Supabase PostgreSQL
- Vercel Postgres-compatible provider

Postgres should be the source of truth for:

- products
- inventory
- sales
- invoices
- transfers
- stock movements
- stores
- users

### ORM

**Prisma**

or alternatively Drizzle.

For this project, Prisma is recommended because the schema will be easy for Codex and future developers to understand.

---

# 4. Authentication

Recommended:

**Firebase Authentication**

Supported login methods initially:

- Email + password
- Google authentication

Potential future:

- Microsoft
- Magic link
- Passkeys

Authentication and application permissions should remain separate.

Firebase determines:

> Who is this user?

Postgres determines:

> What is this user allowed to do?

---

# 5. Hosting

**Vercel**

Suggested architecture:

Next.js
↓
Firebase Auth
↓
Next.js API / Server Actions
↓
Prisma
↓
PostgreSQL

Additional optional services:

- Resend for invoice emails
- Vercel Blob / S3 for product images
- React PDF / PDFKit for invoices
- Sentry for error monitoring

---

# 6. User Roles

Memba should support three primary permission levels.

---

## 6.1 Store User

A standard salesperson/store employee.

Can:

- view their store inventory
- search inventory across stores
- create sales
- add items to sales
- record Cash/EFT payment
- print invoices
- email invoices
- view their recent transactions
- request stock transfer
- view incoming/outgoing transfers

Cannot:

- modify historical sales
- delete products
- change system settings
- add stores
- modify users
- see company-wide financial reports unless permitted

---

## 6.2 Store Manager

Includes all Store User capabilities.

Additionally can:

- view store dashboard
- view all store sales
- see staff sales performance
- approve store transfers
- perform stock adjustments
- receive stock
- edit some product information
- view cash/EFT reconciliation
- view GST
- view inventory value
- manage staff assigned to their store

---

## 6.3 Administrator

Full system access.

Can:

- see company-wide dashboard
- add/edit/archive stores
- create/edit/archive products
- create/edit variants
- manage inventory
- transfer inventory
- modify stock levels
- manage users and permissions
- view every transaction
- view financial reporting
- void/refund orders
- configure invoice settings
- configure tax settings
- audit inventory activity
- export data

---

# 7. Locations

Memba should treat both retail stores and warehouses as **Locations**.

Example:

| Location       | Type      |
| -------------- | --------- |
| Store 1        | STORE     |
| Store 2        | STORE     |
| Store 3        | STORE     |
| Store 4        | STORE     |
| Main Warehouse | WAREHOUSE |

This architecture makes it possible to add more locations later without changing the database.

---

# 8. Store Management

Admin should have:

**Settings → Locations**

Admin can:

- Add location
- Edit location
- Archive location

Fields:

### Location

- Location ID
- Name
- Location Code
- Type
- Address Line 1
- Address Line 2
- Suburb
- State
- Postcode
- Country
- Phone
- Email
- Manager
- ABN if required
- Active/Inactive
- Created Date
- Updated Date

Example:

**Name:** Richmond Rug Gallery
**Code:** RCH
**Type:** Store
**Phone:** 03 xxxx xxxx

---

# 9. Product Structure

Products should use a two-level structure.

### Product

Represents the design/range.

Example:

**Persian Heritage 302**

### Variant

Represents the actual sellable item.

Example:

**Persian Heritage 302 / Red / 200 × 300 cm**

This architecture will integrate cleanly with Shopify later.

---

# 10. Product Fields

## Product

- ID
- Product Name
- Design Number
- Description
- Brand
- Collection
- Category
- Material
- Country of Origin
- Style
- Image
- Status
- Created At
- Updated At

Possible categories:

- Persian
- Modern
- Traditional
- Tribal
- Shaggy
- Runner
- Outdoor
- Kids
- Clearance

---

# 11. Product Variant

A variant represents actual inventory.

Fields:

- Variant ID
- Product ID
- SKU
- Barcode
- Colour
- Width CM
- Length CM
- Display Size
- Cost Price
- Retail Price
- Sale Price
- GST Applicable
- Supplier SKU
- Active
- Created At
- Updated At

Example:

Product:

Persian Heritage

Variant:

SKU: PH302-RD-200300

Colour: Red

Size:

200 × 300 cm

Retail Price:

$1,499

---

# 12. Inventory Model

Do **not** store inventory only as a number against the product.

Inventory must be maintained per location.

Example:

| Variant           | Location  | Qty |
| ----------------- | --------- | --: |
| PH302 Red 200×300 | Richmond  |   1 |
| PH302 Red 200×300 | Preston   |   2 |
| PH302 Red 200×300 | Warehouse |   6 |

---

# 13. Inventory Status

Inventory should support:

- AVAILABLE
- RESERVED
- IN_TRANSFER
- SOLD
- DAMAGED

For the MVP, quantities can primarily be maintained using:

- quantityAvailable
- quantityReserved

with stock movements providing the audit history.

---

# 14. Inventory Search

Inventory search is one of the most important experiences in Memba.

There should be a large global search field.

Placeholder:

**Search SKU, design, colour, size...**

Search by:

- SKU
- Barcode
- Product name
- Design number
- Colour
- Size
- Category
- Collection

Results should immediately show:

Product image

Product / Variant

SKU

Size

Colour

Price

Location availability

Example:

**Persian 302**

Red
200 × 300

$1,499

Richmond: 1
Preston: 0
Dandenong: 2
Warehouse: 7

Buttons:

**Add to Sale**

**Transfer**

---

# 15. New Sale / POS

The POS should be exceptionally simple.

Primary navigation button:

# + New Sale

Clicking it opens:

**New Sale**

---

# 16. Sale Fields

Automatically generated:

- Order Number
- Date
- Time
- Store
- Salesperson

Optional customer:

- Customer Name
- Phone
- Email
- Address

Customer information should not be mandatory for walk-in purchases.

---

# 17. Adding Items

The sale contains multiple order items.

Each item contains:

- Product
- Variant
- SKU
- Qty
- Unit Price
- Discount
- Line Total

Example:

| Item                | Qty |  Price |  Total |
| ------------------- | --: | -----: | -----: |
| Persian 302 200×300 |   1 | $1,200 | $1,200 |
| Runner 204 80×300   |   2 |   $300 |   $600 |

Staff can click:

**+ Add Item**

as many times as required.

---

# 18. Order Calculation

Australian GST:

**10%**

Prices should preferably be entered GST inclusive.

Example:

Items:

$1,800

GST included:

$163.64

Total:

$1,800

Formula:

GST component of GST-inclusive amount:

GST = Total / 11

Therefore:

$1,800 / 11 = $163.64

If the application internally stores prices excluding GST instead, calculate:

GST = Subtotal × 10%

However, Australian retail POS generally benefits from displaying GST-inclusive prices.

---

# 19. Payment

Payment section:

## Payment Method

Large buttons:

**Cash**

**EFT**

Future:

- Stripe
- Gift Card
- Store Credit
- Split Payment

Fields:

Payment method

Amount

Reference/Notes

Example:

EFT

$1,800

For future-proofing, payments should have their own table rather than putting paymentMethod directly on the Order.

This enables later support for:

$500 Cash
$1,300 EFT

on one order.

---

# 20. Complete Sale

Bottom-right primary button:

# Complete Sale

Before completion:

Validate:

- sale has at least one item
- sufficient stock exists
- payment amount matches total

When completed, system should perform one database transaction:

1. Create order.
2. Create order items.
3. Create payment.
4. Deduct inventory.
5. Create inventory movement.
6. Create invoice.
7. Mark order COMPLETE.

This operation must be atomic.

If one step fails, none should be committed.

---

# 21. Order Numbers

Use readable order numbers.

Example:

MEM-RCH-20260831-1043

or simpler:

MEM-10432

Database should still maintain an internal UUID.

---

# 22. Orders

Order statuses:

- DRAFT
- COMPLETED
- CANCELLED
- REFUNDED
- PARTIALLY_REFUNDED

Potential future:

- QUOTE
- LAYBY
- DEPOSIT
- DELIVERY_PENDING

---

# 23. Invoice

When a sale completes:

Generate invoice automatically.

Invoice should contain:

### Business

- Business name
- ABN
- Store address
- Phone
- Email

### Invoice

- Invoice Number
- Order Number
- Invoice Date
- Salesperson

### Customer

If supplied:

- Name
- Phone
- Email
- Address

### Items

- Product
- Variant
- SKU
- Qty
- Unit Price
- Line Total

### Totals

Subtotal

Discount

GST

Total

Amount Paid

Payment Method

---

# 24. Invoice Actions

After sale:

Display success screen:

# Sale Complete

**$1,800**

Buttons:

**Print Invoice**

**Email Invoice**

**Download PDF**

**New Sale**

---

# 25. Inventory Management

Inventory section should contain:

### Inventory

Tabs:

- All Inventory
- By Store
- Warehouse
- Low Stock
- Transfers
- Stock Adjustments

Actions:

**+ New Product**

**+ Transfer Stock**

**+ Stock Adjustment**

---

# 26. Add New Product

Form should initially be simple.

### Product Information

Product Name

Design Number

Category

Collection

Brand

Material

Description

Image

### Variant

SKU

Barcode

Colour

Width

Length

Cost Price

Retail Price

Initial Stock

Initial Location

Button:

**Save Product**

After saving, additional variants can be added.

---

# 27. Editing Products

Product page:

Product Image

Product Name

Design Number

Details

Variants

Inventory by Location

Movement History

Buttons:

**Edit**

**Add Variant**

**Transfer**

**Adjust Stock**

**Archive**

Avoid physically deleting products that have transaction history.

Use:

`archivedAt`

or:

`isActive = false`

This preserves reporting integrity.

---

# 28. Stock Transfers

Example:

Warehouse → Richmond Store

Transfer flow:

**Inventory → Transfer Stock**

Fields:

From Location

To Location

Transfer Date

Items

Qty

Notes

Buttons:

**+ Add Item**

**Create Transfer**

---

# 29. Transfer Status

Transfer statuses:

- DRAFT
- REQUESTED
- APPROVED
- IN_TRANSIT
- RECEIVED
- CANCELLED

Simplified MVP could use:

- CREATED
- IN_TRANSIT
- RECEIVED
- CANCELLED

---

# 30. Transfer Behaviour

Example:

Warehouse:

10 rugs

Transfer:

3 rugs → Richmond

Once transfer marked IN_TRANSIT:

Warehouse available:

7

In Transfer:

3

Once Richmond receives:

Richmond:

+3

Inventory movement history records both events.

---

# 31. Stock Adjustment

Managers/admins occasionally need to fix stock.

Reasons:

- stocktake correction
- damaged item
- lost item
- supplier return
- manual correction
- initial stock
- other

Adjustment requires:

Location

Variant

Old Qty

Adjustment

New Qty

Reason

Notes

User

Timestamp

All stock adjustments must be permanently logged.

---

# 32. Inventory Movement Ledger

This is extremely important.

Every inventory change creates a StockMovement record.

Types:

- INITIAL_STOCK
- SALE
- SALE_REFUND
- TRANSFER_OUT
- TRANSFER_IN
- ADJUSTMENT_IN
- ADJUSTMENT_OUT
- PURCHASE_RECEIPT
- SUPPLIER_RETURN

Fields:

- ID
- Variant
- Location
- Movement Type
- Quantity Change
- Quantity Before
- Quantity After
- Reference Type
- Reference ID
- User
- Notes
- Timestamp

Example:

SKU PH302

Richmond

SALE

-1

Before: 3

After: 2

Order: MEM-10432

---

# 33. Dashboard

Dashboard depends on user role.

---

# 34. Store Staff Dashboard

Simple dashboard.

Top:

**Good morning, John**

Cards:

### Sales Today

$8,450

### Orders Today

12

### My Sales

$4,200

### Store Inventory

387 items

Below:

Recent Sales

Incoming Transfers

Quick Actions:

**New Sale**

**Find Rug**

**View Inventory**

---

# 35. Store Manager Dashboard

Cards:

### Sales Today

### Sales This Week

### Orders

### Average Order Value

### Cash

### EFT

### GST

### Inventory Value

Charts:

Sales Last 7 Days

Sales by Staff

Sales by Category

Tables:

Low Stock

Incoming Transfers

Recent Stock Adjustments

---

# 36. Admin Dashboard

Company-wide dashboard.

Filters:

Today
Yesterday
7 Days
30 Days
Custom

Location filter:

All Stores

Store A

Store B

Store C

Store D

Warehouse

KPIs:

### Revenue

### Orders

### Average Order Value

### Cash Sales

### EFT Sales

### GST Collected

### Items Sold

### Inventory Retail Value

### Inventory Cost Value

Charts:

Revenue by Store

Sales Trend

Top Products

Sales by Category

Sales by Employee

Inventory by Location

Transfers Pending

---

# 37. Navigation

Desktop sidebar:

**Memba**

Dashboard

**Sales**

- New Sale
- Orders
- Customers

**Inventory**

- Inventory
- Products
- Transfers
- Stock Adjustments

**Reports**

**Management**

- Locations
- Users

**Settings**

User profile at bottom.

---

# 38. Mobile Navigation

Memba should work well on tablets.

Primary use is likely:

- Desktop POS
- iPad
- Laptop

Mobile navigation:

Dashboard

Inventory

**+ Sale**

Orders

More

The New Sale button should remain prominent.

---

# 39. UI Design Principles

Memba should visually feel closer to:

- Stripe
- Linear
- Shopify Admin
- Square POS

rather than traditional warehouse software.

Avoid:

- cluttered ERP interfaces
- giant menus
- excessive tables
- tiny buttons
- unnecessary fields
- old-fashioned grey interfaces

---

# 40. Design System

Use generous spacing.

Recommended page width:

`max-w-[1600px]`

Cards:

- subtle border
- 12–16px radius
- minimal shadows

Buttons:

Primary actions visually obvious.

Examples:

**+ New Sale**

**Complete Sale**

**Transfer Stock**

Use icons carefully.

Recommended:

Lucide Icons

Examples:

- Package
- ShoppingCart
- ArrowRightLeft
- Warehouse
- Store
- Receipt
- Users
- Search
- Plus
- Settings

---

# 41. Colour Philosophy

Keep Memba largely neutral.

Example:

Background:

White / very light grey

Primary:

Dark charcoal / black

Accent:

A single tasteful brand colour.

Status colours only where useful:

Green = completed

Amber = pending

Red = problem / cancelled

Blue = transfer / information

Do not overload the interface with colours.

---

# 42. Global Search

Top navigation should include:

**Search Memba...**

Search should find:

- product
- SKU
- barcode
- order
- invoice
- customer

Keyboard shortcut:

`⌘ K`

Future global command palette could support:

New Sale

Find Product

Create Transfer

---

# 43. Suggested Database Schema

Core database entities:

---

## users

- id UUID PK
- firebase_uid VARCHAR UNIQUE
- first_name
- last_name
- email
- phone
- role ENUM
- primary_location_id FK
- active BOOLEAN
- created_at
- updated_at

Roles:

STORE_USER
STORE_MANAGER
ADMIN

---

## locations

- id UUID PK
- name
- code UNIQUE
- type ENUM
- address_line_1
- address_line_2
- suburb
- state
- postcode
- country
- phone
- email
- manager_user_id
- active
- created_at
- updated_at

Types:

STORE
WAREHOUSE

---

## products

- id UUID PK
- name
- design_number
- description
- brand
- collection
- category
- material
- country_of_origin
- image_url
- active
- created_at
- updated_at

---

## product_variants

- id UUID PK
- product_id FK
- sku UNIQUE
- barcode
- colour
- width_cm
- length_cm
- cost_price DECIMAL
- retail_price DECIMAL
- sale_price DECIMAL NULL
- gst_applicable BOOLEAN
- supplier_sku
- active
- created_at
- updated_at

Money must never be stored as floating point.

Use:

`DECIMAL(12,2)`

or integer cents.

---

## inventory

- id UUID PK
- variant_id FK
- location_id FK
- quantity_on_hand INT
- quantity_reserved INT
- created_at
- updated_at

Unique constraint:

`variant_id + location_id`

Available inventory:

quantity_on_hand - quantity_reserved

---

## inventory_movements

- id UUID PK
- variant_id FK
- location_id FK
- movement_type ENUM
- quantity_change INT
- quantity_before INT
- quantity_after INT
- reference_type
- reference_id
- notes
- created_by_user_id
- created_at

---

## customers

- id UUID PK
- first_name
- last_name
- email
- phone
- address_line_1
- address_line_2
- suburb
- state
- postcode
- notes
- created_at
- updated_at

Customer should be optional on an order.

---

## orders

- id UUID PK
- order_number UNIQUE
- location_id FK
- customer_id FK NULL
- salesperson_user_id FK
- status ENUM
- subtotal DECIMAL
- discount_total DECIMAL
- gst_total DECIMAL
- total DECIMAL
- amount_paid DECIMAL
- notes
- completed_at
- created_at
- updated_at

---

## order_items

- id UUID PK
- order_id FK
- variant_id FK
- description_snapshot
- sku_snapshot
- qty INT
- unit_price DECIMAL
- discount DECIMAL
- gst DECIMAL
- line_total DECIMAL
- created_at

Store product descriptions/prices as snapshots.

Do not rely only on the current product record because prices may change in the future.

---

## payments

- id UUID PK
- order_id FK
- method ENUM
- amount DECIMAL
- external_reference NULL
- status ENUM
- processed_at
- created_by_user_id
- created_at

Methods initially:

CASH
EFT

Future:

STRIPE
SHOPIFY
GIFT_CARD
STORE_CREDIT

---

## invoices

- id UUID PK
- invoice_number UNIQUE
- order_id FK
- customer_id FK NULL
- status ENUM
- pdf_url
- emailed_at
- printed_at
- created_at

---

## transfers

- id UUID PK
- transfer_number UNIQUE
- from_location_id FK
- to_location_id FK
- status ENUM
- requested_by_user_id
- approved_by_user_id NULL
- received_by_user_id NULL
- notes
- created_at
- shipped_at
- received_at

---

## transfer_items

- id UUID PK
- transfer_id FK
- variant_id FK
- quantity INT
- created_at

---

## stock_adjustments

- id UUID PK
- location_id FK
- variant_id FK
- quantity_before
- quantity_change
- quantity_after
- reason
- notes
- created_by_user_id
- created_at

---

## audit_logs

- id UUID PK
- user_id FK
- action
- entity_type
- entity_id
- old_values JSONB
- new_values JSONB
- ip_address
- created_at

This becomes very valuable when someone asks:

> Who changed the price?

or:

> Why did this inventory disappear?

---

# 44. Important Database Relationships

Product

→ has many Variants

Variant

→ has inventory at many Locations

Location

→ has many Inventory records

Order

→ has many Order Items

Order

→ has many Payments

Order

→ has one Invoice

Transfer

→ has many Transfer Items

Inventory change

→ always creates Inventory Movement

---

# 45. Recommended Indexes

Create indexes on:

`product_variants.sku`

`product_variants.barcode`

`products.design_number`

`products.name`

`orders.order_number`

`orders.created_at`

`orders.location_id`

`inventory.location_id`

`inventory.variant_id`

`inventory_movements.variant_id`

`inventory_movements.created_at`

`customers.phone`

`customers.email`

For search, Postgres trigram/full-text indexes can later improve performance.

---

# 46. API / Server Actions

Suggested application functions:

### Products

`createProduct()`

`updateProduct()`

`archiveProduct()`

`createVariant()`

`updateVariant()`

`searchProducts()`

`getProduct()`

---

### Inventory

`getInventory()`

`getInventoryByLocation()`

`adjustInventory()`

`getInventoryMovements()`

---

### Sales

`createDraftOrder()`

`addOrderItem()`

`removeOrderItem()`

`updateOrderItem()`

`completeOrder()`

`cancelOrder()`

`refundOrder()`

---

### Payments

`createPayment()`

`getOrderPayments()`

---

### Transfers

`createTransfer()`

`approveTransfer()`

`dispatchTransfer()`

`receiveTransfer()`

`cancelTransfer()`

---

### Locations

`createLocation()`

`updateLocation()`

`archiveLocation()`

---

### Invoices

`generateInvoice()`

`emailInvoice()`

`downloadInvoice()`

---

### Dashboard

`getStoreDashboard()`

`getManagerDashboard()`

`getAdminDashboard()`

---

# 47. Critical Transaction: Complete Sale

Pseudo-flow:

BEGIN TRANSACTION

Get Order

Validate Order

For each Order Item:

Lock inventory record

Check stock availability

Deduct quantity

Create StockMovement

Calculate totals

Create Payment

Set Order COMPLETED

Generate Invoice Number

Create Invoice

COMMIT

This is one of the most important backend functions in Memba.

Use database transactions and row-level locking where appropriate to prevent two stores selling the same available unit.

---

# 48. Critical Transaction: Receive Transfer

BEGIN TRANSACTION

Validate transfer

For each item:

Reduce/confirm transfer inventory from source

Increase destination inventory

Create TRANSFER_IN movement

Set transfer RECEIVED

COMMIT

---

# 49. Security

Every server action/API endpoint must check authentication and authorisation.

Never rely on UI permissions.

For example:

A Store User may not see an **Add Store** button.

But the server must still reject:

`POST /locations`

if they manually attempt to call it.

---

# 50. Role Permission Matrix

| Feature                  |   Staff |  Manager | Admin |
| ------------------------ | ------: | -------: | ----: |
| Create Sale              |       ✓ |        ✓ |     ✓ |
| View Own Store Inventory |       ✓ |        ✓ |     ✓ |
| Search Other Stores      |       ✓ |        ✓ |     ✓ |
| View Store Reports       | Limited |        ✓ |     ✓ |
| Company Reports          |       × |        × |     ✓ |
| Stock Adjustment         |       × |        ✓ |     ✓ |
| Request Transfer         |       ✓ |        ✓ |     ✓ |
| Approve Transfer         |       × |        ✓ |     ✓ |
| Add Product              |       × | Optional |     ✓ |
| Edit Product             |       × |  Limited |     ✓ |
| Add Store                |       × |        × |     ✓ |
| Manage Users             |       × |  Limited |     ✓ |
| Refund Sale              |       × |        ✓ |     ✓ |
| System Settings          |       × |        × |     ✓ |

---

# 51. Invoice Email

Recommended service:

**Resend**

Email:

Subject:

`Your invoice from {{storeName}} – {{invoiceNumber}}`

Attach PDF invoice or include secure invoice link.

Log:

- sent date
- recipient
- delivery status where available

---

# 52. Reporting

MVP reports:

### Sales

Sales by:

- date
- store
- employee
- product
- category

### Payments

- Cash
- EFT
- totals by location

### GST

GST collected by:

- day
- month
- store

### Inventory

- inventory by store
- stock value
- low stock
- stock movement

### Transfers

- pending
- received
- cancelled

Export:

CSV

Future:

PDF / Excel

---

# 53. Store Daily Reconciliation

Very useful addition to basic POS.

Manager sees:

## Today's Reconciliation

Sales:

$8,200

Cash:

$2,450

EFT:

$5,750

GST:

$745.45

Orders:

14

Optional fields:

Opening Cash

Expected Closing Cash

Actual Closing Cash

Variance

This could later become a dedicated cash register feature.

---

# 54. Product Images

Each product should support:

- Primary image
- Additional images later

For MVP:

Store one image URL.

Recommended:

Vercel Blob

or

AWS S3

Do not store binary image data inside Postgres.

---

# 55. Rug-Specific Considerations

Rugs are different from ordinary high-volume retail inventory.

Many variants may only have:

Qty = 1

Therefore Memba should eventually support a unique inventory unit.

Example:

Design 302
Red
200×300

There might be three physically different rugs of the same variant.

Future architecture could introduce:

`inventory_units`

with:

- serial number
- unique barcode
- condition
- acquisition date
- exact location
- rack/bin
- image

This is **not required for MVP**, but the architecture should not prevent it.

---

# 56. Future Barcode Support

Memba should eventually allow:

Scan barcode

→ immediately find rug

→ display product

→ Add to Sale

or

→ Transfer

or

→ Stocktake

Barcode field should therefore exist from day one even if barcode scanning is introduced later.

---

# 57. Future OCR

Potential later workflow:

Take photo of supplier label.

OCR extracts:

- design number
- colour
- dimensions
- SKU
- barcode

Memba suggests matching product/variant.

User confirms.

Stock gets added.

This should be considered Phase 3 rather than MVP.

---

# 58. Future Shopify Integration

Design products and variants to map naturally to:

Shopify Product

↓

Shopify Variant

Store fields later:

`shopify_product_id`

`shopify_variant_id`

`shopify_inventory_item_id`

Potential workflow:

Shopify Online Sale

↓

Webhook

↓

Memba Order

↓

Memba Inventory Updated

This prevents online and physical stores selling the same rug.

---

# 59. Future Stripe Integration

Payments table already supports this.

Stripe flow:

Complete Sale

↓

Stripe Terminal / Checkout

↓

PaymentIntent

↓

Payment succeeds

↓

Create Memba Payment

Store:

`stripe_payment_intent_id`

The POS does not need Stripe for MVP.

---

# 60. Future Purchase Orders

Warehouse may eventually need:

Suppliers

Purchase Orders

Goods Received

Suggested future entities:

Supplier

PurchaseOrder

PurchaseOrderItem

GoodsReceipt

This is intentionally excluded from MVP.

---

# 61. Future Customer CRM

Customer record can later contain:

Purchase history

Preferred rug styles

Average spend

Last purchase

Marketing consent

This may eventually make Memba useful for:

SMS campaigns

Email campaigns

VIP customers

Repeat buyers

---

# 62. MVP Screens

Codex should initially build these screens.

### Authentication

`/login`

### Dashboard

`/dashboard`

### POS

`/sales/new`

### Orders

`/orders`

`/orders/[id]`

### Products

`/products`

`/products/new`

`/products/[id]`

### Inventory

`/inventory`

### Transfers

`/transfers`

`/transfers/new`

`/transfers/[id]`

### Customers

`/customers`

`/customers/[id]`

### Locations

`/settings/locations`

### Users

`/settings/users`

### Settings

`/settings`

---

# 63. POS Layout

Recommended desktop design:

---

Memba / New Sale

Store: Richmond 31 Aug 2026

[ Search product / scan barcode ]

---

ITEMS

Persian 302 / Red / 200×300

Qty [- 1 +] $1,200

Runner 204 / Blue / 80×300

Qty [- 2 +] $300

[ + Add Item ]

---

Subtotal $1,800

GST Included $163.64

TOTAL $1,800

---

Payment

[ CASH ] [ EFT ]

Amount $1,800

---

[ Save Draft ] [ COMPLETE SALE ]

---

The interface should avoid unnecessary modal windows.

---

# 64. Inventory Page Layout

Top:

# Inventory

Search

Location dropdown

Category dropdown

Status

Button:

**+ Add Product**

Table/cards:

Image

Product

SKU

Variant

Location

Available

Reserved

Price

Actions

Actions:

View

Transfer

Adjust

---

# 65. Empty States

Empty states should help users.

Instead of:

`No Data`

Use:

**No products found**

Try changing your filters or add a new product.

[ Add Product ]

---

# 66. Success Feedback

Every significant action needs immediate confirmation.

Examples:

✓ Sale completed

✓ Invoice emailed

✓ Transfer created

✓ Stock updated

✓ Product added

Use toast notifications for minor actions.

Use dedicated confirmation screens for important actions like completing sales.

---

# 67. Error Handling

Errors must be written in human language.

Bad:

`Foreign key constraint error`

Good:

**This product cannot be deleted because it has previous sales. Archive it instead.**

Bad:

`Inventory negative`

Good:

**Only 1 rug is available at Richmond. You are trying to sell 2.**

---

# 68. Audit Requirements

Important changes should record:

- user
- action
- before
- after
- timestamp

Audit:

- prices
- inventory
- orders
- refunds
- transfers
- user permissions
- store settings

---

# 69. Soft Delete

Never permanently delete transaction-related data.

Use:

- active
- archived_at
- deleted_at

Products with historical sales should be archived.

Stores with historical transactions should be archived.

Users should be deactivated.

Orders should be cancelled/voided rather than deleted.

---

# 70. Financial Rules

All monetary calculations must happen server-side.

Never trust totals submitted by the browser.

The frontend may display:

Qty × Price

But the backend must independently calculate:

Subtotal

Discount

GST

Total

before saving the order.

---

# 71. GST

Default:

Australia GST = 10%

Create system setting:

`gst_rate = 0.10`

Do not hardcode GST throughout the application.

Individual variants should also have:

`gst_applicable`

Default:

true

This allows future GST-exempt products if required.

---

# 72. Order Snapshots

Critical principle:

Historical orders must never change because a product was subsequently edited.

OrderItem therefore stores:

- SKU snapshot
- description snapshot
- price snapshot
- GST snapshot

Example:

A rug sells today for:

$1,200

Next month retail price changes to:

$1,400

The historical invoice must still show:

$1,200.

---

# 73. Seed Data

Development environment should automatically seed:

### Locations

Store 1
Store 2
Store 3
Store 4
Main Warehouse

### Users

Admin

Manager

Store User

### Products

At least 15 sample rugs with multiple variants.

### Transactions

Sample:

orders

payments

transfers

inventory movements

This gives Codex enough data to build realistic dashboards.

---

# 74. Folder Structure

Suggested Next.js structure:

app/

`(auth)/login`

`(dashboard)/dashboard`

`(dashboard)/sales/new`

`(dashboard)/orders`

`(dashboard)/products`

`(dashboard)/inventory`

`(dashboard)/transfers`

`(dashboard)/customers`

`(dashboard)/reports`

`(dashboard)/settings`

components/

`ui/`

`products/`

`inventory/`

`sales/`

`transfers/`

`dashboard/`

lib/

`auth/`

`db/`

`permissions/`

`inventory/`

`sales/`

`payments/`

`invoice/`

`tax/`

prisma/

`schema.prisma`

`seed.ts`

types/

---

# 75. Application Services

Keep business logic outside components.

Example:

`lib/inventory/inventory-service.ts`

Responsibilities:

adjust inventory

transfer inventory

reserve inventory

release inventory

validate availability

Likewise:

`sales-service.ts`

`invoice-service.ts`

`payment-service.ts`

`transfer-service.ts`

This makes later integrations considerably easier.

---

# 76. Data Validation

Use:

**Zod**

Validate all:

- Server Actions
- APIs
- forms
- database input

Shared schemas:

`productSchema`

`variantSchema`

`orderSchema`

`paymentSchema`

`transferSchema`

`locationSchema`

---

# 77. Forms

Recommended:

React Hook Form

-

Zod

But do not build huge forms.

Use progressive sections where necessary.

---

# 78. Performance

Initial dataset is unlikely to be large, but search should still feel instant.

Targets:

Dashboard:

< 2 seconds

Inventory search:

< 500 ms perceived response

POS actions:

Immediate UI response

Use:

- server-side pagination
- database indexes
- query filtering
- optimistic UI selectively

Avoid loading every product into the browser.

---

# 79. Pagination

Inventory:

50 records/page

Orders:

50 records/page

Customers:

50 records/page

Use server-side pagination.

---

# 80. Accessibility

Minimum expectations:

- keyboard navigation
- visible focus states
- large POS buttons
- high colour contrast
- buttons have labels
- forms have labels
- no essential information represented using colour alone

---

# 81. Responsive Behaviour

Priority:

1. Desktop
2. Tablet
3. Mobile

POS should be particularly good on an iPad.

Minimum supported width:

Approximately 375px.

---

# 82. MVP Scope

The first production version should include only:

### Authentication

✓ Login
✓ Roles

### Locations

✓ Add Store
✓ Edit Store
✓ Warehouse

### Products

✓ Add Product
✓ Edit Product
✓ Variants
✓ Images
✓ Archive Product

### Inventory

✓ Inventory per location
✓ Search
✓ Adjust stock
✓ Inventory movements

### POS

✓ New Sale
✓ Multiple items
✓ Quantity
✓ Unit price
✓ Cash
✓ EFT
✓ GST
✓ Complete sale

### Customers

✓ Optional customer details

### Invoice

✓ Generate
✓ Print
✓ PDF
✓ Email

### Transfers

✓ Store ↔ Store
✓ Warehouse ↔ Store
✓ Receive transfer

### Dashboard

✓ Staff
✓ Manager
✓ Admin

### Reports

✓ Basic sales
✓ Payments
✓ GST
✓ Inventory

---

# 83. Explicitly NOT MVP

Do not initially build:

- Shopify
- Stripe
- OCR
- supplier management
- purchase orders
- loyalty
- marketing automation
- advanced CRM
- accounting integrations
- Xero
- MYOB
- complex promotions
- offline sync
- multi-company
- AI functionality

Keep the first version focused.

---

# 84. Suggested Development Phases

## Phase 1 — Foundation

Build:

Authentication

Roles

Locations

Database

Navigation

UI system

---

## Phase 2 — Product & Inventory

Build:

Products

Variants

Inventory

Search

Stock adjustments

Movement ledger

---

## Phase 3 — POS

Build:

New Sale

Cart

GST

Cash/EFT

Complete Sale

Inventory deduction

---

## Phase 4 — Invoice

Build:

Invoice generation

Print

PDF

Email

---

## Phase 5 — Transfers

Build:

Transfer stock

Dispatch

Receive

Movement records

---

## Phase 6 — Dashboard

Build:

Staff dashboard

Manager dashboard

Admin dashboard

Reports

---

## Phase 7 — Polish

Improve:

mobile

tablet

loading states

errors

empty states

permissions

audit logs

performance

---

# 85. Key Acceptance Tests

### Sale

Given Richmond has:

3 × SKU ABC

When salesperson sells:

2 × SKU ABC

Then:

Inventory should become:

1

Order should be COMPLETED.

Stock movement should record:

-2.

Payment should equal order total.

Invoice should be generated.

---

### Insufficient Inventory

Available:

1

User attempts:

Qty 2

Memba should block sale.

---

### Transfer

Warehouse:

10

Transfer 3 → Store A

After dispatch:

Warehouse available = 7

Transfer = 3

After receipt:

Store A inventory increases by 3.

---

### GST

GST-inclusive total:

$1,100

GST displayed:

$100

---

### Multiple Items

Order containing:

Product A ×1

Product B ×2

Product C ×1

should create:

1 order

3 order item records

corresponding stock movements for every product.

---

### Permission

Store User attempts to create location.

System returns:

403 Forbidden

even if API is directly accessed.

---

# 86. Definition of Done

The MVP is ready when a store employee can:

1. Log in.
2. Search for a rug.
3. See which location has it.
4. Add it to a sale.
5. Add several other rugs.
6. Enter quantities.
7. Take Cash or EFT.
8. Complete transaction.
9. Automatically reduce stock.
10. Print/email an invoice.

And a manager can:

1. See store sales.
2. Check Cash/EFT totals.
3. Transfer rugs between locations.
4. Adjust inventory.
5. Review stock movements.

And an administrator can:

1. See the entire business.
2. Add stores.
3. Add products.
4. Manage inventory.
5. Manage users.
6. Review reports.

---

# 87. Recommended V1 Architecture

Use this as the default technical decision:

**Frontend**

Next.js + TypeScript + Tailwind + shadcn/ui

**Authentication**

Firebase Auth

**Database**

PostgreSQL

**ORM**

Prisma

**Validation**

Zod

**Hosting**

Vercel

**Product Images**

Vercel Blob

**Invoices**

React PDF

**Email**

Resend

**Monitoring**

Sentry

Architecture:

User

↓

Next.js

↓

Firebase Authentication

↓

Server Actions/API

↓

Permission Layer

↓

Service Layer

↓

Prisma

↓

PostgreSQL

---

# 88. Most Important Engineering Principle

Inventory should never be modified directly from UI code.

Never:

`inventory.quantity = inventory.quantity - 1`

inside a React component or generic CRUD endpoint.

Instead every inventory change should go through:

`InventoryService`

For example:

`sellInventory()`

`transferInventory()`

`receiveInventory()`

`adjustInventory()`

`refundInventory()`

This creates one controlled inventory system and dramatically reduces stock inconsistencies.

---

# 89. Recommended MVP Home Screen

The dashboard should immediately answer:

### How are we doing?

Sales today

### What needs attention?

Transfers / stock

### What do I want to do?

Large buttons:

**+ New Sale**

**Find a Rug**

**Transfer Stock**

For store users, **New Sale** should be the strongest visual element on the entire interface.

---

# 90. Memba Product Principle

Every feature should pass this test:

> Can a new retail employee understand what to do without reading a manual?

If not, simplify it.

Memba should feel like a modern consumer application that happens to manage retail inventory, rather than an ERP system that employees are forced to learn.

---

# 91. Codex Build Instruction

Use the following project instruction when starting development:

## PROJECT

Build **Memba**, a modern multi-location inventory management and basic POS system for a rug retailer operating four stores and one warehouse.

The application must prioritise exceptional usability, fast workflows and a clean modern interface.

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Firebase Authentication
- Zod
- Vercel

Build the application using modular domain services rather than embedding business logic inside UI components.

The primary domains are:

- authentication
- locations
- products
- product variants
- inventory
- inventory movements
- sales
- order items
- payments
- customers
- invoices
- stock transfers
- stock adjustments
- users
- reporting

All inventory mutations must pass through a dedicated inventory service.

All sale completion logic must execute inside a database transaction.

Never allow inventory to become negative.

Use Decimal or integer cents for monetary values.

GST defaults to 10%.

Australian retail prices are GST inclusive.

GST component of an inclusive price is calculated as:

`total / 11`

Implement role-based permissions:

STORE_USER

STORE_MANAGER

ADMIN

Create a responsive application optimised primarily for desktop and tablet use.

The UI should take inspiration from the simplicity and visual hierarchy of modern products such as Stripe, Shopify, Square and Linear.

Do not create a traditional ERP-looking interface.

Use:

- large obvious primary actions
- strong search
- spacious layouts
- simple tables
- clear status badges
- human-readable errors
- useful empty states
- minimal modal usage
- accessible forms

The most prominent action available to retail users should be:

**+ New Sale**

The first development milestone should create the database schema, authentication framework, application shell, role permissions and seeded development data before implementing business features.

Do not implement Shopify, Stripe, OCR, supplier purchasing, loyalty or accounting integrations in V1.

Design the architecture so these can be introduced later without changing the fundamental product, variant, inventory, order and payment models.

Before building each major feature, review the Memba PRD and preserve the underlying business rules rather than merely reproducing the visual interface.

# END OF PRD
