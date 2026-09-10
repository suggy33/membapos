import { AppShell } from "@/components/memba/app-shell"
import { CustomerDetailPage } from "@/components/memba/customer-detail-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell><CustomerDetailPage customerId={id} /></AppShell> }
