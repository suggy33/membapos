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
    return parsed.schemaVersion === 1 ? { ...parsed, auditLogs: parsed.auditLogs ?? [], products: parsed.products ?? seedData.products, variants: parsed.variants ?? seedData.variants, inventory: parsed.inventory ?? seedData.inventory, inventoryMovements: parsed.inventoryMovements ?? seedData.inventoryMovements, orders: parsed.orders ?? [], transfers: parsed.transfers ?? [], dailyRegisters: parsed.dailyRegisters ?? [] } : structuredClone(seedData)
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
