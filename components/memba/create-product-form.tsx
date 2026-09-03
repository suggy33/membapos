"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Boxes, PackagePlus, Ruler } from "lucide-react"

import { useMemba } from "@/components/memba-provider"
import { buttonVariants } from "@/components/ui/button"
import { createProductSchema } from "@/lib/memba/catalogue-schemas"
import type { CreateProductInput } from "@/lib/memba/types"
import { cn } from "@/lib/utils"

export function CreateProductForm() {
  const router = useRouter(); const { createProduct, data, membership, organization } = useMemba(); const [organizationId, setOrganizationId] = useState(organization?.id ?? (membership.role === "SUPER_ADMIN" ? data.organizations[0]?.id ?? "" : membership.organizationId ?? "")); const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false)
  const locations = data.locations.filter((item) => item.organizationId === organizationId && item.active)
  const canCreate = membership.role === "SUPER_ADMIN" || membership.role === "ADMIN"
  if (!canCreate) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">Your current role cannot add products.</p></div>
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const designNumber = String(values.get("designNumber") ?? "").trim().toUpperCase()
    const lengthCm = Number(values.get("lengthCm"))
    const raw: CreateProductInput = { organizationId, name: String(values.get("name") ?? ""), designNumber, category: String(values.get("category") ?? ""), collection: String(values.get("collection") ?? ""), material: String(values.get("material") ?? ""), sku: `${designNumber}-${lengthCm}`, barcode: String(values.get("barcode") ?? ""), articleNumber: String(values.get("articleNumber") ?? ""), colour: String(values.get("colour") ?? ""), widthCm: Number(values.get("widthCm")), lengthCm, retailPriceCents: Math.round(Number(values.get("retailPrice")) * 100), costPriceCents: Math.round(Number(values.get("costPrice")) * 100), gstApplicable: values.get("gstApplicable") === "on", initialStock: Number(values.get("initialStock")), initialLocationId: String(values.get("initialLocationId") ?? "") }
    const parsed = createProductSchema.safeParse(raw)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => { next[String(issue.path[0])] ??= issue.message })
      setErrors(next)
      const firstField = String(parsed.error.issues[0]?.path[0] ?? "")
      form.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus()
      return
    }
    setErrors({})
    setSubmitting(true)
    try { createProduct(parsed.data); router.push("/products") }
    catch (caught) { setErrors({ form: caught instanceof Error ? caught.message : "Could not create this product." }); setSubmitting(false) }
  }
  return <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 lg:px-8 lg:py-8"><p className="text-sm font-medium text-primary">Catalogue</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">New product</h1><p className="mt-2 text-sm text-muted-foreground">Create the product family, first sellable variant and initial stock.</p><form onSubmit={submit} className="mt-8 space-y-6" noValidate>{errors.form && <p role="alert" className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{errors.form}</p>}{membership.role === "SUPER_ADMIN" && <Section icon={Boxes} title="Organization"><SelectField name="organizationId" label="Organization" value={organizationId} onChange={setOrganizationId} options={data.organizations.map((item) => [item.id,item.name])} /></Section>}<Section icon={PackagePlus} title="Product information"><div className="grid gap-4 sm:grid-cols-2"><Field name="name" label="Product name" placeholder="Persian Heritage" error={errors.name} /><Field name="designNumber" label="Design ID" placeholder="PH302" error={errors.designNumber} mono /><SelectField name="category" label="Category" options={["Persian","Modern","Traditional","Tribal","Shaggy","Runner","Outdoor","Kids","Clearance"].map((item) => [item,item])} error={errors.category} /><Field name="collection" label="Collection" placeholder="Heritage" error={errors.collection} /><Field name="material" label="Material" placeholder="Wool" error={errors.material} /></div></Section><Section icon={Ruler} title="First variant"><div className="grid gap-4 sm:grid-cols-2"><Field name="sku" label="SKU (auto-generated)" placeholder="MR266-160" error={errors.sku} mono /><Field name="barcode" label="Barcode" placeholder="9300000012345" error={errors.barcode} mono optional /><Field name="articleNumber" label="Article number" placeholder="300627323" error={errors.articleNumber} mono optional /><Field name="colour" label="Colour" placeholder="Red" error={errors.colour} /><div className="grid grid-cols-2 gap-3"><Field name="widthCm" label="Width cm" placeholder="200" error={errors.widthCm} inputMode="numeric" /><Field name="lengthCm" label="Length cm" placeholder="300" error={errors.lengthCm} inputMode="numeric" /></div><Field name="costPrice" label="Cost price" placeholder="720.00" error={errors.costPriceCents} inputMode="decimal" /><Field name="retailPrice" label="Retail price" placeholder="1499.00" error={errors.retailPriceCents} inputMode="decimal" /></div><label className="flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm"><input type="checkbox" name="gstApplicable" defaultChecked className="size-4 accent-primary" />GST applies</label></Section><Section icon={Boxes} title="Initial stock"><div className="grid gap-4 sm:grid-cols-2"><SelectField name="initialLocationId" label="Location" options={locations.map((item) => [item.id,item.name])} error={errors.initialLocationId} /><Field name="initialStock" label="Quantity" placeholder="1" error={errors.initialStock} inputMode="numeric" /></div></Section><div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end"><Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}>Cancel</Link><button disabled={submitting} aria-busy={submitting} className={cn(buttonVariants({ size: "lg" }), "min-h-11")}>{submitting ? "Creating…" : "Create product"}</button></div></form></div>
}
function Section({ icon: Icon, title, children }: { icon: typeof Boxes; title: string; children: React.ReactNode }) { return <fieldset className="rounded-xl border bg-card p-5 md:p-6"><legend className="sr-only">{title}</legend><div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-secondary"><Icon className="size-4" aria-hidden="true" /></span><h2 className="font-semibold">{title}</h2></div><div className="space-y-4">{children}</div></fieldset> }
function Field({ name, label, placeholder, error, mono, optional, inputMode }: { name: string; label: string; placeholder: string; error?: string; mono?: boolean; optional?: boolean; inputMode?: "numeric"|"decimal" }) { return <div className="space-y-1.5"><label htmlFor={name} className="text-sm font-medium">{label} <span className="text-muted-foreground">({optional ? "optional" : "required"})</span></label><input id={name} name={name} inputMode={inputMode} placeholder={placeholder} spellCheck={false} aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined} className={cn("h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring", mono && "font-mono uppercase")} />{error && <p id={`${name}-error`} className="text-xs text-destructive">{error}</p>}</div> }
function SelectField({ name, label, options, error, value, onChange }: { name: string; label: string; options: string[][]; error?: string; value?: string; onChange?: (value:string)=>void }) { return <div className="space-y-1.5"><label htmlFor={name} className="text-sm font-medium">{label} <span className="text-muted-foreground">(required)</span></label><select id={name} name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} aria-invalid={error ? true : undefined} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"><option value="">Select</option>{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select>{error && <p className="text-xs text-destructive">{error}</p>}</div> }
