import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { auth } from "@/lib/auth"
import { getGuildByTag, getGuildRoles } from "@/lib/guilds/queries"
import { GuildAdminPanel } from "../../_components/guild-admin-panel"
import { InvitePanel } from "./_components/invite-panel"

type GuildAdminPageProps = { params: Promise<{ tag: string }> }

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: GuildAdminPageProps): Promise<Metadata> {
  const { tag } = await params
  const currentGuild = await getGuildByTag(tag)
  return { title: currentGuild ? `Administrar ${currentGuild.name}` : "Administrar guilda" }
}

export default async function GuildAdminPage({ params }: GuildAdminPageProps) {
  const { tag } = await params
  const currentGuild = await getGuildByTag(tag)
  if (!currentGuild) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")
  if (session.user.id !== currentGuild.founderId) redirect(`/guildas/${currentGuild.tag}`)

  const roles = await getGuildRoles(currentGuild.id)
  const imageUrl = currentGuild.image ? `/api/guilds/${currentGuild.id}/image?path=${encodeURIComponent(currentGuild.image)}` : null
  const bannerUrl = currentGuild.banner ? `/api/guilds/${currentGuild.id}/banner?path=${encodeURIComponent(currentGuild.banner)}` : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-7">
        <Link href={`/guildas/${currentGuild.tag}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar para a guilda</Link>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Painel do fundador</p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Administrar {currentGuild.name}</h1>
          <p className="mt-3 leading-7 text-muted-foreground">Edite as informacoes publicas e prepare a estrutura de cargos.</p>
        </div>
        <GuildAdminPanel
          guild={{ id: currentGuild.id, name: currentGuild.name, tag: currentGuild.tag, description: currentGuild.description, imageUrl, bannerUrl }}
          initialRoles={roles}
        />
        <InvitePanel guildId={currentGuild.id} />
      </div>
    </main>
  )
}
