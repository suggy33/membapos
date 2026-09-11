import { OrderDetail } from "@/components/memba/order-detail"

export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <OrderDetail orderId={id} /> }
