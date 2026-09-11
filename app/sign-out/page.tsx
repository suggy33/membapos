"use client"

import { useClerk } from "@clerk/nextjs"
import { useEffect } from "react"

export default function SignOutPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    void signOut({ redirectUrl: "/" })
  }, [signOut])

  return <main className="grid min-h-screen place-items-center bg-background p-6 text-sm text-muted-foreground">Signing out…</main>
}
