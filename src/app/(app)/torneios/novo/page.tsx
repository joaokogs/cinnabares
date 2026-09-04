import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/users/account"
import { TournamentForm } from "../_components/tournament-form"

export const metadata: Metadata = { title: "Novo torneio" }

export default async function NewTournamentPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?redirect=/torneios/novo")
  const role = await getUserRole(session.user.id)
  if (role !== "admin") redirect("/torneios")

  return <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:py-16"><div className="mx-auto w-full max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Administração</p><h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Novo torneio</h1><p className="mt-3 mb-8 leading-7 text-muted-foreground">Configure a chave, os tiers e o nível de informação exigido na inscrição.</p><TournamentForm /></div></main>
}
