import { AppShell } from "@/components/memba/app-shell"
import { OrderDetail } from "@/components/memba/order-detail"

export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell><OrderDetail orderId={id} /></AppShell> }
