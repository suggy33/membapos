"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowRightLeft,
  Building2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Users,
  UserRound,
  X,
} from "lucide-react"

import { useMemba } from "@/components/memba-provider"
import type { Role } from "@/lib/memba/types"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Organizations", href: "/organizations", icon: Building2, roles: ["SUPER_ADMIN"] },
  { label: "New sale", href: "/sales/new", icon: Plus, roles: ["ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Orders", href: "/orders", icon: ShoppingBag, roles: ["ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Customers", href: "/customers", icon: UserRound, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Products", href: "/products", icon: PackageSearch, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Inventory", href: "/inventory", icon: PackageSearch, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Transfers", href: "/transfers", icon: ArrowRightLeft, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"] },
  { label: "Locations", href: "/organizations", icon: Store, roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "People", href: "/organizations", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"] },
  { label: "Reports", href: "/reports", icon: ClipboardList, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "STORE_USER"] },
  { label: "Open / close day", href: "/day", icon: Clock3, roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "STORE_USER"] },
] satisfies Array<{ label: string; href: string; icon: typeof LayoutDashboard; roles: Role[] }>

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Organization admin",
  STORE_MANAGER: "Store manager",
  STORE_USER: "Store user",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const { data, endImpersonation, membership, organization, session, switchOrganization, user } = useMemba()
  const visibleItems = navItems.filter((item) => item.roles.includes(membership.role))
  function search(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const query = searchQuery.trim().toLowerCase(); if (!query) return; const product = data.products.find((item) => item.name.toLowerCase().includes(query) || item.designNumber.toLowerCase().includes(query)); const variant = data.variants.find((item) => item.sku.toLowerCase().includes(query) || item.barcode.toLowerCase().includes(query)); const order = data.orders.find((item) => item.orderNumber.toLowerCase().includes(query)); const customer = data.customers.find((item) => `${item.firstName} ${item.lastName}`.toLowerCase().includes(query) || item.email.toLowerCase().includes(query) || item.phone.includes(query)); router.push(order ? `/orders/${order.id}` : customer ? "/customers" : product || variant ? "/inventory" : "/inventory"); setSearchQuery("") }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4" href="#main-content">
        Skip to content
      </a>

      {session.impersonationActorUserId && (
        <div className="fixed inset-x-0 top-0 z-40 flex min-h-10 items-center justify-center border-b border-amber-500/20 bg-amber-50 px-12 py-2 text-center text-xs font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          <span className="flex items-center gap-3">
            Impersonating {user.name} · {session.impersonationReason}
            <button type="button" onClick={endImpersonation} className="rounded underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-amber-900">Exit</button>
          </span>
        </div>
      )}

      <header className={cn("fixed inset-x-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:pl-[17rem] md:pr-6", session.impersonationActorUserId ? "top-10" : "top-0")}>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <form onSubmit={search} className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border bg-card px-3 text-left text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring md:max-w-xl">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" placeholder="Search products, orders, customers…" aria-label="Search products, orders, customers" />
          <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] sm:inline">⌘ K</kbd>
        </form>
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <div className="text-right">
            <p className="text-sm font-medium leading-4">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{roleLabels[membership.role]}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{user.initials}</span>
        </div>
      </header>

      {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-foreground/30 md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={cn("fixed bottom-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 motion-reduce:transition-none md:translate-x-0", session.impersonationActorUserId ? "top-10" : "top-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/dashboard" className="flex min-h-10 items-center rounded-md focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <Image src="/logo.svg" alt="Memba" width={151} height={32} className="h-8 w-auto" priority />
          </Link>
          <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b p-3">
          {membership.role === "SUPER_ADMIN" && (
            <div className="mt-3">
              <label className="mb-1.5 block px-1 text-xs font-medium text-muted-foreground" htmlFor="organization">Organization view</label>
              <select id="organization" value={organization?.id ?? "platform"} onChange={(event) => switchOrganization(event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring">
                <option value="platform">All organizations</option>
                {data.organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const href = item.label === "Locations" && organization ? `/organizations/${organization.id}/locations` : item.label === "People" && organization ? `/organizations/${organization.id}/people` : item.href
              const isActive = item.label === "Locations" || item.label === "People" ? Boolean(organization) && (pathname === href || pathname.startsWith(`${href}/`)) : href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`)
              return (
              <li key={item.label}>
                <Link href={href} onClick={() => setMobileOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-sidebar-ring", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className="size-4" aria-hidden="true" />{item.label}
                </Link>
              </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t p-3">
          <Link href="/settings" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <Settings className="size-4" aria-hidden="true" />Settings
          </Link>
        </div>
      </aside>

      <main id="main-content" className={cn("md:pl-64", session.impersonationActorUserId ? "pt-[6.5rem]" : "pt-16")}>
        {children}
      </main>
    </div>
  )
}
