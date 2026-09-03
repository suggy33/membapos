import { AppShell } from "@/components/memba/app-shell"
import { LocationManagement } from "@/components/memba/location-management"

export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell><LocationManagement organizationId={id} /></AppShell> }
