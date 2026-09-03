"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, Building2, Search, ShieldCheck, Store, UserRoundCog, Users } from "lucide-react"

import { useMemba } from "@/components/memba-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function OrganizationsPage() {
  const { data, membership, startImpersonation } = useMemba()
  const [query, setQuery] = useState("")
  const [selectedMembershipId, setSelectedMembershipId] = useState("")
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const filtered = useMemo(() => data.organizations.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())), [data.organizations, query])
  const targetMemberships = data.memberships.filter((item) => item.organizationId && item.role !== "SUPER_ADMIN")

  if (membership.role !== "SUPER_ADMIN") {
    return <AccessDenied />
  }

  function handleImpersonation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      startImpersonation(selectedMembershipId, reason)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start impersonation.")
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-primary">Platform administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Organizations</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Manage independent retail businesses, their administrators and platform access.</p></div>
        <Link href="/organizations/new" className={cn(buttonVariants({ size: "lg" }), "min-h-11")}><Building2 className="size-4" aria-hidden="true" />New organization</Link>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.7fr)]">
        <section className="rounded-xl border bg-card">
          <div className="border-b p-4"><label htmlFor="organization-search" className="sr-only">Search organizations</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input id="organization-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or code" className="h-11 w-full rounded-md border bg-background pl-10 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-ring" /></div></div>
          {filtered.length ? <div className="divide-y">{filtered.map((organization) => {
            const locations = data.locations.filter((item) => item.organizationId === organization.id)
            return <article key={organization.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex min-w-0 gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary"><Building2 className="size-5" aria-hidden="true" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold">{organization.name}</h2><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", organization.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{organization.status === "ACTIVE" ? "Active" : "Trial"}</span></div><p className="mt-1 font-mono text-xs text-muted-foreground">{organization.code}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Store className="size-3.5" aria-hidden="true" />{locations.length} locations</span><span className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden="true" />{organization.memberIds.length} people</span></div></div></div><Link href={`/organizations/${organization.id}`} className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}>Manage <ArrowRight className="size-4" aria-hidden="true" /></Link></article>
          })}</div> : <div className="px-6 py-16 text-center"><Building2 className="mx-auto size-9 text-muted-foreground" aria-hidden="true" /><h2 className="mt-4 font-medium">No organizations found</h2><p className="mt-1 text-sm text-muted-foreground">Try another name or organization code.</p><button type="button" onClick={() => setQuery("")} className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>Clear search</button></div>}
        </section>

        <aside className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary"><UserRoundCog className="size-4" aria-hidden="true" /></span><div><h2 className="font-semibold">Impersonate a user</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Enter an audit reason before viewing Memba as an organization user.</p></div></div>
          <form className="mt-5 space-y-4" onSubmit={handleImpersonation}>
            <div className="space-y-1.5"><label htmlFor="target-user" className="text-sm font-medium">User <span className="text-muted-foreground">(required)</span></label><select id="target-user" required value={selectedMembershipId} onChange={(event) => setSelectedMembershipId(event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"><option value="">Select a user</option>{targetMemberships.map((item) => { const person = data.users.find((candidate) => candidate.id === item.userId); const org = data.organizations.find((candidate) => candidate.id === item.organizationId); return <option key={item.id} value={item.id}>{person?.name} · {org?.name}</option> })}</select></div>
            <div className="space-y-1.5"><label htmlFor="impersonation-reason" className="text-sm font-medium">Reason <span className="text-muted-foreground">(required)</span></label><textarea id="impersonation-reason" required minLength={8} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Example: Investigating order MEM-RCH-10432" className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" /><p className="text-xs text-muted-foreground">The user and reason are stored in the audit log.</p></div>
            {message && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>}
            <button type="submit" className={cn(buttonVariants(), "min-h-10 w-full")}><ShieldCheck className="size-4" aria-hidden="true" />Start impersonation</button>
          </form>
        </aside>
      </div>
    </div>
  )
}

function AccessDenied() {
  return <div className="mx-auto max-w-xl px-4 py-20 text-center"><ShieldCheck className="mx-auto size-10 text-muted-foreground" aria-hidden="true" /><h1 className="mt-5 text-2xl font-semibold">Super admin access required</h1><p className="mt-2 text-sm text-muted-foreground">Organization management is restricted to platform super admins.</p><Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>Return to dashboard</Link></div>
}
