import Link from "next/link"

export const metadata = {
  title: "Sign in · Memba",
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-svh bg-brand-bg px-5 py-8 md:px-8 md:py-12"><div className="mx-auto max-w-6xl"><Link href="/" className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-9 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">M</span>Memba</Link>{children}</div></main>
}
