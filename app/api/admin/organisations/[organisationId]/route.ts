import { NextResponse } from "next/server"

import { requireOrganisationAdmin } from "@/lib/supabase/admin-auth"
import { supabaseRestRequest } from "@/lib/supabase/rest"

export async function PATCH(request: Request, { params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params
  try {
    await requireOrganisationAdmin(organisationId)
    const body = await request.json() as { maxLocations?: unknown }
    const maxLocations = Number(body.maxLocations)
    if (!Number.isInteger(maxLocations) || maxLocations < 1) return NextResponse.json({ error: "Location limit must be a positive whole number." }, { status: 400 })

    const activeLocations = await supabaseRestRequest<Array<{ id: string }>>(
      `locations?select=id&organisation_id=eq.${organisationId}&active=eq.true`,
      { serviceRole: true },
    )
    if (maxLocations < activeLocations.length) return NextResponse.json({ error: `Location limit cannot be below the ${activeLocations.length} active locations.` }, { status: 400 })

    await supabaseRestRequest(`organisations?id=eq.${organisationId}`, {
      method: "PATCH",
      serviceRole: true,
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ max_locations: maxLocations }),
    })
    return NextResponse.json({ ok: true, maxLocations })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    return NextResponse.json({ error: message === "UNAUTHORISED" ? "Unauthorised" : "You do not have permission to update this organisation." }, { status: message === "UNAUTHORISED" ? 401 : 403 })
  }
}
