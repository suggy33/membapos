"use client"

import { emptyData, emptyDevelopmentSession } from "./empty-data"
import type { DevelopmentSession, MembaData } from "./types"

const dataKey = "memba:local-data:v2"
const sessionKey = "memba:development-session:v2"

export function loadLocalData(): MembaData {
  const raw = window.localStorage.getItem(dataKey)
  if (!raw) return structuredClone(emptyData)

  try {
    const parsed = JSON.parse(raw) as MembaData
    return parsed.schemaVersion === 1 ? { ...emptyData, ...parsed, organizations: parsed.organizations.map((item) => ({ ...item, maxLocations: item.maxLocations ?? Math.max(1, parsed.locations.filter((location) => location.organizationId === item.id && location.active).length) })), auditLogs: parsed.auditLogs ?? [], products: parsed.products ?? [], variants: parsed.variants ?? [], inventory: parsed.inventory ?? [], inventoryMovements: parsed.inventoryMovements ?? [], orders: (parsed.orders ?? []).map((order) => ({ ...order, items: order.items.map((item) => ({ ...item, fulfillmentType: item.fulfillmentType ?? "CASH_AND_CARRY" })) })), transfers: parsed.transfers ?? [], dailyRegisters: parsed.dailyRegisters ?? [], customers: (parsed.customers ?? []).map((customer) => ({ ...customer, communicationPreferences: customer.communicationPreferences ?? ((customer as unknown as { communicationPreference?: "EMAIL" | "SMS" | "PHONE" }).communicationPreference ? [(customer as unknown as { communicationPreference?: "EMAIL" | "SMS" | "PHONE" }).communicationPreference] : ["EMAIL"]), marketingOptIn: customer.marketingOptIn ?? false, address: typeof customer.address === "string" ? { unitStreetAddress: customer.address, addressLine2: "", suburb: "", postCode: "", state: "", country: "Australia" } : { unitStreetAddress: customer.address?.unitStreetAddress ?? "", addressLine2: customer.address?.addressLine2 ?? "", suburb: customer.address?.suburb ?? "", postCode: customer.address?.postCode ?? "", state: customer.address?.state ?? "", country: customer.address?.country ?? "Australia" } })) } : structuredClone(emptyData)
  } catch {
    return structuredClone(emptyData)
  }
}

export function saveLocalData(data: MembaData) {
  window.localStorage.setItem(dataKey, JSON.stringify(data))
}

export function loadDevelopmentSession(): DevelopmentSession {
  const raw = window.localStorage.getItem(sessionKey)
  if (!raw) return emptyDevelopmentSession

  try {
    return JSON.parse(raw) as DevelopmentSession
  } catch {
    return emptyDevelopmentSession
  }
}

export function saveDevelopmentSession(session: DevelopmentSession) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session))
}

export function resetLocalDevelopmentData() {
  window.localStorage.removeItem(dataKey)
  window.localStorage.removeItem(sessionKey)
}
