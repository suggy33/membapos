export type Role = "SUPER_ADMIN" | "ADMIN" | "STORE_MANAGER" | "STORE_USER"

export type OrganizationStatus = "ACTIVE" | "TRIAL" | "INACTIVE"

export type LocationType = "STORE" | "WAREHOUSE"

export interface Organization {
  id: string
  name: string
  code: string
  status: OrganizationStatus
  locationIds: string[]
  memberIds: string[]
  salesTodayCents: number
  orderCountToday: number
  inventoryCount: number
  maxLocations: number
}

export interface Location {
  id: string
  organizationId: string
  name: string
  code: string
  type: LocationType
  suburb: string
  state: string
  active: boolean
}

export interface User {
  id: string
  name: string
  email: string
  initials: string
  active: boolean
}

export interface Membership {
  id: string
  userId: string
  organizationId: string | null
  role: Role
  locationIds: string[]
  approvalCode?: string
}

export interface ActivityItem {
  id: string
  organizationId: string
  title: string
  description: string
  timestamp: string
  kind: "SALE" | "TRANSFER" | "INVENTORY" | "ORGANIZATION"
}

export interface AuditLog {
  id: string
  actorUserId: string
  effectiveUserId: string
  organizationId: string | null
  action: "ORGANIZATION_CREATED" | "IMPERSONATION_STARTED" | "IMPERSONATION_ENDED"
  description: string
  timestamp: string
}

export interface MembaData {
  schemaVersion: 1
  organizations: Organization[]
  locations: Location[]
  users: User[]
  memberships: Membership[]
  activity: ActivityItem[]
  auditLogs: AuditLog[]
  products: Product[]
  variants: ProductVariant[]
  inventory: InventoryRecord[]
  inventoryMovements: InventoryMovement[]
  orders: Order[]
  transfers: Transfer[]
  dailyRegisters: DailyRegister[]
  customers: Customer[]
}

export type DayStatus = "OPEN" | "CLOSED"
export interface DailyRegister { id: string; organizationId: string; locationId: string; businessDate: string; status: DayStatus; openedByUserId: string; openedAt: string; closedByUserId?: string; closedAt?: string; expectedCashCents?: number; countedCashCents?: number; varianceCents?: number; notes?: string }

export interface DevelopmentSession {
  userId: string
  organizationId: string | null
  membershipId: string
  impersonationActorUserId?: string
  impersonationReason?: string
}

export interface CreateOrganizationInput {
  name: string
  code: string
  adminName: string
  adminEmail: string
  locationName: string
  locationCode: string
  locationType: LocationType
  suburb: string
  state: string
  maxLocations: number
}

export interface CreateLocationInput {
  organizationId: string
  name: string
  code: string
  type: LocationType
  suburb: string
  state: string
}

export interface CreateMemberInput {
  organizationId: string
  name: string
  email: string
  role: Exclude<Role, "SUPER_ADMIN">
  locationIds: string[]
}

export interface Product {
  id: string
  organizationId: string
  name: string
  designNumber: string
  category: string
  collection: string
  material: string
  active: boolean
  variantIds: string[]
}

export interface ProductVariant {
  id: string
  organizationId: string
  productId: string
  sku: string
  barcode: string
  articleNumber?: string
  supplier?: string
  description?: string
  features?: string[]
  origin?: string
  heightCm?: number
  weightKg?: number
  design?: string
  tags?: string[]
  usedIn?: string[]
  unitOfMeasure?: string
  reorderLevel?: number
  washable?: boolean
  colour: string
  widthCm: number
  lengthCm: number
  retailPriceCents: number
  costPriceCents: number
  gstApplicable: boolean
  active: boolean
}

export interface InventoryRecord {
  id: string
  organizationId: string
  variantId: string
  locationId: string
  quantityOnHand: number
  quantityReserved: number
}

export type MovementType = "INITIAL_STOCK" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "SALE" | "TRANSFER_IN" | "TRANSFER_OUT"

