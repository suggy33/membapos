"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useMemba } from "@/components/memba-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EditProductPage({ productId }: { productId: string }) {
  const router = useRouter(); const { data, membership, organization, updateProduct } = useMemba(); const product = data.products.find((item) => item.id === productId); const [error, setError] = useState<string | null>(null)
  if (!product || (membership.role !== "SUPER_ADMIN" && product.organizationId !== organization?.id)) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Product not found</h1><Link href="/products" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>Back to products</Link></div>
  if (!["SUPER_ADMIN", "ADMIN"].includes(membership.role)) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Admin access required</h1><Link href="/products" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>Back to products</Link></div>
  function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const values = new FormData(event.currentTarget); try { updateProduct({ productId, name: String(values.get("name") ?? ""), designNumber: String(values.get("designNumber") ?? ""), category: String(values.get("category") ?? ""), collection: String(values.get("collection") ?? ""), material: String(values.get("material") ?? "") }); router.push("/products") } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update product.") } }
  return <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 lg:px-8 lg:py-8"><Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">Products</Link><h1 className="mt-4 text-3xl font-semibold tracking-tight">Edit product</h1><p className="mt-2 text-sm text-muted-foreground">Update the product family details. Existing variant SKUs remain stable.</p><form onSubmit={save} className="mt-8 space-y-5 rounded-xl border bg-card p-5 md:p-7"><Field name="name" label="Product name" defaultValue={product.name} /><Field name="designNumber" label="Design ID" defaultValue={product.designNumber} /><Field name="category" label="Category" defaultValue={product.category} /><Field name="collection" label="Collection" defaultValue={product.collection} /><Field name="material" label="Material" defaultValue={product.material} />{error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-3 border-t pt-5"><Link href="/products" className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>Cancel</Link><button type="submit" className={cn(buttonVariants(), "min-h-11")}>Save product</button></div></form></div>
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) { return <label className="block space-y-1.5"><span className="text-sm font-medium">{label} <span className="text-destructive">*</span></span><input name={name} defaultValue={defaultValue} required className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring" /></label> }
