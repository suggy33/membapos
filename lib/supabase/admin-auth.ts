import { auth } from "@clerk/nextjs/server"

import { supabaseRestRequest } from "@/lib/supabase/rest"

type Membership = { organisation_id: string | null; role: "SUPER_ADMIN" | "ADMIN" | "STORE_MANAGER" | "STORE_USER"; active: boolean }

export async function requireOrganisationAdmin(organisationId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("UNAUTHORISED")

  const employees = await supabaseRestRequest<Array<{ id: string; status: string }>>(
    `employees?select=id,status&clerk_user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { serviceRole: true },
  )
  const employee = employees[0]
  if (!employee || employee.status !== "ACTIVE") throw new Error("FORBIDDEN")

  const memberships = await supabaseRestRequest<Membership[]>(
    `organisation_memberships?select=organisation_id,role,active&employee_id=eq.${employee.id}&active=eq.true`,
    { serviceRole: true },
  )
  const allowed = memberships.some((membership) => membership.role === "SUPER_ADMIN" && membership.organisation_id === null)
    || memberships.some((membership) => membership.organisation_id === organisationId && ["SUPER_ADMIN", "ADMIN"].includes(membership.role))
  if (!allowed) throw new Error("FORBIDDEN")

  return { userId, employeeId: employee.id }
}
