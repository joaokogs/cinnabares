import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Crown, Search, Shield, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GuildImage } from "@/components/shared/guild-image"
import { auth } from "@/lib/auth"
import { getUserGuild, getGuildMemberCount } from "@/lib/guilds/queries"

export const metadata: Metadata = {
  title: "Minha guilda",
}

export const dynamic = "force-dynamic"

export default async function MyGuildPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const guildRow = await getUserGuild(session.user.id)

  if (!guildRow) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
        <div className="relative z-10 mx-auto w-full max-w-xl space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Sua guilda</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Nenhuma guilda</h1>
          </div>
          <Card className="border-border/70 bg-card/90">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
                <Shield className="size-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold">Você ainda não pertence a nenhuma guilda</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Explore as guildas disponíveis e entre na que mais combina com você.
                </p>
              </div>
              <Button asChild>
                <Link href="/guildas">
                  <Search className="size-4" aria-hidden="true" />
                  Explorar guildas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const imageUrl = guildRow.guildImage
    ? `/api/guilds/${guildRow.guildId}/image?path=${encodeURIComponent(guildRow.guildImage)}`
    : null
  const bannerUrl = guildRow.guildBanner
    ? `/api/guilds/${guildRow.guildId}/banner?path=${encodeURIComponent(guildRow.guildBanner)}`
    : null

  const memberCount = await getGuildMemberCount(guildRow.guildId)
  const isFounder = guildRow.guildFounderId === session.user.id

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Sua guilda</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{guildRow.guildName}</h1>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
          <CardContent className="p-0">
            <div className="relative h-40 overflow-hidden bg-accent/10 sm:h-56">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-background/10 to-background" />
              {bannerUrl ? (
                <GuildImage
                  src={bannerUrl}
                  alt={`Banner da guilda ${guildRow.guildName}`}
                  width={1200}
                  height={500}
                  className="absolute inset-0 size-full object-cover opacity-70"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            </div>
            <div className="relative -mt-10 px-5 pb-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-accent/15 font-heading text-2xl font-bold text-accent shadow-xl">
                    {imageUrl ? (
                      <GuildImage src={imageUrl} alt="" width={80} height={80} className="size-full object-cover" />
                    ) : (
                      <Shield className="size-8" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pb-1">
                    <Badge variant="outline">{guildRow.guildTag}</Badge>
                    <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{guildRow.guildName}</h2>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/guildas/${guildRow.guildTag}`}>Ver detalhes</Link>
                  </Button>
                  {isFounder ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/guildas/${guildRow.guildTag}/admin`}>
                        <Crown className="size-4" aria-hidden="true" /> Administrar
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-accent" aria-hidden="true" /> Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold">{memberCount}</p>
              <p className="text-xs text-muted-foreground">players na guilda</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Crown className="size-4 text-accent" aria-hidden="true" /> Fundador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{isFounder ? "Você" : "Outro membro"}</p>
              <p className="text-xs text-muted-foreground">{isFounder ? "Você fundou esta guilda" : "Responsável pela guilda"}</p>
            </CardContent>
          </Card>
        </div>

        {guildRow.guildDescription ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{guildRow.guildDescription}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
