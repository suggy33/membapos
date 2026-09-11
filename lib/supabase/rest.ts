import "server-only"

import { auth } from "@clerk/nextjs/server"

type SupabaseRequestOptions = RequestInit & {
  serviceRole?: boolean
}

function getSupabaseConfig(serviceRole: boolean) {
  const url = process.env.SUPABASE_PROJECT_URL ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = serviceRole
    ? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Supabase server configuration is incomplete.")
  }

  return { url: url.replace(/\/$/, ""), key }
}

export async function supabaseRestRequest<T>(path: string, options: SupabaseRequestOptions = {}) {
  const { serviceRole = false, headers, ...requestInit } = options
  const { url, key } = getSupabaseConfig(serviceRole)
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...requestInit,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}.`)
  }

  if (response.status === 204) return null as T
  return (await response.json()) as T
}

export async function getAuthenticatedSupabaseToken() {
  const { userId, getToken } = await auth()
  if (!userId) return null
  return getToken()
}
