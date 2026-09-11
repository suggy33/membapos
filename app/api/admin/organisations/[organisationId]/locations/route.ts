import { NextResponse } from "next/server"

import { requireOrganisationAdmin } from "@/lib/supabase/admin-auth"
import { supabaseRestRequest } from "@/lib/supabase/rest"

export async function POST(request: Request, { params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params
  try {
    await requireOrganisationAdmin(organisationId)
    const body = await request.json() as { name?: unknown; code?: unknown; type?: unknown; suburb?: unknown; state?: unknown }
    const name = String(body.name ?? "").trim()
    const code = String(body.code ?? "").trim().toUpperCase()
    const type = body.type === "WAREHOUSE" ? "WAREHOUSE" : "STORE"
    const suburb = String(body.suburb ?? "").trim()
    const state = String(body.state ?? "VIC").trim().toUpperCase()
    if (name.length < 2 || !/^[A-Z0-9]{2,6}$/.test(code) || suburb.length < 2) return NextResponse.json({ error: "Enter a valid location name, code and suburb." }, { status: 400 })

    const [organisation, activeLocations, duplicate] = await Promise.all([
      supabaseRestRequest<Array<{ max_locations: number }>>(`organisations?select=max_locations&id=eq.${organisationId}&limit=1`, { serviceRole: true }),
      supabaseRestRequest<Array<{ id: string }>>(`locations?select=id&organisation_id=eq.${organisationId}&active=eq.true`, { serviceRole: true }),
      supabaseRestRequest<Array<{ id: string }>>(`locations?select=id&organisation_id=eq.${organisationId}&code=eq.${encodeURIComponent(code)}&limit=1`, { serviceRole: true }),
    ])
    if (!organisation[0]) return NextResponse.json({ error: "Organisation not found." }, { status: 404 })
    if (activeLocations.length >= organisation[0].max_locations) return NextResponse.json({ error: `This organisation has reached its ${organisation[0].max_locations}-location limit.` }, { status: 400 })
    if (duplicate[0]) return NextResponse.json({ error: "That location code is already in use for this organisation." }, { status: 409 })

    const created = await supabaseRestRequest<Array<{ id: string }>>("locations", {
      method: "POST",
      serviceRole: true,
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ organisation_id: organisationId, name, code, type, address: { suburb, state }, active: true }),
    })
    return NextResponse.json({ location: created[0] }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    return NextResponse.json({ error: message === "UNAUTHORISED" ? "Unauthorised" : "You do not have permission to manage this organisation." }, { status: message === "UNAUTHORISED" ? 401 : 403 })
  }
}
