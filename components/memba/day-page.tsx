"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Unlock,
} from "lucide-react"

import { useMemba } from "@/components/memba-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
})

export function DayPage() {
  const { data, endDay, membership, openDay, organization, user } = useMemba()
  const organizationId =
    organization?.id ??
    (membership.role === "SUPER_ADMIN"
      ? data.organizations[0]?.id
      : membership.organizationId)
  const today = new Date().toISOString().slice(0, 10)
  const register = data.dailyRegisters.find(
    (item) =>
      item.organizationId === organizationId && item.businessDate === today
  )
  const openedLocation = data.locations.find(
    (item) => item.id === register?.locationId
  )
  const locations = data.locations.filter(
    (item) =>
      item.organizationId === organizationId &&
      item.active &&
      (membership.role === "SUPER_ADMIN" ||
        membership.role === "ADMIN" ||
        membership.locationIds.includes(item.id))
  )
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "")
  const [countedCash, setCountedCash] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const cashSales = data.orders
    .filter(
      (order) =>
        order.organizationId === organizationId &&
        order.paymentMethod === "CASH" &&
        order.createdAt.slice(0, 10) === today
    )
    .reduce((sum, order) => sum + order.totalCents, 0)
  function open() {
    setError(null)
    setSuccess(null)
    if (!organizationId || !locationId)
      return setError("Choose the location opening the store day.")
    if (
      !window.confirm(
        "Open the storewide day for this organisation? All team members will be able to start sales."
      )
    )
      return
    try {
      openDay(organizationId, locationId)
      setSuccess(
        "Store day opened. The open state is now shared with the whole team."
      )
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not open the day."
      )
    }
  }
  function close() {
    setError(null)
    setSuccess(null)
    if (!register) return
    if (
      !window.confirm(
        "Close the storewide day? New sales will be blocked until the next day is opened."
      )
    )
      return
    try {
      endDay(register.id, Math.round(Number(countedCash || 0) * 100), notes)
      setSuccess("Store day closed and cash reconciliation recorded.")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not close the day."
      )
    }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <Link
        href="/dashboard"
        className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>
      <div className="mt-5">
        <p className="text-sm font-medium text-primary">
          {organization?.name ?? "Store operations"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Open or close day
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The trading-day state is shared across every team member in this
          organisation.
        </p>
      </div>
      <section className="mt-8 rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span
            className={cn(
              "grid size-14 shrink-0 place-items-center rounded-2xl",
              register?.status === "OPEN"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {register?.status === "OPEN" ? (
              <Unlock className="size-7" aria-hidden="true" />
            ) : (
              <LockKeyhole className="size-7" aria-hidden="true" />
            )}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">
                {register?.status === "OPEN" ? "Day is open" : "Day is closed"}
              </h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  register?.status === "OPEN"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {register?.status ?? "NOT OPEN"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {register?.status === "OPEN"
                ? `Opened by ${data.users.find((item) => item.id === register.openedByUserId)?.name ?? "team member"} at ${new Date(register.openedAt).toLocaleTimeString("en-AU")}.`
                : "No sales can be initiated until a team member opens the store day."}
            </p>
            {openedLocation && (
              <p className="mt-1 text-xs text-muted-foreground">
                Opened from {openedLocation.name}; the state applies storewide.
              </p>
            )}
          </div>
        </div>
        {register?.status === "OPEN" ? (
          <div className="mt-7 border-t pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">
                  Expected cash sales
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold">
                  {money.format(cashSales / 100)}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Opened today</p>
                <p className="mt-2 font-mono text-2xl font-semibold">
                  {new Date(register.openedAt).toLocaleTimeString("en-AU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Counted cash</span>
                <input
                  value={countedCash}
                  onChange={(event) => setCountedCash(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-11 w-full rounded-md border bg-background px-3 font-mono text-sm focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">
                  Close notes{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </span>
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Explain a variance"
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={close}
              className={cn(
                buttonVariants({ variant: "destructive", size: "lg" }),
                "mt-5 min-h-11"
              )}
            >
              <LockKeyhole className="size-4" aria-hidden="true" />
              Close store day
            </button>
          </div>
        ) : (
          <div className="mt-7 border-t pt-6">
            <label className="block max-w-md space-y-1.5">
              <span className="text-sm font-medium">Opening location</span>
              <select
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                {locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={open}
              className={cn(buttonVariants({ size: "lg" }), "mt-5 min-h-11")}
            >
              <Unlock className="size-4" aria-hidden="true" />
              Open store day
            </button>
          </div>
        )}
        {(error || success) && (
          <p
            role={error ? "alert" : "status"}
            className={cn(
              "mt-5 rounded-lg px-4 py-3 text-sm",
              error
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            )}
          >
            {error ?? success}
          </p>
        )}
      </section>
      <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" aria-hidden="true" />
        {user.name} · Storewide state persists in local development.
      </p>
      {register?.status === "CLOSED" && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
          <CheckCircle2
            className="mt-0.5 size-4 text-emerald-700 dark:text-emerald-300"
            aria-hidden="true"
          />
          <p>
            Closed at{" "}
            {register.closedAt
              ? new Date(register.closedAt).toLocaleTimeString("en-AU")
              : "today"}
            . Variance: {money.format((register.varianceCents ?? 0) / 100)}.
          </p>
        </div>
      )}
    </div>
  )
}
