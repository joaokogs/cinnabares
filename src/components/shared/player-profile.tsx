import NextImage from "next/image"
import Link from "next/link"
import { Pencil, Shield, Trophy } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { ProfileTabs } from "@/app/(app)/perfil/_components/profile-tabs"
import { GuildImage } from "@/components/shared/guild-image"
import { PlayerTopPokemon } from "@/app/(app)/perfil/_components/player-top-pokemon"
import { PlayerTournamentStats } from "@/app/(app)/perfil/_components/tournament-stats"
import type { getUserGuild } from "@/lib/guilds/queries"
import { computePoints } from "@/lib/tournaments/points"
import { getPlayerStats } from "@/lib/tournaments/stats"

type PlayerProfileProps = {
  player: {
    id: string
    name: string
    username: string | null
    image: string | null
  }
  guild: Awaited<ReturnType<typeof getUserGuild>>
  avatarUrl: string | null
  isSelf: boolean
  headerAction?: ReactNode
}

export function PlayerProfile({ player, guild, avatarUrl, isSelf, headerAction }: PlayerProfileProps) {
  const stats = getPlayerStats(player.id)

  return <PlayerProfileContent player={player} guild={guild} avatarUrl={avatarUrl} isSelf={isSelf} headerAction={headerAction} statsPromise={stats} />
}

async function PlayerProfileContent({ player, guild, avatarUrl, isSelf, headerAction, statsPromise }: PlayerProfileProps & { statsPromise: ReturnType<typeof getPlayerStats> }) {
  const { history, favorite } = await statsPromise
  const points = computePoints(history.filter((item) => item.format === "individual"))

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <ProfileTabs
          overview={
            <section className="space-y-6" aria-labelledby="player-profile-title">
              <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card/90 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-accent/15 text-2xl font-semibold text-accent ring-1 ring-accent/30">
                    {avatarUrl ? (
                      <NextImage src={avatarUrl} alt={`Avatar de ${player.name}`} width={80} height={80} unoptimized className="size-full object-cover" />
                    ) : (
                      player.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{isSelf ? "Seu perfil" : "Perfil público"}</p>
                    <h1 id="player-profile-title" className="mt-1 truncate font-heading text-3xl font-bold tracking-tight">{player.name}</h1>
                    <p className="mt-1 truncate text-sm text-muted-foreground">@{player.username ?? "player"}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                      <Trophy className="size-4" aria-hidden="true" /> {points.total} pts
                    </p>
                  </div>
                </div>
                {isSelf ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href="/perfil/editar"><Pencil aria-hidden="true" /> Editar perfil</Link>
                    </Button>
                    {headerAction}
                  </div>
                ) : null}
              </div>

              <Link
                href={guild ? `/guildas/${guild.guildTag}` : "/guildas"}
                aria-label={guild ? `Acessar guilda ${guild.guildName}` : "Encontrar uma guilda"}
                className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card/90 p-5 transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30 transition-transform group-hover:scale-105">
                  {guild?.guildImage ? (
                    <GuildImage
                      src={`/api/guilds/${guild.guildId}/image?path=${encodeURIComponent(guild.guildImage)}`}
                      alt={`Ícone da guilda ${guild.guildName}`}
                      width={64}
                      height={64}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Shield className="size-7" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.15em] text-muted-foreground">Guilda</span>
                  <span className="mt-1 block truncate font-heading text-lg font-semibold text-accent">{guild?.guildName ?? "Encontrar uma guilda"}</span>
                  {guild ? <span className="block text-sm text-muted-foreground">[{guild.guildTag}]</span> : null}
                </span>
              </Link>

              <PlayerTopPokemon favorite={favorite} />
            </section>
          }
          historico={
            <section className="space-y-6" aria-labelledby="player-stats-title">
              <h2 id="player-stats-title" className="sr-only">Estatísticas do player</h2>
              <PlayerTournamentStats history={history} />
            </section>
          }
        />
      </div>
    </main>
  )
}
