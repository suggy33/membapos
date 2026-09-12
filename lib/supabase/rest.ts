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
  const requestUrl = `${url}/rest/v1/${path}`
  let response: Response | undefined
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(requestUrl, {
      ...requestInit,
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        ...headers,
      },
      cache: "no-store",
    })
    if (![502, 503, 504].includes(response.status) || attempt === 2) break
    await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)))
  }

  if (!response || !response.ok) {
    if (!response) throw new Error("Supabase request failed without a response.")
    const responseBody = (await response.text()).replace(/\s+/g, " ").slice(0, 300)
    throw new Error(`Supabase request failed with status ${response.status}${responseBody ? `: ${responseBody}` : "."}`)
  }

  if (response.status === 204) return null as T
  return (await response.json()) as T
}

export async function getAuthenticatedSupabaseToken() {
  const { userId, getToken } = await auth()
  if (!userId) return null
  return getToken()
}
