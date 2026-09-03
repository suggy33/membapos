import { AppShell } from "@/components/memba/app-shell"
import { OrganizationDetail } from "@/components/memba/organization-detail"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AppShell><OrganizationDetail organizationId={id} /></AppShell>
}
