import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { NextRequest, NextResponse } from "next/server"

import { supabaseRestRequest } from "@/lib/supabase/rest"

type ClerkOrganisation = { id: string; name: string; slug?: string | null }
type ClerkUserSummary = { user_id: string; first_name?: string | null; last_name?: string | null }

function displayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim()
}

function organisationCode(organisation: ClerkOrganisation) {
  const source = organisation.slug || organisation.name
  const code = source.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12).toUpperCase()
  return code || `ORG${organisation.id.slice(-8).toUpperCase()}`
}

async function syncUser(data: { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string | null; last_name?: string | null; }) {
  const firstName = data.first_name ?? ""
  const lastName = data.last_name ?? ""
  const email = data.email_addresses[0]?.email_address ?? ""
  await supabaseRestRequest("employees?on_conflict=clerk_user_id", {
    method: "POST",
    serviceRole: true,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      clerk_user_id: data.id,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName(firstName, lastName) || email,
      status: "ACTIVE",
    }),
  })
}

async function ensureOrganisation(data: ClerkOrganisation) {
  const code = organisationCode(data)
  const existing = await supabaseRestRequest<Array<{ id: string }>>(
    `organisations?select=id&or=(clerk_organisation_id.eq.${encodeURIComponent(data.id)},code.eq.${encodeURIComponent(code)})&limit=1`,
    { serviceRole: true },
  )

  if (existing[0]) {
    await supabaseRestRequest(`organisations?id=eq.${existing[0].id}`, {
      method: "PATCH",
      serviceRole: true,
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ clerk_organisation_id: data.id, name: data.name }),
    })
    return existing[0].id
  }

  const created = await supabaseRestRequest<Array<{ id: string }>>("organisations", {
    method: "POST",
    serviceRole: true,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ clerk_organisation_id: data.id, name: data.name, code, status: "ACTIVE" }),
  })
  return created[0]?.id
}

async function syncMembership(data: {
  id: string
  organization: ClerkOrganisation
  public_user_data: ClerkUserSummary
  role: string
}) {
  const organisationId = await ensureOrganisation(data.organization)
  if (!organisationId) return

  const employee = await supabaseRestRequest<Array<{ id: string }>>(
    `employees?select=id&clerk_user_id=eq.${encodeURIComponent(data.public_user_data.user_id)}&limit=1`,
    { serviceRole: true },
  )
  if (!employee[0]) return

  const role = data.role === "org:admin" ? "ADMIN" : "STORE_USER"
  await supabaseRestRequest("organisation_memberships?on_conflict=clerk_membership_id", {
    method: "POST",
    serviceRole: true,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      clerk_membership_id: data.id,
      organisation_id: organisationId,
      employee_id: employee[0].id,
      role,
      active: true,
    }),
  })
}

export async function POST(request: NextRequest) {
  let event
  try {
    event = await verifyWebhook(request)
  } catch {
    return new NextResponse("Verification failed", { status: 400 })
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      await syncUser(event.data)
    } else if (event.type === "user.deleted") {
      if (event.data.id) {
        await supabaseRestRequest(`employees?clerk_user_id=eq.${encodeURIComponent(event.data.id)}`, {
          method: "PATCH",
          serviceRole: true,
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "INACTIVE" }),
        })
      }
    } else if (event.type === "organization.created" || event.type === "organization.updated") {
      await ensureOrganisation(event.data)
    } else if (event.type === "organizationMembership.created" || event.type === "organizationMembership.updated") {
      await syncMembership(event.data)
    } else if (event.type === "organizationMembership.deleted") {
      await supabaseRestRequest(`organisation_memberships?clerk_membership_id=eq.${encodeURIComponent(event.data.id)}`, {
        method: "PATCH",
        serviceRole: true,
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ active: false }),
      })
    }
  } catch {
    return new NextResponse("Webhook processing failed", { status: 500 })
  }

  return new NextResponse("OK")
}
