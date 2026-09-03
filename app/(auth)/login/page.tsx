import { LoginForm } from "@/components/memba/login-form"

export default function LoginPage() {
  return <div className="mx-auto grid max-w-5xl gap-12 py-12 md:py-20 lg:grid-cols-[1fr_420px] lg:items-center"><div className="hidden lg:block"><p className="text-sm font-medium text-primary">Invite-only retail operations</p><h1 className="mt-4 max-w-lg text-5xl font-semibold tracking-[-0.04em]">A clearer way to run every location.</h1><p className="mt-5 max-w-md leading-7 text-muted-foreground">Sign in to manage sales, stock, transfers and your team. Your organisation administrator sends the invitation when it’s time to join.</p><div className="mt-8 flex gap-3 text-sm text-muted-foreground"><span>Secure access</span><span aria-hidden="true">·</span><span>Multi-store ready</span><span aria-hidden="true">·</span><span>Built for teams</span></div></div><LoginForm /></div>
}
