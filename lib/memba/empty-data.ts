import type { DevelopmentSession, MembaData, Membership, User } from "./types"

export const emptyData: MembaData = {
  schemaVersion: 1,
  organizations: [], locations: [], users: [], memberships: [], activity: [], auditLogs: [],
  products: [], variants: [], inventory: [], inventoryMovements: [], orders: [], transfers: [],
  dailyRegisters: [], customers: [],
}

export const emptyUser: User = { id: "", name: "", email: "", initials: "", active: false }
export const emptyMembership: Membership = { id: "", userId: "", organizationId: null, role: "STORE_USER", locationIds: [] }
export const emptyDevelopmentSession: DevelopmentSession = { userId: "", membershipId: "", organizationId: null }
