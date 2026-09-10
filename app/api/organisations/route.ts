import { NextResponse } from "next/server"

import { getAuthenticatedSupabaseToken, supabaseRestRequest } from "@/lib/supabase/rest"

export async function GET() {
  const token = await getAuthenticatedSupabaseToken()
  if (!token) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  try {
    const authHeaders = { Authorization: `Bearer ${token}` }
    const [organisations, locations, memberships] = await Promise.all([
      supabaseRestRequest("organisations?select=*&order=name.asc", { headers: authHeaders }),
      supabaseRestRequest("locations?select=*&order=name.asc", { headers: authHeaders }),
      supabaseRestRequest("organisation_memberships?select=*,employees(*)&order=created_at.asc", { headers: authHeaders }),
    ])

    return NextResponse.json({ organisations, locations, memberships })
  } catch {
    return NextResponse.json({ error: "Unable to load organisations." }, { status: 502 })
  }
}
