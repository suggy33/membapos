"use client"

import { defaultDevelopmentSession, seedData } from "./seed"
import type { DevelopmentSession, MembaData } from "./types"

const dataKey = "memba:local-data:v1"
const sessionKey = "memba:development-session:v1"

export function loadLocalData(): MembaData {
  const raw = window.localStorage.getItem(dataKey)
  if (!raw) return structuredClone(seedData)

  try {
    const parsed = JSON.parse(raw) as MembaData
    return parsed.schemaVersion === 1 ? { ...parsed, organizations: parsed.organizations.map((item) => ({ ...item, maxLocations: item.maxLocations ?? Math.max(1, parsed.locations.filter((location) => location.organizationId === item.id && location.active).length) })), auditLogs: parsed.auditLogs ?? [], products: parsed.products ?? seedData.products, variants: parsed.variants ?? seedData.variants, inventory: parsed.inventory ?? seedData.inventory, inventoryMovements: parsed.inventoryMovements ?? seedData.inventoryMovements, orders: (parsed.orders ?? []).map((order) => ({ ...order, items: order.items.map((item) => ({ ...item, fulfillmentType: item.fulfillmentType ?? "CASH_AND_CARRY" })) })), transfers: parsed.transfers ?? [], dailyRegisters: parsed.dailyRegisters ?? [], customers: (parsed.customers ?? []).map((customer) => ({ ...customer, communicationPreferences: customer.communicationPreferences ?? ((customer as unknown as { communicationPreference?: "EMAIL" | "SMS" | "PHONE" }).communicationPreference ? [(customer as unknown as { communicationPreference?: "EMAIL" | "SMS" | "PHONE" }).communicationPreference] : ["EMAIL"]), marketingOptIn: customer.marketingOptIn ?? false, address: typeof customer.address === "string" ? { unitStreetAddress: customer.address, addressLine2: "", suburb: "", postCode: "", state: "", country: "Australia" } : { unitStreetAddress: customer.address?.unitStreetAddress ?? "", addressLine2: customer.address?.addressLine2 ?? "", suburb: customer.address?.suburb ?? "", postCode: customer.address?.postCode ?? "", state: customer.address?.state ?? "", country: customer.address?.country ?? "Australia" } })) } : structuredClone(seedData)
  } catch {
    return structuredClone(seedData)
  }
}

export function saveLocalData(data: MembaData) {
  window.localStorage.setItem(dataKey, JSON.stringify(data))
}

export function loadDevelopmentSession(): DevelopmentSession {
  const raw = window.localStorage.getItem(sessionKey)
  if (!raw) return defaultDevelopmentSession

  try {
    return JSON.parse(raw) as DevelopmentSession
  } catch {
    return defaultDevelopmentSession
  }
}

export function saveDevelopmentSession(session: DevelopmentSession) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session))
}

export function resetLocalDevelopmentData() {
  window.localStorage.removeItem(dataKey)
  window.localStorage.removeItem(sessionKey)
}
