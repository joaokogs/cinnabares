import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GuildImage } from "@/components/shared/guild-image"
import { auth } from "@/lib/auth"
import { getGuildByTag } from "@/lib/guilds/queries"
import { JoinGuildButton } from "./_components/join-guild-button"

type JoinPageProps = {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ token?: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: JoinPageProps): Promise<Metadata> {
  const { tag } = await params
  const guild = await getGuildByTag(tag)
  return { title: guild ? `Entrar em ${guild.name}` : "Entrar na guilda" }
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { tag } = await params
  const { token } = await searchParams

  if (!token) notFound()

  const guild = await getGuildByTag(tag)
  if (!guild) notFound()

  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    const redirectTo = `/login?redirect=${encodeURIComponent(`/guildas/${tag}/join?token=${token}`)}`
    redirect(redirectTo)
  }

  const imageUrl = guild.image
    ? `/api/guilds/${guild.id}/image?path=${encodeURIComponent(guild.image)}`
    : null

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md space-y-6">
        <Link
          href={`/guildas/${tag}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para {guild.name}
        </Link>
        <Card className="border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
          <CardHeader className="items-center justify-items-center gap-3 pb-2 text-center">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl border-2 border-border/50 bg-accent/15 text-accent shadow-lg">
              {imageUrl ? (
                <GuildImage
                  src={imageUrl}
                  alt={guild.name}
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              ) : (
                <Shield className="size-8" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline">{guild.tag}</Badge>
              <h1 className="font-heading text-2xl font-bold tracking-tight">{guild.name}</h1>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              {guild.description || "Esta guilda ainda não adicionou uma descrição."}
            </p>
            <p className="text-sm text-muted-foreground">
              Ao entrar, voce sera adicionado como membro com o cargo padrao <strong>Member</strong>.
            </p>
            <JoinGuildButton tag={tag} token={token} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
