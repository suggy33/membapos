import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { requireOrganisationAdmin } from "@/lib/supabase/admin-auth"
import { supabaseRestRequest } from "@/lib/supabase/rest"

const roles = { ADMIN: "org:admin", STORE_MANAGER: "org:member", STORE_USER: "org:member" } as const

export async function POST(request: Request, { params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params
  try {
    const { userId } = await requireOrganisationAdmin(organisationId)
    const body = await request.json() as { name?: unknown; email?: unknown; role?: unknown; locationIds?: unknown }
    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const role = body.role === "ADMIN" || body.role === "STORE_MANAGER" || body.role === "STORE_USER" ? body.role : "STORE_USER"
    const locationIds = Array.isArray(body.locationIds) ? body.locationIds.map(String) : []
    if (name.split(/\s+/).length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !locationIds.length) return NextResponse.json({ error: "Enter a full name, valid email and at least one location." }, { status: 400 })

    const organisation = await supabaseRestRequest<Array<{ clerk_organisation_id: string | null }>>(`organisations?select=clerk_organisation_id&id=eq.${organisationId}&limit=1`, { serviceRole: true })
    const clerkOrganisationId = organisation[0]?.clerk_organisation_id
    if (!clerkOrganisationId) return NextResponse.json({ error: "This organisation is not linked to a Clerk organisation yet." }, { status: 409 })

    const validLocations = await supabaseRestRequest<Array<{ id: string }>>(`locations?select=id&organisation_id=eq.${organisationId}&active=eq.true&id=in.(${locationIds.join(",")})`, { serviceRole: true })
    if (validLocations.length !== locationIds.length) return NextResponse.json({ error: "Select only active locations in this organisation." }, { status: 400 })
    const existing = await supabaseRestRequest<Array<{ id: string }>>(`employees?select=id&email=eq.${encodeURIComponent(email)}&limit=1`, { serviceRole: true })
    const employeeId = existing[0]?.id ?? (await supabaseRestRequest<Array<{ id: string }>>("employees", { method: "POST", serviceRole: true, headers: { Prefer: "return=representation" }, body: JSON.stringify({ email, display_name: name, status: "INVITED" }) }))[0]?.id
    if (!employeeId) return NextResponse.json({ error: "Could not create the pending employee record." }, { status: 500 })

    const redirectUrl = new URL("/sign-up", request.url).toString()
    const invitation = await (await clerkClient()).organizations.createOrganizationInvitation({ organizationId: clerkOrganisationId, emailAddress: email, role: roles[role], inviterUserId: userId, redirectUrl })
    await supabaseRestRequest("organisation_memberships", { method: "POST", serviceRole: true, headers: { Prefer: "return=minimal" }, body: JSON.stringify({ organisation_id: organisationId, employee_id: employeeId, role, location_ids: locationIds, active: true }) })
    return NextResponse.json({ ok: true, invitationId: invitation.id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    return NextResponse.json({ error: message === "UNAUTHORISED" ? "Unauthorised" : message || "Could not create the invitation." }, { status: message === "UNAUTHORISED" ? 401 : 500 })
  }
}
