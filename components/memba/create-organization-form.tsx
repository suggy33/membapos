"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Building2, Check, Store, UserRound } from "lucide-react"

import { useMemba } from "@/components/memba-provider"
import { buttonVariants } from "@/components/ui/button"
import type { CreateOrganizationInput } from "@/lib/memba/types"
import { cn } from "@/lib/utils"

type FieldErrors = Partial<Record<keyof CreateOrganizationInput | "form", string>>

export function CreateOrganizationForm() {
  const router = useRouter()
  const { createOrganization, membership } = useMemba()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (membership.role !== "SUPER_ADMIN") return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Super admin access required</h1><p className="mt-2 text-sm text-muted-foreground">Only platform super admins can create organizations.</p><Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>Return to dashboard</Link></div>

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input: CreateOrganizationInput = { name: String(form.get("name") ?? ""), code: String(form.get("code") ?? ""), adminName: String(form.get("adminName") ?? ""), adminEmail: String(form.get("adminEmail") ?? ""), locationName: String(form.get("locationName") ?? ""), locationCode: String(form.get("locationCode") ?? ""), locationType: form.get("locationType") === "WAREHOUSE" ? "WAREHOUSE" : "STORE", suburb: String(form.get("suburb") ?? ""), state: String(form.get("state") ?? "VIC"), maxLocations: Number(form.get("maxLocations") ?? 1) }
    const nextErrors = validate(input)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) { formRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus(); return }
    setSubmitting(true)
    try { const result = createOrganization(input); router.push(`/organizations/${result.organizationId}`) }
    catch (error) { setErrors({ form: error instanceof Error ? error.message : "Could not create this organization." }); setSubmitting(false) }
  }

  return <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 lg:px-8 lg:py-8"><div><p className="text-sm font-medium text-primary">Platform administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Create organization</h1><p className="mt-2 text-sm text-muted-foreground">Set up the business, its first location, and its organization administrator.</p></div>
    <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
      {errors.form && <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{errors.form}</div>}
      <FormSection icon={Building2} title="Business"><Field id="name" label="Organization name" placeholder="Harbour Home Collective" error={errors.name} autoComplete="organization" /><Field id="code" label="Organization code" placeholder="HHC" error={errors.code} hint="2–6 letters. Used in business identifiers." upper /></FormSection>
      <FormSection icon={Store} title="First location"><div className="grid gap-4 sm:grid-cols-2"><Field id="locationName" label="Location name" placeholder="Richmond Showroom" error={errors.locationName} autoComplete="organization" /><Field id="locationCode" label="Location code" placeholder="RCH" error={errors.locationCode} upper /></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-1.5"><label htmlFor="locationType" className="text-sm font-medium">Location type <span className="text-muted-foreground">(required)</span></label><select id="locationType" name="locationType" className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"><option value="STORE">Store</option><option value="WAREHOUSE">Warehouse</option></select></div><Field id="suburb" label="Suburb" placeholder="Richmond" error={errors.suburb} autoComplete="address-level2" /><div className="space-y-1.5"><label htmlFor="state" className="text-sm font-medium">State <span className="text-muted-foreground">(required)</span></label><select id="state" name="state" className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring">{["VIC","NSW","QLD","SA","WA","TAS","ACT","NT"].map((state) => <option key={state}>{state}</option>)}</select></div></div><Field id="maxLocations" label="Allowed locations" placeholder="5" hint="Super admin controlled limit; the first location counts toward it." type="number" /></FormSection>
      <FormSection icon={UserRound} title="First administrator"><div className="grid gap-4 sm:grid-cols-2"><Field id="adminName" label="Full name" placeholder="Alex Morgan" error={errors.adminName} autoComplete="name" /><Field id="adminEmail" label="Email" placeholder="alex@example.com" error={errors.adminEmail} type="email" autoComplete="email" /></div><p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Check className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />Clerk will send this administrator an invitation once authentication is connected.</p></FormSection>
      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end"><Link href="/organizations" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}>Cancel</Link><button type="submit" disabled={submitting} aria-busy={submitting} className={cn(buttonVariants({ size: "lg" }), "min-h-11")}>{submitting ? "Creating…" : "Create organization"}</button></div>
    </form>
  </div>
}

function FormSection({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) { return <fieldset className="rounded-xl border bg-card p-5 md:p-6"><legend className="sr-only">{title}</legend><div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-secondary"><Icon className="size-4" aria-hidden="true" /></span><h2 className="font-semibold">{title}</h2></div><div className="space-y-4">{children}</div></fieldset> }
function Field({ id, label, placeholder, error, hint, type = "text", autoComplete, upper }: { id: keyof CreateOrganizationInput; label: string; placeholder: string; error?: string; hint?: string; type?: string; autoComplete?: string; upper?: boolean }) { const errorId = `${id}-error`; return <div className="space-y-1.5"><label htmlFor={id} className="text-sm font-medium">{label} <span className="text-muted-foreground">(required)</span></label><input id={id} name={id} type={type} autoComplete={autoComplete} spellCheck={false} placeholder={placeholder} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : hint ? `${id}-hint` : undefined} className={cn("h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring", upper && "font-mono uppercase")} />{hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}{error && <p id={errorId} className="text-xs text-destructive">{error}</p>}</div> }
function validate(input: CreateOrganizationInput): FieldErrors { const errors: FieldErrors = {}; if (input.name.trim().length < 2) errors.name = "Enter the business name."; if (!/^[A-Za-z]{2,6}$/.test(input.code.trim())) errors.code = "Use 2–6 letters."; if (input.locationName.trim().length < 2) errors.locationName = "Enter the first location name."; if (!/^[A-Za-z0-9]{2,6}$/.test(input.locationCode.trim())) errors.locationCode = "Use 2–6 letters or numbers."; if (input.suburb.trim().length < 2) errors.suburb = "Enter the suburb."; if (input.adminName.trim().split(/\s+/).length < 2) errors.adminName = "Enter the administrator’s full name."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.adminEmail.trim())) errors.adminEmail = "Enter a valid email address."; if (!Number.isInteger(input.maxLocations) || input.maxLocations < 1) errors.maxLocations = "Enter at least 1 location."; return errors }