export interface InventoryMovement {
  id: string
  organizationId: string
  variantId: string
  locationId: string
  type: MovementType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  reason: string
  notes: string
  createdByUserId: string
  createdAt: string
}

export interface CreateProductInput {
  organizationId: string
  name: string
  designNumber: string
  category: string
  collection: string
  material: string
  barcode: string
  articleNumber?: string
  colour: string
  widthCm: number
  lengthCm: number
  retailPriceCents: number
  costPriceCents: number
  gstApplicable: boolean
  initialStock: number
  initialLocationId: string
}
export interface UpdateProductInput { productId: string; name: string; designNumber: string; category: string; collection: string; material: string }
export interface CreateVariantInput { organizationId: string; productId: string; sku: string; supplier: string; articleNumber: string; barcode: string; colour: string; description: string; origin: string; material: string; design: string; category: string; features: string[]; tags: string[]; usedIn: string[]; widthCm: number; lengthCm: number; heightCm: number; weightKg: number; retailPriceCents: number; costPriceCents: number; gstApplicable: boolean; reorderLevel: number; initialStock: number; initialLocationId: string }

export interface AdjustInventoryInput {
  organizationId: string
  variantId: string
  locationId: string
  quantityChange: number
  reason: string
  notes: string
}

export type OrderStatus = "DRAFT" | "QUOTE" | "PARTIALLY_PAID" | "PAID_UNFULFILLED" | "COMPLETED" | "VOID" | "CANCELLED" | "REFUNDED"
export type PaymentMethod = "CASH" | "EFT"
export type FulfillmentType = "CASH_AND_CARRY" | "PICKUP" | "DELIVERY"
export interface OrderItem { id: string; variantId: string; skuSnapshot: string; descriptionSnapshot: string; qty: number; unitPriceCents: number; discountCents: number; lineTotalCents: number; fulfillmentType: FulfillmentType }
export interface CustomerAddress { unitStreetAddress: string; addressLine2: string; suburb: string; postCode: string; state: string; country: string }
export type CommunicationPreference = "EMAIL" | "SMS" | "PHONE"
export interface Customer { id: string; organizationId: string; firstName: string; lastName: string; email: string; phone: string; address: CustomerAddress; communicationPreferences: CommunicationPreference[]; marketingOptIn: boolean; createdAt: string }
export interface Order { id: string; organizationId: string; orderNumber: string; locationId: string; salespersonUserId: string; customerId?: string; approvalUserId?: string; status: OrderStatus; items: OrderItem[]; subtotalCents: number; discountTotalCents: number; gstTotalCents: number; totalCents: number; amountPaidCents: number; paymentMethod?: PaymentMethod; createdAt: string; completedAt?: string }
export interface CompleteSaleInput { organizationId: string; locationId: string; orderNumber?: string; customerId?: string; items: Array<{ variantId: string; qty: number; discountCents: number; fulfillmentType: FulfillmentType }>; paymentMethod: PaymentMethod; amountPaidCents: number; approvalCode?: string }
export interface CreateCustomerInput { organizationId: string; firstName: string; lastName: string; email: string; phone: string; address: CustomerAddress; communicationPreferences: CommunicationPreference[]; marketingOptIn: boolean }
export interface UpdateCustomerInput { customerId: string; firstName: string; lastName: string; email: string; phone: string; address: CustomerAddress; communicationPreferences: CommunicationPreference[]; marketingOptIn: boolean }

export type TransferStatus = "REQUESTED" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED"
export interface TransferItem { id: string; variantId: string; quantity: number }
export interface Transfer { id: string; organizationId: string; transferNumber: string; fromLocationId: string; toLocationId: string; status: TransferStatus; items: TransferItem[]; requestedByUserId: string; approvedByUserId?: string; receivedByUserId?: string; notes: string; createdAt: string; approvedAt?: string; shippedAt?: string; receivedAt?: string }
export interface CreateTransferInput { organizationId: string; fromLocationId: string; toLocationId: string; items: Array<{ variantId: string; quantity: number }>; notes: string }
