import NextImage from "next/image"
import Link from "next/link"
import { Shield, User } from "lucide-react"

import { GuildImage } from "@/components/shared/guild-image"
import type { PlayerSearchResult } from "@/lib/users/queries"

type PlayerCardProps = {
  player: PlayerSearchResult
}

export function PlayerCard({ player }: PlayerCardProps) {
  const handle = player.username ?? player.displayUsername ?? "player"
  const avatarUrl = player.image && player.username
    ? `/api/players/${encodeURIComponent(player.username)}/avatar`
    : null

  return (
    <article className="group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card hover:shadow-lg hover:shadow-black/20">
      {player.username ? (
        <Link
          href={`/players/${encodeURIComponent(player.username)}`}
          className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          aria-label={`Ver perfil de ${player.name}`}
        />
      ) : null}

      <div className="flex items-center gap-4 p-5 pb-4">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 text-xl font-semibold text-accent ring-4 ring-accent/5">
          {avatarUrl ? (
            <NextImage
              src={avatarUrl}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <User className="size-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-heading text-lg font-semibold tracking-tight text-foreground group-hover:text-accent">
            {player.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">@{handle}</p>
        </div>
      </div>

      {player.guildTag ? (
        <div
          className="relative z-10 mt-auto flex items-center gap-2 border-t border-border/60 px-5 py-3 text-sm"
        >
          {player.guildId && player.guildImage ? (
            <span className="grid size-5 shrink-0 overflow-hidden rounded bg-accent/15">
              <GuildImage
                src={`/api/guilds/${player.guildId}/image?path=${encodeURIComponent(player.guildImage)}`}
                alt=""
                width={20}
                height={20}
                className="size-full object-cover"
              />
            </span>
          ) : (
            <Shield className="size-4 shrink-0 text-accent" aria-hidden="true" />
          )}
          <span className="truncate font-medium text-foreground">{player.guildName}</span>
          <span className="truncate text-muted-foreground">[{player.guildTag}]</span>
        </div>
      ) : (
        <div className="mt-auto flex items-center gap-2 border-t border-border/60 px-5 py-3 text-sm text-muted-foreground">
          <Shield className="size-4 shrink-0" aria-hidden="true" />
          <span>Sem guilda</span>
        </div>
      )}
    </article>
  )
}
