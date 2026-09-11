import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseRestRequest } from "@/lib/supabase/rest"

type Employee = {
  id: string
  clerk_user_id: string
  email: string
  display_name: string
  status: "INVITED" | "ACTIVE" | "INACTIVE"
}

type Membership = {
  id: string
  organisation_id: string | null
  employee_id: string
  role: "SUPER_ADMIN" | "ADMIN" | "STORE_MANAGER" | "STORE_USER"
  location_ids: string[]
  active: boolean
}

function inFilter(ids: string[]) {
  return ids.length ? `in.(${ids.join(",")})` : "in.(00000000-0000-0000-0000-000000000000)"
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let stage = "employee lookup"
  try {
    const clerkUser = await currentUser().catch(() => null)

    let employees = await supabaseRestRequest<Employee[]>(
      `employees?select=id,clerk_user_id,email,display_name,status&clerk_user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      { serviceRole: true },
    )

    if (!employees[0] && clerkUser) {
      await supabaseRestRequest("employees?on_conflict=clerk_user_id", {
        method: "POST",
        serviceRole: true,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          clerk_user_id: userId,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
          first_name: clerkUser.firstName ?? "",
          last_name: clerkUser.lastName ?? "",
          display_name: clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? userId,
          status: "ACTIVE",
        }),
      })
      employees = await supabaseRestRequest<Employee[]>(
        `employees?select=id,clerk_user_id,email,display_name,status&clerk_user_id=eq.${encodeURIComponent(userId)}&limit=1`,
        { serviceRole: true },
      )
    }

    const employee = employees[0]
    if (!employee || employee.status !== "ACTIVE") return NextResponse.json({ error: "No active Memba employee record.", code: "NO_ACTIVE_EMPLOYEE" }, { status: 403 })

    stage = "membership lookup"
    const ownMemberships = await supabaseRestRequest<Membership[]>(
      `organisation_memberships?select=*&employee_id=eq.${employee.id}&active=eq.true`,
      { serviceRole: true },
    )
    if (!ownMemberships.length) return NextResponse.json({ error: "This Clerk account has no active Memba membership.", code: "NO_MEMBERSHIP" }, { status: 403 })
    const isPlatformSuperAdmin = ownMemberships.some((membership) => membership.organisation_id === null && membership.role === "SUPER_ADMIN")
    stage = "organisation scope lookup"
    const organisationIds = isPlatformSuperAdmin
      ? (await supabaseRestRequest<Array<{ id: string }>>("organisations?select=id", { serviceRole: true })).map((organisation) => organisation.id)
      : ownMemberships.flatMap((membership) => membership.organisation_id ? [membership.organisation_id] : [])

    stage = "workspace bootstrap"
    const [organisations, locations, memberships] = await Promise.all([
      supabaseRestRequest("organisations?select=*&order=name.asc" + (isPlatformSuperAdmin ? "" : `&id=${inFilter(organisationIds)}`), { serviceRole: true }),
      supabaseRestRequest(`locations?select=*&organisation_id=${inFilter(organisationIds)}&order=name.asc`, { serviceRole: true }),
      supabaseRestRequest<Membership[]>(`organisation_memberships?select=*&organisation_id=${inFilter(organisationIds)}&order=created_at.asc`, { serviceRole: true }),
    ])

    const membershipsForBootstrap = [...new Map([...ownMemberships, ...memberships].map((membership) => [membership.id, membership])).values()]
    const visibleEmployeeIds = [...new Set(membershipsForBootstrap.map((membership) => membership.employee_id).concat(employee.id))]
    stage = "employee bootstrap"
    const visibleEmployees = await supabaseRestRequest<Employee[]>(`employees?select=id,clerk_user_id,email,display_name,status&id=${inFilter(visibleEmployeeIds)}`, { serviceRole: true })
    const employeeById = new Map(visibleEmployees.map((visibleEmployee) => [visibleEmployee.id, visibleEmployee]))
    const membershipsWithEmployees = membershipsForBootstrap.map((membership) => ({ ...membership, employees: employeeById.get(membership.employee_id) ?? null }))

    return NextResponse.json({ organisations, locations, memberships: membershipsWithEmployees })
  } catch (error) {
    console.error(`[organisations] Production bootstrap failed during ${stage}:`, error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Unable to load organisations.", code: "PRODUCTION_BOOTSTRAP_FAILED", stage }, { status: 502 })
  }
}
