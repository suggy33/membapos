"use client"

import { useAuth } from "@clerk/nextjs"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { loadDevelopmentSession, loadLocalData, resetLocalDevelopmentData, saveDevelopmentSession, saveLocalData } from "@/lib/memba/local-store"
import { defaultDevelopmentSession, seedData } from "@/lib/memba/seed"
import { adjustInventorySchema, buildRugSku, createProductSchema, createVariantSchema } from "@/lib/memba/catalogue-schemas"
import { completeSaleSchema } from "@/lib/memba/sales-schemas"
import { createTransferSchema } from "@/lib/memba/transfer-schemas"
import type { AdjustInventoryInput, CompleteSaleInput, CreateCustomerInput, CreateLocationInput, CreateMemberInput, CreateOrganizationInput, CreateProductInput, CreateTransferInput, CreateVariantInput, DevelopmentSession, MembaData, Membership, OrderStatus, Organization, OrganizationStatus, Role, UpdateCustomerInput, UpdateProductInput, User } from "@/lib/memba/types"

interface MembaContextValue {
  data: MembaData
  session: DevelopmentSession
  membership: Membership
  user: User
  organization: Organization | null
  hydrated: boolean
  switchMembership: (membershipId: string) => void
  switchOrganization: (organizationId: string) => void
  createOrganization: (input: CreateOrganizationInput) => { organizationId: string }
  setOrganizationLocationLimit: (organizationId: string, maxLocations: number) => void
  setApprovalCode: (approvalCode: string) => void
  createLocation: (input: CreateLocationInput) => void
  createCustomer: (input: CreateCustomerInput) => { customerId: string }
  updateCustomer: (input: UpdateCustomerInput) => void
  setLocationActive: (locationId: string, active: boolean) => void
  createMember: (input: CreateMemberInput) => void
  updateMember: (membershipId: string, role: Exclude<Role, "SUPER_ADMIN">, locationIds: string[]) => void
  setUserActive: (userId: string, active: boolean) => void
  createProduct: (input: CreateProductInput) => { productId: string }
  updateProduct: (input: UpdateProductInput) => void
  deleteProduct: (productId: string) => void
  createVariant: (input: CreateVariantInput) => { variantId: string }
  setProductActive: (productId: string, active: boolean) => void
  adjustInventory: (input: AdjustInventoryInput) => void
  completeSale: (input: CompleteSaleInput) => { orderId: string; orderNumber: string }
  setOrderStatus: (orderId: string, status: OrderStatus) => void
  createTransfer: (input: CreateTransferInput) => { transferId: string }
  approveTransfer: (transferId: string) => void
  dispatchTransfer: (transferId: string) => void
  receiveTransfer: (transferId: string) => void
  cancelTransfer: (transferId: string) => void
  openDay: (organizationId: string, locationId: string) => void
  endDay: (registerId: string, countedCashCents: number, notes?: string) => void
  startImpersonation: (membershipId: string, reason: string) => void
  endImpersonation: () => void
  resetDemo: () => void
}

const MembaContext = createContext<MembaContextValue | null>(null)

type ProductionOrganisation = {
  id: string
  name: string
  code: string
  status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "ARCHIVED"
  max_locations: number
}

type ProductionLocation = {
  id: string
  organisation_id: string
  name: string
  code: string
  type: "STORE" | "WAREHOUSE"
  address: { suburb?: string; state?: string }
  active: boolean
}

type ProductionEmployee = {
  id: string
  clerk_user_id: string
  email: string
  display_name: string
  status: "INVITED" | "ACTIVE" | "INACTIVE"
}

type ProductionMembership = {
  id: string
  organisation_id: string | null
  employee_id: string
  role: Role
  location_ids: string[]
  active: boolean
  employees: ProductionEmployee | ProductionEmployee[] | null
}

type ProductionBootstrap = {
  organisations: ProductionOrganisation[]
  locations: ProductionLocation[]
  memberships: ProductionMembership[]
}

function isHostedProduction() {
  if (typeof window === "undefined") return false
  return !["localhost", "127.0.0.1"].includes(window.location.hostname)
}

