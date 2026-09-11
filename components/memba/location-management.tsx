"use client"

import { useState } from "react"
import { MapPin, Plus, Store, Warehouse } from "lucide-react"

import { useMemba } from "@/components/memba-provider"
import { buttonVariants } from "@/components/ui/button"
import type { CreateLocationInput } from "@/lib/memba/types"
import { cn } from "@/lib/utils"

export function LocationManagement({ organizationId }: { organizationId: string }) {
  const { data, membership } = useMemba()
  const organization = data.organizations.find((item) => item.id === organizationId)
  const locations = data.locations.filter((item) => item.organizationId === organizationId)
  const canManage = membership.role === "SUPER_ADMIN" || (membership.role === "ADMIN" && membership.organizationId === organizationId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!organization || !canManage) return <PageState title="Location management unavailable" description="The organization does not exist or your current role cannot manage it." />
  const atLimit = locations.filter((item) => item.active).length >= organization.maxLocations

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSuccess(null)
    const form = event.currentTarget; const values = new FormData(form)
    const input: CreateLocationInput = { organizationId, name: String(values.get("name") ?? ""), code: String(values.get("code") ?? ""), type: values.get("type") === "WAREHOUSE" ? "WAREHOUSE" : "STORE", suburb: String(values.get("suburb") ?? ""), state: String(values.get("state") ?? "VIC") }
    if (input.name.trim().length < 2) { setError("Enter a location name."); form.querySelector<HTMLInputElement>("[name='name']")?.focus(); return }
    if (!/^[A-Za-z0-9]{2,6}$/.test(input.code.trim())) { setError("Location code must contain 2–6 letters or numbers."); return }
    if (input.suburb.trim().length < 2) { setError("Enter the location suburb."); return }
    try { const response = await fetch(`/api/admin/organisations/${organizationId}/locations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); const result = await response.json().catch(() => null) as { error?: string } | null; if (!response.ok) throw new Error(result?.error ?? "Could not add this location."); form.reset(); setSuccess(`${input.name.trim()} was added.`); window.location.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add this location.") }
  }

  async function toggleLocation(locationId: string, active: boolean) {
    setError(null)
    try { const response = await fetch(`/api/admin/organisations/${organizationId}/locations/${locationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }); const result = await response.json().catch(() => null) as { error?: string } | null; if (!response.ok) throw new Error(result?.error ?? "Could not update this location."); window.location.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update this location.") }
  }

  return <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8"><div><p className="text-sm font-medium text-primary">{organization.name}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Locations</h1><p className="mt-2 text-sm text-muted-foreground">Manage stores and warehouses without removing their transaction history.</p></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.7fr)]"><section className="rounded-xl border bg-card"><div className="border-b px-5 py-4"><h2 className="font-semibold">All locations</h2><p className="mt-1 text-xs text-muted-foreground">{locations.filter((item) => item.active).length} active of {organization.maxLocations} allowed</p></div><div className="divide-y">{locations.map((location) => { const Icon = location.type === "STORE" ? Store : Warehouse; return <article key={location.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{location.name}</h3><span className={cn("rounded-full px-2 py-0.5 text-xs", location.active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{location.active ? "Active" : "Archived"}</span></div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden="true" />{location.suburb}, {location.state} · <span className="font-mono">{location.code}</span></p></div><button type="button" onClick={() => void toggleLocation(location.id, !location.active)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}>{location.active ? "Archive" : "Reactivate"}</button></article> })}</div></section>
      <aside className="rounded-xl border bg-card p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-secondary"><Plus className="size-4" aria-hidden="true" /></span><div><h2 className="font-semibold">Add location</h2><p className="mt-1 text-xs text-muted-foreground">Create a store or warehouse.</p></div></div><form onSubmit={submit} className="mt-5 space-y-4" noValidate><Input name="name" label="Location name" placeholder="Carlton Showroom" /><div className="grid grid-cols-2 gap-3"><Input name="code" label="Code" placeholder="CAR" mono /><Select name="type" label="Type" options={["STORE","WAREHOUSE"]} /></div><div className="grid grid-cols-2 gap-3"><Input name="suburb" label="Suburb" placeholder="Carlton" /><Select name="state" label="State" options={["VIC","NSW","QLD","SA","WA","TAS","ACT","NT"]} /></div>{atLimit && <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">This organisation is at its location limit. Ask a super admin to increase it.</p>}{error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}{success && <p role="status" className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{success}</p>}<button type="submit" disabled={atLimit} className={cn(buttonVariants(), "min-h-10 w-full")}>Add location</button></form></aside></div>
  </div>
}

function Input({ name, label, placeholder, mono }: { name: string; label: string; placeholder: string; mono?: boolean }) { return <div className="space-y-1.5"><label htmlFor={name} className="text-sm font-medium">{label} <span className="text-muted-foreground">(required)</span></label><input id={name} name={name} placeholder={placeholder} spellCheck={false} className={cn("h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring", mono && "font-mono uppercase")} /></div> }
function Select({ name, label, options }: { name: string; label: string; options: string[] }) { return <div className="space-y-1.5"><label htmlFor={name} className="text-sm font-medium">{label}</label><select id={name} name={name} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring">{options.map((option) => <option key={option} value={option}>{option === "STORE" ? "Store" : option === "WAREHOUSE" ? "Warehouse" : option}</option>)}</select></div> }
function PageState({ title, description }: { title: string; description: string }) { return <div className="mx-auto max-w-xl px-4 py-20 text-center"><Store className="mx-auto size-10 text-muted-foreground" aria-hidden="true" /><h1 className="mt-5 text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div> }
