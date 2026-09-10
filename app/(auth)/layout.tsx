import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Sign in · Memba",
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-svh bg-brand-bg px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/logo.svg"
            alt="Memba"
            width={151}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
        {children}
      </div>
    </main>
  )
}
