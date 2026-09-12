import { NextResponse } from "next/server"

import { requireOrganisationAdmin } from "@/lib/supabase/admin-auth"
import { supabaseRestRequest } from "@/lib/supabase/rest"

export async function PATCH(request: Request, { params }: { params: Promise<{ organisationId: string; locationId: string }> }) {
  const { organisationId, locationId } = await params
  try {
    await requireOrganisationAdmin(organisationId)
    const body = await request.json() as { active?: unknown }
    if (typeof body.active !== "boolean") return NextResponse.json({ error: "Active must be true or false." }, { status: 400 })
    await supabaseRestRequest(`locations?id=eq.${locationId}&organisation_id=eq.${organisationId}`, {
      method: "PATCH",
      serviceRole: true,
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ active: body.active }),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    console.error("[admin/locations] Update failed:", message || "unknown error")
    return NextResponse.json({ error: message === "UNAUTHORISED" ? "Unauthorised" : "You do not have permission to manage this organisation." }, { status: message === "UNAUTHORISED" ? 401 : 403 })
  }
}
