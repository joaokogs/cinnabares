"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ParticipantSidebar } from "@/app/(public-view)/torneios/[id]/bracket/_components/participant-popover"
import type { VisibleRosterEntry, TournamentVisibility } from "@/lib/tournaments/roster"

type TournamentStatus = "draft" | "open" | "closed" | "active" | "finished"
type Participant = {
  id: string
  roster: VisibleRosterEntry[]
  userName: string | null
  username: string | null
  guildName: string | null
  guildTag: string | null
}

export function ParticipantsList({ tournamentId, visibility, status }: { tournamentId: string; visibility: TournamentVisibility; status: TournamentStatus }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetch(`/api/tournaments/${tournamentId}/participants`)
        if (!result.ok) throw new Error("Não foi possível carregar os inscritos.")
        const data = await result.json() as Participant[]
        if (!cancelled) {
          setParticipants(data)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar os inscritos.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load()
    }, 10000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [tournamentId])

  if (status !== "open" && status !== "closed") return null

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Inscritos aprovados</CardTitle>
          <Badge variant="secondary" aria-live="polite">{participants.length} inscritos</Badge>
        </div>
        <CardDescription>Clique no nome para consultar o time cadastrado, quando disponível.</CardDescription>
      </CardHeader>
      <CardContent aria-busy={loading}>
        {loading ? <p className="text-sm text-muted-foreground">Carregando inscritos...</p> : null}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {!loading && !error && participants.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma inscrição aprovada ainda.</p> : null}
        {!loading && !error && participants.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Inscritos aprovados">
            {participants.map((participant) => {
              const name = participant.guildName
                ? `${participant.guildName}${participant.guildTag ? ` [${participant.guildTag}]` : ""}`
                : participant.username ?? participant.userName ?? "Player"
              const hasRoster = visibility !== "blind" && participant.roster.length > 0

              return (
                <li key={participant.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5">
                  <ParticipantSidebar name={name} roster={participant.roster} visibility={visibility}>
                    <span className="truncate text-sm font-medium">{name}</span>
                  </ParticipantSidebar>
                  <span className="shrink-0 text-xs text-muted-foreground">{hasRoster ? "Ver time" : "Sem time"}</span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
