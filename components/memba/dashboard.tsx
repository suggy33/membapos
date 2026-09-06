"use client"

import { ArrowRight, ArrowRightLeft, Building2, PackageSearch, Plus, ReceiptText, RotateCcw, Store, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMemba } from "@/components/memba-provider"
import type { Organization } from "@/lib/memba/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-xl border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </article>
  )
}

function OrganizationRow({ organization }: { organization: Organization }) {
  const { data } = useMemba()
  const locations = data.locations.filter((item) => item.organizationId === organization.id)

  return (
    <tr className="border-b last:border-0">
      <td className="py-4 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary"><Building2 className="size-4" aria-hidden="true" /></span>
          <div><p className="font-medium">{organization.name}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{organization.code}</p></div>
        </div>
      </td>
      <td className="px-3 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", organization.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{organization.status === "ACTIVE" ? "Active" : "Trial"}</span></td>
      <td className="px-3 py-4 text-sm text-muted-foreground">{locations.length} locations</td>
      <td className="px-3 py-4 text-sm text-muted-foreground">{organization.memberIds.length} people</td>
      <td className="px-3 py-4 text-right font-mono text-sm tabular-nums">{currency.format(organization.salesTodayCents / 100)}</td>
      <td className="py-4 pl-3 pr-4 text-right"><Button variant="ghost" size="icon" aria-label={`Open ${organization.name}`}><ArrowRight className="size-4" aria-hidden="true" /></Button></td>
    </tr>
  )
}

export function Dashboard() {
  const { data, hydrated, membership, organization, resetDemo, user } = useMemba()
  const scopedOrganizations = organization ? [organization] : data.organizations
  const totalSales = scopedOrganizations.reduce((sum, item) => sum + item.salesTodayCents, 0)
  const totalOrders = scopedOrganizations.reduce((sum, item) => sum + item.orderCountToday, 0)
  const totalInventory = scopedOrganizations.reduce((sum, item) => sum + item.inventoryCount, 0)
  const title = membership.role === "SUPER_ADMIN" && !organization ? "Platform overview" : `${organization?.name ?? "Your store"} overview`
  const quickActions = [{ label: membership.role === "SUPER_ADMIN" ? "Add organization" : "Start a sale", description: membership.role === "SUPER_ADMIN" ? "Set up a new retail business" : "Create an order in under a minute", icon: membership.role === "SUPER_ADMIN" ? Building2 : Plus, href: membership.role === "SUPER_ADMIN" ? "/organizations/new" : "/sales/new", primary: true }, { label: "Open or close day", description: "Open the till and reconcile cash", icon: ReceiptText, href: "/reports" }, { label: "Find inventory", description: "Search every location", icon: PackageSearch, href: "/inventory" }, ...(membership.role === "SUPER_ADMIN" || membership.role === "ADMIN" || membership.role === "STORE_MANAGER" ? [{ label: "Review transfers", description: "Approve, dispatch or receive", icon: ArrowRightLeft, href: "/transfers" }] : []), ...(membership.role === "SUPER_ADMIN" || membership.role === "ADMIN" ? [{ label: "Manage people", description: "Roles, locations and access", icon: Users, href: organization ? `/organizations/${organization.id}/people` : "/organizations" }] : [])]

  if (!hydrated) return <DashboardSkeleton />

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <section className="rounded-2xl bg-brand-bg p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Good morning, {user.name.split(" ")[0]}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">See what is moving across the business and act on what needs attention.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetDemo}><RotateCcw className="size-4" aria-hidden="true" />Reset demo</Button>
            {membership.role === "SUPER_ADMIN" ? <Link href="/organizations/new" className={buttonVariants()}><Plus className="size-4" aria-hidden="true" />New organization</Link> : <Link href="/sales/new" className={buttonVariants()}><Plus className="size-4" aria-hidden="true" />New sale</Link>}
          </div>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="quick-actions-title">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">At a glance</p><h2 id="quick-actions-title" className="mt-1 text-lg font-semibold">Quick actions</h2></div><p className="hidden text-xs text-muted-foreground sm:block">Common tasks, one tap away</p></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => <Link key={item.label} href={item.href} className={cn("group flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", item.primary ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-card hover:border-primary/40 hover:bg-secondary/35")}>
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", item.primary ? "bg-primary-foreground/15" : "bg-secondary group-hover:bg-primary/10")}><item.icon className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className={cn("mt-1 block text-xs leading-5", item.primary ? "text-primary-foreground/75" : "text-muted-foreground")}>{item.description}</span></span><ArrowRight className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5", item.primary ? "text-primary-foreground/70" : "text-muted-foreground")} aria-hidden="true" />
          </Link>)}
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business summary">
        <MetricCard label="Sales today" value={currency.format(totalSales / 100)} note={`${totalOrders} completed orders`} />
        <MetricCard label="Orders today" value={String(totalOrders)} note="Across active stores" />
        <MetricCard label="Inventory" value={totalInventory.toLocaleString("en-AU")} note="Available and reserved items" />
        <MetricCard label={organization ? "Locations" : "Organizations"} value={String(organization ? organization.locationIds.length : data.organizations.length)} note={organization ? "Stores and warehouses" : "1 trial needs attention"} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.8fr)]">
        <section id="organizations" className="min-w-0 rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">{membership.role === "SUPER_ADMIN" ? "Organizations" : "Locations"}</h2><p className="mt-1 text-xs text-muted-foreground">Current operational summary</p></div><Button variant="ghost" size="sm">View all <ArrowRight className="size-4" aria-hidden="true" /></Button></div>
          {membership.role === "SUPER_ADMIN" ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b bg-muted/30 text-xs text-muted-foreground"><th className="px-4 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Locations</th><th className="px-3 py-3 font-medium">People</th><th className="px-3 py-3 text-right font-medium">Today</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{scopedOrganizations.map((item) => <OrganizationRow key={item.id} organization={item} />)}</tbody></table></div>
          ) : (
            <div className="divide-y">{data.locations.filter((item) => item.organizationId === organization?.id).map((location) => <div key={location.id} className="flex items-center gap-3 px-5 py-4"><span className="grid size-10 place-items-center rounded-lg bg-secondary"><Store className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{location.name}</p><p className="mt-1 text-xs text-muted-foreground">{location.suburb}, {location.state} · {location.type === "STORE" ? "Store" : "Warehouse"}</p></div><span className="font-mono text-xs text-muted-foreground">{location.code}</span></div>)}</div>
          )}
        </section>

        <aside className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4"><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">Latest changes in scope</p></div>
          <div className="divide-y">
            {data.activity.filter((item) => !organization || item.organizationId === organization.id).slice(0, 5).map((item) => {
              const Icon = item.kind === "SALE" ? ReceiptText : item.kind === "TRANSFER" ? ArrowRightLeft : item.kind === "ORGANIZATION" ? Building2 : PackageSearch
              return <div key={item.id} className="flex gap-3 px-5 py-4"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-sm font-medium leading-5">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{item.timestamp}</p></div></div>
            })}
          </div>
        </aside>
      </div>

    </div>
  )
}

function DashboardSkeleton() {
  return <div className="mx-auto max-w-[1440px] animate-pulse space-y-6 px-4 py-8 md:px-6 lg:px-8"><div className="h-44 rounded-2xl bg-muted" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 rounded-xl bg-muted" />)}</div><div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]"><div className="h-96 rounded-xl bg-muted" /><div className="h-96 rounded-xl bg-muted" /></div><span className="sr-only">Loading dashboard</span></div>
}
