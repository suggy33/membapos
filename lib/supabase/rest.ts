import "server-only"

import { auth } from "@clerk/nextjs/server"

type SupabaseRequestOptions = RequestInit & {
  serviceRole?: boolean
}

function getSupabaseConfig(serviceRole: boolean) {
  const configuredUrl = process.env.SUPABASE_PROJECT_URL
    ?? process.env.SUPABASE_URL
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    ?? process.env.SUPABASE_PROJECT_ID
  const key = serviceRole
    ? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!configuredUrl || !key) {
    throw new Error("Supabase server configuration is incomplete.")
  }

  const url = configuredUrl.startsWith("http") ? configuredUrl : `https://${configuredUrl}.supabase.co`
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
