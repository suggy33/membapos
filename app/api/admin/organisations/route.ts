import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { requirePlatformSuperAdmin } from "@/lib/supabase/admin-auth"
import { supabaseRestRequest } from "@/lib/supabase/rest"

export async function POST(request: Request) {
  let clerkOrganisationId: string | undefined
  let stage = "authorisation"
  try {
    await requirePlatformSuperAdmin()
    stage = "validation"
    const body = await request.json() as { name?: unknown; code?: unknown; adminName?: unknown; adminEmail?: unknown; locationName?: unknown; locationCode?: unknown; locationType?: unknown; suburb?: unknown; state?: unknown; maxLocations?: unknown }
    const name = String(body.name ?? "").trim()
    const code = String(body.code ?? "").trim().toUpperCase()
    const adminName = String(body.adminName ?? "").trim()
    const adminEmail = String(body.adminEmail ?? "").trim().toLowerCase()
    const locationName = String(body.locationName ?? "").trim()
    const locationCode = String(body.locationCode ?? "").trim().toUpperCase()
    const locationType = body.locationType === "WAREHOUSE" ? "WAREHOUSE" : "STORE"
    const suburb = String(body.suburb ?? "").trim()
    const state = String(body.state ?? "VIC").trim().toUpperCase()
    const maxLocations = Number(body.maxLocations)
    if (name.length < 2 || !/^[A-Z]{2,6}$/.test(code) || adminName.split(/\s+/).length < 2 || !/^\S+@\S+\.\S+$/.test(adminEmail) || locationName.length < 2 || !/^[A-Z0-9]{2,6}$/.test(locationCode) || suburb.length < 2 || !Number.isInteger(maxLocations) || maxLocations < 1) return NextResponse.json({ error: "Complete all organisation, location and administrator fields." }, { status: 400 })

    stage = "organisation duplicate check"
    const duplicate = await supabaseRestRequest<Array<{ id: string }>>(`organisations?select=id&code=eq.${encodeURIComponent(code)}&limit=1`, { serviceRole: true })
    if (duplicate[0]) return NextResponse.json({ error: "That organisation code is already in use." }, { status: 409 })

    stage = "Clerk organisation creation"
    const clerk = await clerkClient()
    const clerkOrganisation = await clerk.organizations.createOrganization({ name, slug: code.toLowerCase() })
    clerkOrganisationId = clerkOrganisation.id
    stage = "organisation database creation"
    const created = await supabaseRestRequest<Array<{ id: string }>>("organisations", { method: "POST", serviceRole: true, headers: { Prefer: "return=representation" }, body: JSON.stringify({ clerk_organisation_id: clerkOrganisationId, name, code, status: "TRIAL", max_locations: maxLocations }) })
    const organisationId = created[0]?.id
    if (!organisationId) throw new Error("Organisation record was not created.")
    stage = "location database creation"
    const locations = await supabaseRestRequest<Array<{ id: string }>>("locations", { method: "POST", serviceRole: true, headers: { Prefer: "return=representation" }, body: JSON.stringify({ organisation_id: organisationId, name: locationName, code: locationCode, type: locationType, address: { suburb, state }, active: true }) })
    stage = "employee database creation"
    const employee = await supabaseRestRequest<Array<{ id: string }>>("employees", { method: "POST", serviceRole: true, headers: { Prefer: "return=representation" }, body: JSON.stringify({ email: adminEmail, display_name: adminName, status: "INVITED" }) })
    const employeeId = employee[0]?.id
    if (!employeeId || !locations[0]?.id) throw new Error("Initial organisation records were not created.")
    stage = "Clerk invitation creation"
    await clerk.organizations.createOrganizationInvitation({ organizationId: clerkOrganisationId, emailAddress: adminEmail, role: "org:admin", redirectUrl: new URL("/sign-up", request.url).toString() })
    stage = "membership database creation"
    await supabaseRestRequest("organisation_memberships", { method: "POST", serviceRole: true, headers: { Prefer: "return=minimal" }, body: JSON.stringify({ organisation_id: organisationId, employee_id: employeeId, role: "ADMIN", location_ids: [locations[0].id], active: true }) })
    return NextResponse.json({ organisationId }, { status: 201 })
  } catch (error) {
    console.error("[admin/organisations] Create failed:", {
      stage,
      name: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : "unknown error",
      status: typeof error === "object" && error !== null && "status" in error ? error.status : undefined,
    })
    if (clerkOrganisationId) { try { await (await clerkClient()).organizations.deleteOrganization(clerkOrganisationId) } catch { /* preserve the original failure */ } }
    const message = error instanceof Error ? error.message : ""
    const status = message === "UNAUTHORISED" ? 401 : message === "FORBIDDEN" ? 403 : 500
    return NextResponse.json({ error: status === 500 ? "Could not create the organisation." : status === 401 ? "Unauthorised" : "You do not have permission to create organisations." }, { status })
  }
}
