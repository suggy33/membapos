import { AppShell } from "@/components/memba/app-shell"
import { PeopleManagement } from "@/components/memba/people-management"

export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell><PeopleManagement organizationId={id} /></AppShell> }