function productionData(data: ProductionBootstrap, currentClerkUserId: string): { data: MembaData; membershipId: string; userId: string } | null {
  const employeeMap = new Map<string, ProductionEmployee>()
  for (const membership of data.memberships) {
    const employee = Array.isArray(membership.employees) ? membership.employees[0] : membership.employees
    if (employee) employeeMap.set(employee.id, employee)
  }

  const currentMembership = data.memberships.find((membership) => {
    const employee = Array.isArray(membership.employees) ? membership.employees[0] : membership.employees
    return membership.active && employee?.status === "ACTIVE" && employee.clerk_user_id === currentClerkUserId
  })
  if (!currentMembership) return null

  const locations = data.locations.map((location) => ({
    id: location.id,
    organizationId: location.organisation_id,
    name: location.name,
    code: location.code,
    type: location.type,
    suburb: location.address?.suburb ?? "",
    state: location.address?.state ?? "",
    active: location.active,
  }))

  const memberships = data.memberships.map((membership) => ({
    id: membership.id,
    userId: membership.employee_id,
    organizationId: membership.organisation_id,
    role: membership.role,
    locationIds: membership.location_ids,
  }))

  const organizations = data.organisations.map((organisation) => {
    const status: OrganizationStatus = organisation.status === "TRIAL" ? "TRIAL" : organisation.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"
    return {
      id: organisation.id,
      name: organisation.name,
      code: organisation.code,
      status,
      locationIds: locations.filter((location) => location.organizationId === organisation.id).map((location) => location.id),
      memberIds: memberships.filter((membership) => membership.organizationId === organisation.id).map((membership) => membership.userId),
      salesTodayCents: 0,
      orderCountToday: 0,
      inventoryCount: 0,
      maxLocations: organisation.max_locations,
    }
  })

  const users = [...employeeMap.values()].map((employee) => ({
    id: employee.id,
    name: employee.display_name || employee.email,
    email: employee.email,
    initials: employee.display_name.split(/\\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    active: employee.status === "ACTIVE",
  }))

  return {
    data: {
      schemaVersion: 1,
      organizations,
      locations,
      users,
      memberships,
      activity: [],
      auditLogs: [],
      products: [],
      variants: [],
      inventory: [],
      inventoryMovements: [],
      orders: [],
      transfers: [],
      dailyRegisters: [],
      customers: [],
    },
    membershipId: currentMembership.id,
    userId: currentMembership.employee_id,
  }
}

function nextOrganizationOrderNumber(data: MembaData, organizationId: string) {
  const organization = data.organizations.find((item) => item.id === organizationId)
  const code = organization?.code ?? "MEM"
  const year = String(new Date().getFullYear()).slice(-2)
  const prefix = `${code}-${year}-`
  const highest = data.orders.filter((item) => item.organizationId === organizationId && item.orderNumber.startsWith(prefix)).reduce((max, item) => Math.max(max, Number(item.orderNumber.slice(prefix.length)) || 0), 0)
  return `${prefix}${String(highest + 1).padStart(6, "0")}`
}

export function MembaProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, userId: clerkUserId } = useAuth()
  const [data, setData] = useState<MembaData>(seedData)
  const [session, setSession] = useState<DevelopmentSession>(defaultDevelopmentSession)
  const [hydrated, setHydrated] = useState(false)
  const [productionUnavailable, setProductionUnavailable] = useState(false)

  useEffect(() => {
    if (!clerkLoaded) return

    let cancelled = false
    const hydrate = async () => {
      if (isHostedProduction() && isSignedIn) {
        try {
          const response = await fetch("/api/organisations", { cache: "no-store" })
          if (response.ok) {
            const bootstrap = clerkUserId ? productionData((await response.json()) as ProductionBootstrap, clerkUserId) : null
            if (!cancelled && bootstrap) {
              setProductionUnavailable(false)
              setData(bootstrap.data)
              setSession({ userId: bootstrap.userId, membershipId: bootstrap.membershipId, organizationId: null })
              setHydrated(true)
              return
            }
          }
        } catch {
          // The hosted app must not fall back to demo data.
        }

        if (!cancelled) {
          setProductionUnavailable(true)
          setHydrated(true)
          return
        }
      }

      if (!cancelled) {
        setData(loadLocalData())
        setSession(loadDevelopmentSession())
        setHydrated(true)
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [clerkLoaded, clerkUserId, isSignedIn])

  useEffect(() => {
    if (hydrated && !isHostedProduction()) saveLocalData(data)
  }, [data, hydrated])

  useEffect(() => {
    if (hydrated && !isHostedProduction()) saveDevelopmentSession(session)
  }, [session, hydrated])

  const membership = data.memberships.find((item) => item.id === session.membershipId) ?? data.memberships[0]
  const user = data.users.find((item) => item.id === membership.userId) ?? data.users[0]
  const organizationId = membership.role === "SUPER_ADMIN" ? session.organizationId : membership.organizationId
  const organization = data.organizations.find((item) => item.id === organizationId) ?? null

  const canManageOrganization = useCallback((targetOrganizationId: string) => {
    return !session.impersonationActorUserId && (membership.role === "SUPER_ADMIN" || (membership.role === "ADMIN" && membership.organizationId === targetOrganizationId))
  }, [membership.organizationId, membership.role, session.impersonationActorUserId])

  const value = useMemo<MembaContextValue>(() => ({
    data,
    session,
    membership,
    user,
    organization,
    hydrated,
    switchMembership: (membershipId) => {
      const next = data.memberships.find((item) => item.id === membershipId)
      if (!next) return
      setSession({ userId: next.userId, membershipId: next.id, organizationId: next.organizationId })
    },
    switchOrganization: (nextOrganizationId) => {
      if (membership.role !== "SUPER_ADMIN") return
      setSession((current) => ({ ...current, organizationId: nextOrganizationId === "platform" ? null : nextOrganizationId }))
    },
    createOrganization: (input) => {
      if (membership.role !== "SUPER_ADMIN" || session.impersonationActorUserId) throw new Error("Only an active super admin can create an organization.")
      const organizationId = crypto.randomUUID()
      const locationId = crypto.randomUUID()
      const adminUserId = crypto.randomUUID()
      const adminMembershipId = crypto.randomUUID()
      const organizationCode = input.code.trim().toUpperCase()
      const locationCode = input.locationCode.trim().toUpperCase()

      if (data.organizations.some((item) => item.code === organizationCode)) throw new Error("That organization code is already in use.")
      if (data.users.some((item) => item.email.toLowerCase() === input.adminEmail.trim().toLowerCase())) throw new Error("That administrator email already belongs to a user.")

      setData((current) => ({
        ...current,
        organizations: [...current.organizations, { id: organizationId, name: input.name.trim(), code: organizationCode, status: "TRIAL", locationIds: [locationId], memberIds: [adminUserId], salesTodayCents: 0, orderCountToday: 0, inventoryCount: 0, maxLocations: Math.max(1, Math.floor(input.maxLocations || 1)) }],
        locations: [...current.locations, { id: locationId, organizationId, name: input.locationName.trim(), code: locationCode, type: input.locationType, suburb: input.suburb.trim(), state: input.state, active: true }],
        users: [...current.users, { id: adminUserId, name: input.adminName.trim(), email: input.adminEmail.trim().toLowerCase(), initials: input.adminName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), active: true }],
        memberships: [...current.memberships, { id: adminMembershipId, userId: adminUserId, organizationId, role: "ADMIN", locationIds: [locationId] }],
        activity: [{ id: crypto.randomUUID(), organizationId, title: `${input.name.trim()} started trial`, description: `Organization created by ${user.name}`, timestamp: "Just now", kind: "ORGANIZATION" }, ...current.activity],
        auditLogs: [{ id: crypto.randomUUID(), actorUserId: user.id, effectiveUserId: user.id, organizationId, action: "ORGANIZATION_CREATED", description: `Created ${input.name.trim()} and assigned ${input.adminName.trim()} as administrator`, timestamp: new Date().toISOString() }, ...current.auditLogs],
      }))
      return { organizationId }
    },
    setOrganizationLocationLimit: (organizationId, maxLocations) => {
      if (membership.role !== "SUPER_ADMIN" || session.impersonationActorUserId) throw new Error("Only an active super admin can change location limits.")
      const limit = Math.floor(maxLocations)
      const activeCount = data.locations.filter((item) => item.organizationId === organizationId && item.active).length
      if (!Number.isFinite(limit) || limit < 1 || limit < activeCount) throw new Error(`Location limit must be at least ${activeCount}.`)
      if (!data.organizations.some((item) => item.id === organizationId)) throw new Error("Organization not found.")
      setData((current) => ({ ...current, organizations: current.organizations.map((item) => item.id === organizationId ? { ...item, maxLocations: limit } : item) }))
    },
    setApprovalCode: (approvalCode) => {
      if (session.impersonationActorUserId || !["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"].includes(membership.role)) throw new Error("Only managers and above can set a discount approval code.")
      const code = approvalCode.trim()
      if (code && !/^\d{4,12}$/.test(code)) throw new Error("Use a 4–12 digit approval code, or leave it blank to clear it.")
      setData((current) => ({ ...current, memberships: current.memberships.map((item) => item.id === membership.id ? { ...item, approvalCode: code || undefined } : item) }))
    },
    createLocation: (input) => {
      if (!canManageOrganization(input.organizationId)) throw new Error("You do not have permission to add locations for this organization.")
      const targetOrganization = data.organizations.find((item) => item.id === input.organizationId)
      const activeLocationCount = data.locations.filter((item) => item.organizationId === input.organizationId && item.active).length
      if (targetOrganization && activeLocationCount >= targetOrganization.maxLocations) throw new Error(`This organization has reached its ${targetOrganization.maxLocations}-location limit.`)
      const code = input.code.trim().toUpperCase()
      if (data.locations.some((item) => item.organizationId === input.organizationId && item.code === code)) throw new Error("That location code is already in use for this organization.")
      const id = crypto.randomUUID()
      setData((current) => ({ ...current, locations: [...current.locations, { id, organizationId: input.organizationId, name: input.name.trim(), code, type: input.type, suburb: input.suburb.trim(), state: input.state, active: true }], organizations: current.organizations.map((item) => item.id === input.organizationId ? { ...item, locationIds: [...item.locationIds, id] } : item) }))
    },
    createCustomer: (input) => {
      if (!canManageOrganization(input.organizationId) && membership.organizationId !== input.organizationId) throw new Error("You do not have access to add customers for this organization.")
      if (!input.firstName.trim() || !input.lastName.trim()) throw new Error("Enter the customer’s first and last name.")
      const customerId = crypto.randomUUID()
      setData((current) => ({ ...current, customers: [{ id: customerId, organizationId: input.organizationId, firstName: input.firstName.trim(), lastName: input.lastName.trim(), email: input.email.trim().toLowerCase(), phone: input.phone.trim(), address: { unitStreetAddress: input.address.unitStreetAddress.trim(), addressLine2: input.address.addressLine2.trim(), suburb: input.address.suburb.trim(), postCode: input.address.postCode.trim(), state: input.address.state.trim(), country: input.address.country.trim() }, communicationPreferences: input.communicationPreferences, marketingOptIn: input.marketingOptIn, createdAt: new Date().toISOString() }, ...current.customers] }))
      return { customerId }
    },
    updateCustomer: (input) => {
      const existing = data.customers.find((item) => item.id === input.customerId)
      if (!existing || (membership.role !== "SUPER_ADMIN" && existing.organizationId !== membership.organizationId)) throw new Error("You do not have access to edit this customer.")
      if (!input.firstName.trim() || !input.lastName.trim()) throw new Error("Enter the customer’s first and last name.")
      setData((current) => ({ ...current, customers: current.customers.map((item) => item.id === input.customerId ? { ...item, firstName: input.firstName.trim(), lastName: input.lastName.trim(), email: input.email.trim().toLowerCase(), phone: input.phone.trim(), address: { unitStreetAddress: input.address.unitStreetAddress.trim(), addressLine2: input.address.addressLine2.trim(), suburb: input.address.suburb.trim(), postCode: input.address.postCode.trim(), state: input.address.state.trim(), country: input.address.country.trim() }, communicationPreferences: input.communicationPreferences, marketingOptIn: input.marketingOptIn } : item) }))
    },
    setLocationActive: (locationId, active) => {
      const target = data.locations.find((item) => item.id === locationId)
      if (!target || !canManageOrganization(target.organizationId)) throw new Error("You do not have permission to update this location.")
      setData((current) => ({ ...current, locations: current.locations.map((item) => item.id === locationId ? { ...item, active } : item) }))
    },
    createMember: (input) => {
      if (!canManageOrganization(input.organizationId)) throw new Error("You do not have permission to invite users to this organization.")
      if (!input.locationIds.length) throw new Error("Assign at least one location.")
      const email = input.email.trim().toLowerCase()
      const existingUser = data.users.find((item) => item.email.toLowerCase() === email)
      if (existingUser && data.memberships.some((item) => item.userId === existingUser.id && item.organizationId === input.organizationId)) throw new Error("This user already belongs to the organization.")
      const userId = existingUser?.id ?? crypto.randomUUID()
      const membershipId = crypto.randomUUID()
      setData((current) => ({ ...current, users: existingUser ? current.users : [...current.users, { id: userId, name: input.name.trim(), email, initials: input.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), active: true }], memberships: [...current.memberships, { id: membershipId, userId, organizationId: input.organizationId, role: input.role, locationIds: input.locationIds }], organizations: current.organizations.map((item) => item.id === input.organizationId ? { ...item, memberIds: [...new Set([...item.memberIds, userId])] } : item) }))
    },
    updateMember: (membershipId, role, locationIds) => {
      const target = data.memberships.find((item) => item.id === membershipId)
      if (!target?.organizationId || !canManageOrganization(target.organizationId)) throw new Error("You do not have permission to update this membership.")
      if (!locationIds.length) throw new Error("Assign at least one location.")
      setData((current) => ({ ...current, memberships: current.memberships.map((item) => item.id === membershipId ? { ...item, role, locationIds } : item) }))
    },
    setUserActive: (userId, active) => {
      const targetMemberships = data.memberships.filter((item) => item.userId === userId && item.organizationId)
      if (!targetMemberships.some((item) => item.organizationId && canManageOrganization(item.organizationId))) throw new Error("You do not have permission to update this user.")
      setData((current) => ({ ...current, users: current.users.map((item) => item.id === userId ? { ...item, active } : item) }))
    },
    createProduct: (rawInput) => {
      const input = createProductSchema.parse(rawInput)
      if (!canManageOrganization(input.organizationId)) throw new Error("You do not have permission to create products for this organization.")
      const sku = buildRugSku(input.designNumber, input.colour, input.lengthCm, input.widthCm)
      if (data.variants.some((item) => item.organizationId === input.organizationId && item.sku === sku)) throw new Error(`That SKU is already in use: ${sku}.`)
      if (!data.locations.some((item) => item.id === input.initialLocationId && item.organizationId === input.organizationId && item.active)) throw new Error("Select an active location in this organization.")
      const productId = crypto.randomUUID(); const variantId = crypto.randomUUID(); const inventoryId = crypto.randomUUID()
      setData((current) => ({ ...current, products: [...current.products, { id: productId, organizationId: input.organizationId, name: input.name, designNumber: input.designNumber, category: input.category, collection: input.collection, material: input.material, active: true, variantIds: [variantId] }], variants: [...current.variants, { id: variantId, organizationId: input.organizationId, productId, sku, barcode: input.barcode, articleNumber: input.articleNumber, colour: input.colour, widthCm: input.widthCm, lengthCm: input.lengthCm, retailPriceCents: input.retailPriceCents, costPriceCents: input.costPriceCents, gstApplicable: input.gstApplicable, active: true }], inventory: [...current.inventory, { id: inventoryId, organizationId: input.organizationId, variantId, locationId: input.initialLocationId, quantityOnHand: input.initialStock, quantityReserved: 0 }], inventoryMovements: input.initialStock ? [{ id: crypto.randomUUID(), organizationId: input.organizationId, variantId, locationId: input.initialLocationId, type: "INITIAL_STOCK", quantityChange: input.initialStock, quantityBefore: 0, quantityAfter: input.initialStock, reason: "Initial stock", notes: "Stock recorded during product creation", createdByUserId: user.id, createdAt: new Date().toISOString() }, ...current.inventoryMovements] : current.inventoryMovements }))
      return { productId }
    },
    updateProduct: (input: UpdateProductInput) => {
      const product = data.products.find((item) => item.id === input.productId)
      if (!product || !canManageOrganization(product.organizationId)) throw new Error("You do not have permission to edit this product.")
      if (!input.name.trim() || !input.designNumber.trim() || !input.category.trim() || !input.collection.trim() || !input.material.trim()) throw new Error("Complete all product fields.")
      setData((current) => ({ ...current, products: current.products.map((item) => item.id === input.productId ? { ...item, name: input.name.trim(), designNumber: input.designNumber.trim().toUpperCase(), category: input.category.trim(), collection: input.collection.trim(), material: input.material.trim() } : item) }))
    },
    deleteProduct: (productId: string) => {
      const product = data.products.find((item) => item.id === productId)
      if (!product || (membership.role !== "SUPER_ADMIN" && product.organizationId !== membership.organizationId) || !canManageOrganization(product.organizationId)) throw new Error("You do not have permission to remove this product.")
      const variantIds = new Set(data.variants.filter((item) => item.productId === productId).map((item) => item.id))
      setData((current) => ({ ...current, products: current.products.filter((item) => item.id !== productId), variants: current.variants.filter((item) => item.productId !== productId), inventory: current.inventory.filter((item) => !variantIds.has(item.variantId)) }))
    },
    createVariant: (rawInput) => {
      const input = createVariantSchema.parse(rawInput)
      if (!canManageOrganization(input.organizationId)) throw new Error("You do not have permission to create variants.")
      const product = data.products.find((item) => item.id === input.productId && item.organizationId === input.organizationId)
      if (!product) throw new Error("Select a product in this organization.")
      const sku = buildRugSku(product.designNumber, input.colour, input.lengthCm, input.widthCm)
      if (data.variants.some((item) => item.organizationId === input.organizationId && item.sku === sku)) throw new Error(`That SKU is already in use: ${sku}.`)
      const variantId = crypto.randomUUID(); const now = new Date().toISOString()
      setData((current) => ({ ...current, products: current.products.map((item) => item.id === input.productId ? { ...item, variantIds: [...item.variantIds, variantId] } : item), variants: [...current.variants, { id: variantId, organizationId: input.organizationId, productId: input.productId, sku, supplier: input.supplier, articleNumber: input.articleNumber, barcode: input.barcode, colour: input.colour, description: input.description, features: input.features, origin: input.origin, material: input.material, design: input.design, tags: input.tags, usedIn: input.usedIn, widthCm: input.widthCm, lengthCm: input.lengthCm, heightCm: input.heightCm, weightKg: input.weightKg, unitOfMeasure: "each", retailPriceCents: input.retailPriceCents, costPriceCents: input.costPriceCents, gstApplicable: input.gstApplicable, reorderLevel: input.reorderLevel, washable: input.features.some((feature) => feature.toLowerCase().includes("washable")), active: true }], inventory: [...current.inventory, { id: crypto.randomUUID(), organizationId: input.organizationId, variantId, locationId: input.initialLocationId, quantityOnHand: input.initialStock, quantityReserved: 0 }], inventoryMovements: input.initialStock ? [{ id: crypto.randomUUID(), organizationId: input.organizationId, variantId, locationId: input.initialLocationId, type: "INITIAL_STOCK" as const, quantityChange: input.initialStock, quantityBefore: 0, quantityAfter: input.initialStock, reason: "Initial stock", notes: `Variant created · ${now}`, createdByUserId: user.id, createdAt: now }, ...current.inventoryMovements] : current.inventoryMovements }))
      return { variantId }
    },
    setProductActive: (productId, active) => {
      const target = data.products.find((item) => item.id === productId)
      if (!target || !canManageOrganization(target.organizationId)) throw new Error("You do not have permission to update this product.")
      setData((current) => ({ ...current, products: current.products.map((item) => item.id === productId ? { ...item, active } : item), variants: current.variants.map((item) => item.productId === productId ? { ...item, active } : item) }))
    },
    adjustInventory: (rawInput) => {
      const input = adjustInventorySchema.parse(rawInput)
      const canAdjust = !session.impersonationActorUserId && (membership.role === "SUPER_ADMIN" || ((membership.role === "ADMIN" || membership.role === "STORE_MANAGER") && membership.organizationId === input.organizationId))
      if (!canAdjust) throw new Error("You do not have permission to adjust inventory for this organization.")
      if (membership.role === "STORE_MANAGER" && !membership.locationIds.includes(input.locationId)) throw new Error("Managers can adjust only their assigned locations.")
      const existing = data.inventory.find((item) => item.variantId === input.variantId && item.locationId === input.locationId && item.organizationId === input.organizationId)
      const before = existing?.quantityOnHand ?? 0; const after = before + input.quantityChange
      if (after < (existing?.quantityReserved ?? 0)) throw new Error(`This adjustment would leave fewer items than the ${existing?.quantityReserved ?? 0} currently reserved.`)
      const inventoryId = existing?.id ?? crypto.randomUUID()
      setData((current) => ({ ...current, inventory: existing ? current.inventory.map((item) => item.id === inventoryId ? { ...item, quantityOnHand: after } : item) : [...current.inventory, { id: inventoryId, organizationId: input.organizationId, variantId: input.variantId, locationId: input.locationId, quantityOnHand: after, quantityReserved: 0 }], inventoryMovements: [{ id: crypto.randomUUID(), organizationId: input.organizationId, variantId: input.variantId, locationId: input.locationId, type: input.quantityChange > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT", quantityChange: input.quantityChange, quantityBefore: before, quantityAfter: after, reason: input.reason, notes: input.notes, createdByUserId: user.id, createdAt: new Date().toISOString() }, ...current.inventoryMovements] }))
    },
    completeSale: (rawInput) => {
      const input = completeSaleSchema.parse(rawInput)
      if (input.organizationId !== (membership.role === "SUPER_ADMIN" ? input.organizationId : membership.organizationId)) throw new Error("You do not have access to this organization.")
      if (membership.role === "STORE_MANAGER" && !membership.locationIds.includes(input.locationId)) throw new Error("You can sell only from your assigned locations.")
      if (membership.role === "STORE_USER" && !membership.locationIds.includes(input.locationId)) throw new Error("You can sell only from your assigned location.")
      const businessDate = new Date().toISOString().slice(0, 10)
      if (!data.dailyRegisters.some((item) => item.organizationId === input.organizationId && item.businessDate === businessDate && item.status === "OPEN")) throw new Error("Open the store day before starting a sale.")
      const hasDiscount = input.items.some((item) => item.discountCents > 0)
      const isPrivilegedBilling = membership.role === "STORE_MANAGER" || membership.role === "ADMIN" || membership.role === "SUPER_ADMIN"
      let approvalUserId: string | undefined
      if (hasDiscount && !isPrivilegedBilling) {
        const enteredCode = input.approvalCode?.trim()
        const approver = data.memberships.find((item) => (item.organizationId === input.organizationId || item.role === "SUPER_ADMIN") && ["SUPER_ADMIN", "STORE_MANAGER", "ADMIN"].includes(item.role) && item.approvalCode === enteredCode)
        if (!approver) throw new Error("A manager approval code is required for discounted sales.")
        approvalUserId = approver.userId
      } else if (hasDiscount) approvalUserId = user.id

      const calculatedItems = input.items.map((item) => {
        const variant = data.variants.find((candidate) => candidate.id === item.variantId && candidate.organizationId === input.organizationId && candidate.active)
        if (!variant) throw new Error("One of the selected products is no longer available.")
        const inventory = data.inventory.find((record) => record.variantId === item.variantId && record.locationId === input.locationId && record.organizationId === input.organizationId)
        const available = (inventory?.quantityOnHand ?? 0) - (inventory?.quantityReserved ?? 0)
        if (available < item.qty) throw new Error(`Only ${available} available for ${variant.sku} at this location.`)
        const lineTotalCents = (variant.retailPriceCents * item.qty) - item.discountCents
        if (item.discountCents > variant.retailPriceCents * item.qty) throw new Error(`Discount cannot exceed the value of ${variant.sku}.`)
        const product = data.products.find((candidate) => candidate.id === variant.productId)
        return { input: item, variant, inventory, lineTotalCents, description: `${product?.name ?? "Product"} / ${variant.colour} / ${variant.widthCm} × ${variant.lengthCm} cm` }
      })
      const subtotalCents = calculatedItems.reduce((sum, item) => sum + item.variant.retailPriceCents * item.input.qty, 0)
      const discountTotalCents = calculatedItems.reduce((sum, item) => sum + item.input.discountCents, 0)
      const totalCents = calculatedItems.reduce((sum, item) => sum + item.lineTotalCents, 0)
      const gstTotalCents = calculatedItems.reduce((sum, item) => sum + (item.variant.gstApplicable ? Math.round(item.lineTotalCents / 11) : 0), 0)
      if (input.amountPaidCents !== totalCents) throw new Error(`Payment must match the sale total of $${(totalCents / 100).toFixed(2)}.`)
      const orderId = crypto.randomUUID(); const orderNumber = nextOrganizationOrderNumber(data, input.organizationId); const now = new Date().toISOString()
      if (input.customerId && !data.customers.some((item) => item.id === input.customerId && item.organizationId === input.organizationId)) throw new Error("Select a customer from this organization.")
      const deliveryRequested = input.items.some((item) => item.fulfillmentType === "DELIVERY")
      const customer = input.customerId ? data.customers.find((item) => item.id === input.customerId) : undefined
      if (deliveryRequested && (!customer || !customer.address.unitStreetAddress || !customer.address.suburb || !customer.address.postCode || !customer.address.state || !customer.address.country)) throw new Error("Delivery requires a customer with a complete delivery address.")
      const order = { id: orderId, organizationId: input.organizationId, orderNumber, locationId: input.locationId, salespersonUserId: user.id, customerId: input.customerId, approvalUserId, status: "COMPLETED" as const, items: calculatedItems.map((item) => ({ id: crypto.randomUUID(), variantId: item.variant.id, skuSnapshot: item.variant.sku, descriptionSnapshot: item.description, qty: item.input.qty, unitPriceCents: item.variant.retailPriceCents, discountCents: item.input.discountCents, lineTotalCents: item.lineTotalCents, fulfillmentType: item.input.fulfillmentType })), subtotalCents, discountTotalCents, gstTotalCents, totalCents, amountPaidCents: input.amountPaidCents, paymentMethod: input.paymentMethod, createdAt: now, completedAt: now }
      setData((current) => ({ ...current, orders: [order, ...current.orders], organizations: current.organizations.map((item) => item.id === input.organizationId ? { ...item, salesTodayCents: item.salesTodayCents + totalCents, orderCountToday: item.orderCountToday + 1, inventoryCount: item.inventoryCount - input.items.reduce((sum, line) => sum + line.qty, 0) } : item), inventory: current.inventory.map((record) => { const sold = calculatedItems.find((item) => item.inventory?.id === record.id); return sold ? { ...record, quantityOnHand: record.quantityOnHand - sold.input.qty } : record }), inventoryMovements: [...calculatedItems.map((item) => ({ id: crypto.randomUUID(), organizationId: input.organizationId, variantId: item.variant.id, locationId: input.locationId, type: "SALE" as const, quantityChange: -item.input.qty, quantityBefore: item.inventory?.quantityOnHand ?? 0, quantityAfter: (item.inventory?.quantityOnHand ?? 0) - item.input.qty, reason: orderNumber, notes: `Sale completed via POS · ${input.paymentMethod}`, createdByUserId: user.id, createdAt: now })), ...current.inventoryMovements], activity: [{ id: crypto.randomUUID(), organizationId: input.organizationId, title: `Sale ${orderNumber} completed`, description: `$${(totalCents / 100).toFixed(2)} · ${input.paymentMethod}`, timestamp: "Just now", kind: "SALE" }, ...current.activity] }))
      return { orderId, orderNumber }
    },
    setOrderStatus: (orderId, status) => {
      const target = data.orders.find((item) => item.id === orderId)
      if (!target || target.organizationId !== membership.organizationId && membership.role !== "SUPER_ADMIN") throw new Error("You do not have access to this order.")
      if (session.impersonationActorUserId || !["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"].includes(membership.role)) throw new Error("Only managers and above can change order status.")
      setData((current) => ({ ...current, orders: current.orders.map((item) => item.id === orderId ? { ...item, status } : item) }))
    },
    createTransfer: (rawInput) => {
      const input = createTransferSchema.parse(rawInput)
      if (!canManageOrganization(input.organizationId) && membership.role !== "STORE_MANAGER") throw new Error("You do not have permission to request transfers for this organization.")
      if (membership.role !== "SUPER_ADMIN" && membership.role !== "ADMIN" && !membership.locationIds.includes(input.fromLocationId)) throw new Error("You can request transfers only from your assigned locations.")
      if (!data.locations.some((item) => item.id === input.fromLocationId && item.organizationId === input.organizationId && item.active) || !data.locations.some((item) => item.id === input.toLocationId && item.organizationId === input.organizationId && item.active)) throw new Error("Choose two active locations in the same organization.")
      for (const item of input.items) { const variant = data.variants.find((candidate) => candidate.id === item.variantId && candidate.organizationId === input.organizationId && candidate.active); const stock = data.inventory.find((record) => record.variantId === item.variantId && record.locationId === input.fromLocationId); if (!variant || !stock || stock.quantityOnHand - stock.quantityReserved < item.quantity) throw new Error(`Not enough available stock for ${variant?.sku ?? "this variant"}.`) }
      const transferId = crypto.randomUUID(); const transferNumber = `TRN-${data.transfers.length + 205}`; const now = new Date().toISOString()
      setData((current) => ({ ...current, transfers: [{ id: transferId, organizationId: input.organizationId, transferNumber, fromLocationId: input.fromLocationId, toLocationId: input.toLocationId, status: "REQUESTED", items: input.items.map((item) => ({ id: crypto.randomUUID(), ...item })), requestedByUserId: user.id, notes: input.notes, createdAt: now }, ...current.transfers], activity: [{ id: crypto.randomUUID(), organizationId: input.organizationId, title: `Transfer ${transferNumber} requested`, description: `${input.items.length} item${input.items.length === 1 ? "" : "s"} · Awaiting approval`, timestamp: "Just now", kind: "TRANSFER" }, ...current.activity] }))
      return { transferId }
    },
    approveTransfer: (transferId) => {
      const transfer = data.transfers.find((item) => item.id === transferId)
      if (!transfer || transfer.status !== "REQUESTED") throw new Error("This transfer is no longer awaiting approval.")
      if (!canManageOrganization(transfer.organizationId) && membership.role !== "STORE_MANAGER") throw new Error("Manager approval is required for transfers.")
      if (membership.role === "STORE_MANAGER" && !membership.locationIds.includes(transfer.toLocationId)) throw new Error("You can approve transfers only for your assigned destination locations.")
      setData((current) => ({ ...current, transfers: current.transfers.map((item) => item.id === transferId ? { ...item, status: "APPROVED" as const, approvedByUserId: user.id, approvedAt: new Date().toISOString() } : item) }))
    },
    dispatchTransfer: (transferId) => {
      const transfer = data.transfers.find((item) => item.id === transferId)
      if (!transfer || transfer.status !== "APPROVED") throw new Error("Only approved transfers can be dispatched.")
      if (!canManageOrganization(transfer.organizationId) && membership.role !== "STORE_MANAGER") throw new Error("Manager dispatch is required.")
      if (membership.role === "STORE_MANAGER" && !membership.locationIds.includes(transfer.fromLocationId)) throw new Error("You can dispatch only from your assigned source locations.")
      for (const item of transfer.items) { const stock = data.inventory.find((record) => record.variantId === item.variantId && record.locationId === transfer.fromLocationId); if (!stock || stock.quantityOnHand - stock.quantityReserved < item.quantity) throw new Error("Available stock changed. Review this transfer before dispatching.") }
      const now = new Date().toISOString()
      setData((current) => ({ ...current, transfers: current.transfers.map((item) => item.id === transferId ? { ...item, status: "IN_TRANSIT" as const, shippedAt: now } : item), inventory: current.inventory.map((record) => { const line = transfer.items.find((item) => item.variantId === record.variantId && record.locationId === transfer.fromLocationId); return line ? { ...record, quantityOnHand: record.quantityOnHand - line.quantity } : record }), inventoryMovements: [...transfer.items.map((item) => { const stock = data.inventory.find((record) => record.variantId === item.variantId && record.locationId === transfer.fromLocationId)!; return { id: crypto.randomUUID(), organizationId: transfer.organizationId, variantId: item.variantId, locationId: transfer.fromLocationId, type: "TRANSFER_OUT" as const, quantityChange: -item.quantity, quantityBefore: stock.quantityOnHand, quantityAfter: stock.quantityOnHand - item.quantity, reason: transfer.transferNumber, notes: "Dispatched", createdByUserId: user.id, createdAt: now } }), ...current.inventoryMovements] }))
    },
    receiveTransfer: (transferId) => {
      const transfer = data.transfers.find((item) => item.id === transferId)
      if (!transfer || transfer.status !== "IN_TRANSIT") throw new Error("Only in-transit transfers can be received.")
      if (!canManageOrganization(transfer.organizationId) && membership.role !== "STORE_MANAGER") throw new Error("Manager receipt is required.")
      if (membership.role === "STORE_MANAGER" && !membership.locationIds.includes(transfer.toLocationId)) throw new Error("You can receive only at your assigned destination locations.")
      const now = new Date().toISOString()
      setData((current) => ({ ...current, transfers: current.transfers.map((item) => item.id === transferId ? { ...item, status: "RECEIVED" as const, receivedByUserId: user.id, receivedAt: now } : item), inventory: current.inventory.map((record) => { const line = transfer.items.find((item) => item.variantId === record.variantId && record.locationId === transfer.toLocationId); return line ? { ...record, quantityOnHand: record.quantityOnHand + line.quantity } : record }).concat(transfer.items.filter((item) => !current.inventory.some((record) => record.variantId === item.variantId && record.locationId === transfer.toLocationId)).map((item) => ({ id: crypto.randomUUID(), organizationId: transfer.organizationId, variantId: item.variantId, locationId: transfer.toLocationId, quantityOnHand: item.quantity, quantityReserved: 0 }))), inventoryMovements: [...transfer.items.map((item) => { const stock = data.inventory.find((record) => record.variantId === item.variantId && record.locationId === transfer.toLocationId); return { id: crypto.randomUUID(), organizationId: transfer.organizationId, variantId: item.variantId, locationId: transfer.toLocationId, type: "TRANSFER_IN" as const, quantityChange: item.quantity, quantityBefore: stock?.quantityOnHand ?? 0, quantityAfter: (stock?.quantityOnHand ?? 0) + item.quantity, reason: transfer.transferNumber, notes: "Received", createdByUserId: user.id, createdAt: now } }), ...current.inventoryMovements] }))
    },
    cancelTransfer: (transferId) => {
      const transfer = data.transfers.find((item) => item.id === transferId)
      if (!transfer || ["RECEIVED", "CANCELLED"].includes(transfer.status)) throw new Error("This transfer cannot be cancelled.")
      if (!canManageOrganization(transfer.organizationId)) throw new Error("Only an organization administrator can cancel this transfer.")
      setData((current) => ({ ...current, transfers: current.transfers.map((item) => item.id === transferId ? { ...item, status: "CANCELLED" as const } : item) }))
    },
    openDay: (organizationId, locationId) => {
      if (session.impersonationActorUserId || !membership.locationIds.includes(locationId) && membership.role !== "SUPER_ADMIN" && membership.role !== "ADMIN") throw new Error("You do not have access to open this location.")
      const businessDate = new Date().toISOString().slice(0, 10)
      if (data.dailyRegisters.some((item) => item.organizationId === organizationId && item.businessDate === businessDate && item.status === "OPEN")) throw new Error("This organization’s day is already open.")
      setData((current) => ({ ...current, dailyRegisters: [{ id: crypto.randomUUID(), organizationId, locationId, businessDate, status: "OPEN", openedByUserId: user.id, openedAt: new Date().toISOString() }, ...current.dailyRegisters] }))
    },
    endDay: (registerId, countedCashCents, notes) => {
      const register = data.dailyRegisters.find((item) => item.id === registerId)
      if (!register || register.status !== "OPEN") throw new Error("This day is not open.")
      if (session.impersonationActorUserId || (membership.role !== "SUPER_ADMIN" && membership.role !== "ADMIN" && !membership.locationIds.includes(register.locationId))) throw new Error("You do not have access to end this day.")
      if (!Number.isInteger(countedCashCents) || countedCashCents < 0) throw new Error("Enter the counted cash amount.")
      const expectedCashCents = data.orders.filter((order) => order.organizationId === register.organizationId && order.paymentMethod === "CASH" && order.createdAt.slice(0, 10) === register.businessDate).reduce((sum, order) => sum + order.totalCents, 0)
      setData((current) => ({ ...current, dailyRegisters: current.dailyRegisters.map((item) => item.id === registerId ? { ...item, status: "CLOSED" as const, closedByUserId: user.id, closedAt: new Date().toISOString(), expectedCashCents, countedCashCents, varianceCents: countedCashCents - expectedCashCents, notes } : item) }))
    },
    startImpersonation: (membershipId, reason) => {
      if (membership.role !== "SUPER_ADMIN" || session.impersonationActorUserId) throw new Error("Only an active super admin can start impersonation.")
      const target = data.memberships.find((item) => item.id === membershipId && item.organizationId)
      if (!target || !reason.trim()) throw new Error("Select a valid user and provide an audit reason.")
      setData((current) => ({ ...current, auditLogs: [{ id: crypto.randomUUID(), actorUserId: user.id, effectiveUserId: target.userId, organizationId: target.organizationId, action: "IMPERSONATION_STARTED", description: reason.trim(), timestamp: new Date().toISOString() }, ...current.auditLogs] }))
      setSession({ userId: target.userId, membershipId: target.id, organizationId: target.organizationId, impersonationActorUserId: user.id, impersonationReason: reason.trim() })
    },
    endImpersonation: () => {
      if (!session.impersonationActorUserId) return
      const actorUserId = session.impersonationActorUserId
      const actorMembership = data.memberships.find((item) => item.userId === actorUserId && item.role === "SUPER_ADMIN")
      if (!actorMembership) return
      setData((current) => ({ ...current, auditLogs: [{ id: crypto.randomUUID(), actorUserId, effectiveUserId: user.id, organizationId: membership.organizationId, action: "IMPERSONATION_ENDED", description: `Ended impersonation of ${user.name}`, timestamp: new Date().toISOString() }, ...current.auditLogs] }))
      setSession({ userId: actorUserId, membershipId: actorMembership.id, organizationId: null })
    },
    resetDemo: () => {
      resetLocalDevelopmentData()
      setData(structuredClone(seedData))
      setSession(defaultDevelopmentSession)
    },
  }), [canManageOrganization, data, hydrated, membership, organization, session, user])

  if (!hydrated) {
    return <main className="grid min-h-svh place-items-center bg-background p-6 text-sm text-muted-foreground">Loading workspace…</main>
  }

  if (productionUnavailable) {
    return <main className="grid min-h-svh place-items-center bg-background p-6 text-center"><div><h1 className="text-lg font-semibold">Workspace unavailable</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">Memba could not load the production workspace. Refresh the page or contact an administrator.</p></div></main>
  }

  return <MembaContext.Provider value={value}>{children}</MembaContext.Provider>
}

export function useMemba() {
  const context = useContext(MembaContext)
  if (!context) throw new Error("useMemba must be used within MembaProvider")
  return context
}
