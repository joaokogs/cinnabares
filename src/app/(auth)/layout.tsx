import Link from "next/link"
import { Flame } from "lucide-react"

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-lg font-heading text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <Flame className="size-4" aria-hidden="true" />
          </span>
          Cinnabares
        </Link>
        {children}
      </div>
    </main>
  )
}
