import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BarChart3, Crown, Settings, Shield, Users } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GuildImage } from "@/components/shared/guild-image"
import { getGuildByTag, getGuildMembers, getGuildRoles, isGuildMember } from "@/lib/guilds/queries"
import { GuildTournamentStats } from "./_components/tournament-stats"
import { GuildMembershipActions } from "./_components/guild-membership-actions"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type GuildPageProps = { params: Promise<{ tag: string }> }

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: GuildPageProps): Promise<Metadata> {
  const { tag } = await params
  const currentGuild = await getGuildByTag(tag)
  return { title: currentGuild?.name ?? "Guilda" }
}

export default async function GuildPage({ params }: GuildPageProps) {
  const { tag } = await params
  const currentGuild = await getGuildByTag(tag)
  if (!currentGuild) notFound()

  const [members, roles, session] = await Promise.all([
    getGuildMembers(currentGuild.id),
    getGuildRoles(currentGuild.id),
    auth.api.getSession({ headers: await headers() }),
  ])
  const imageUrl = currentGuild.image ? `/api/guilds/${currentGuild.id}/image?path=${encodeURIComponent(currentGuild.image)}` : null
  const bannerUrl = currentGuild.banner ? `/api/guilds/${currentGuild.id}/banner?path=${encodeURIComponent(currentGuild.banner)}` : null
  const isFounder = session?.user.id === currentGuild.founderId
  const isMember = session ? await isGuildMember(currentGuild.id, session.user.id) : false

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-6">
        <Link href="/guildas" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ArrowLeft className="size-4" aria-hidden="true" /> Todas as guildas</Link>
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
          <CardContent className="p-0">
            <div className="relative h-48 overflow-hidden bg-accent/10 sm:h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-background/10 to-background" />
              {bannerUrl ? <GuildImage src={bannerUrl} alt={`Banner da guilda ${currentGuild.name}`} width={1200} height={500} className="absolute inset-0 size-full object-cover opacity-70" /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            </div>
            <div className="relative -mt-12 px-5 pb-6 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-accent/15 font-heading text-3xl font-bold text-accent shadow-xl">
                    {imageUrl ? <GuildImage src={imageUrl} alt="" width={96} height={96} className="size-full object-cover" /> : <Shield className="size-9" aria-hidden="true" />}
                  </div>
                  <div className="pb-1">
                    <Badge variant="outline">{currentGuild.tag}</Badge>
                    <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{currentGuild.name}</h1>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline"><Link href={`/estatisticas?format=guild`}><BarChart3 aria-hidden="true" /> Estatísticas</Link></Button>
                  {isFounder ? <Button asChild variant="outline"><Link href={`/guildas/${currentGuild.tag}/admin`}><Settings aria-hidden="true" /> Administrar</Link></Button> : null}
                  <GuildMembershipActions guildId={currentGuild.id} isFounder={isFounder} isMember={isMember} />
                </div>
              </div>
              <p className="mt-6 max-w-3xl leading-7 text-muted-foreground">{currentGuild.description || "Esta guilda ainda não adicionou uma descrição."}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-5 text-accent" aria-hidden="true" /> Membros <Badge variant="secondary">{members.length}</Badge></CardTitle>
              <CardDescription>Players que fazem parte desta guilda.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                member.username ? (
                  <Link key={member.id} href={`/players/${member.username}`} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 p-3 transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent/15 font-heading font-semibold text-accent">
                      {member.image ? (
                        <GuildImage
                          src={`/api/guilds/${currentGuild.id}/members/${member.id}/avatar`}
                          alt={`Avatar de ${member.username ?? member.name}`}
                          width={40}
                          height={40}
                          className="size-full object-cover"
                        />
                      ) : (
                        (member.username ?? member.name).slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0"><p className="truncate font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">@{member.username}</p></div>
                    {member.id === currentGuild.founderId ? <Crown className="ml-auto size-4 shrink-0 text-accent" aria-label="Founder" /> : null}
                  </Link>
                ) : (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 p-3">
                    <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent/15 font-heading font-semibold text-accent">
                      {member.image ? (
                        <GuildImage
                          src={`/api/guilds/${currentGuild.id}/members/${member.id}/avatar`}
                          alt={`Avatar de ${member.username ?? member.name}`}
                          width={40}
                          height={40}
                          className="size-full object-cover"
                        />
                      ) : (
                        member.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0"><p className="truncate font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">@player</p></div>
                    {member.id === currentGuild.founderId ? <Crown className="ml-auto size-4 shrink-0 text-accent" aria-label="Founder" /> : null}
                  </div>
                )
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-5 text-accent" aria-hidden="true" /> Cargos</CardTitle><CardDescription>Estrutura de acesso da guilda.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {roles.map((role) => <div key={role.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/40 px-3 py-2.5"><span className="font-medium">{role.name}</span><span className="size-3 rounded-full" style={{ backgroundColor: role.color }} aria-label={`Cor ${role.color}`} /></div>)}
            </CardContent>
          </Card>
        </div>

        <GuildTournamentStats guildId={currentGuild.id} />
      </div>
    </main>
  )
}
