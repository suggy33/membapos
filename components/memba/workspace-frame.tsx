"use client"

import { usePathname } from "next/navigation"

import { AppShell } from "@/components/memba/app-shell"

function isPublicPath(pathname: string) {
  return pathname === "/" || pathname === "/login" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/sign-out")
}

export function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  return isPublicPath(usePathname()) ? children : <AppShell>{children}</AppShell>
}
