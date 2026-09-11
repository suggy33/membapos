import { EditProductPage } from "@/components/memba/edit-product-page"
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <EditProductPage productId={id} /> }
