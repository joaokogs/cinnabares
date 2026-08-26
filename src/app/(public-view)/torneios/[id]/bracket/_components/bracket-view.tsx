"use client"

import { useCallback, useEffect, useState } from "react"
import { Trophy, Swords, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { readApiError } from "@/lib/error-messages"
import { cn } from "@/lib/utils"
import { getPhaseLabel } from "@/lib/tournaments/bracket"
import type { VisibleRosterEntry } from "@/lib/tournaments/roster"
import { BracketHistorySidebar } from "./bracket-history-sidebar"
import { ParticipantSidebar } from "./participant-popover"

type Visibility = "blind" | "partial" | "total"

type Match = {
  id: string
  phase: number
  position: number
  slot1RegistrationId: string | null
  slot2RegistrationId: string | null
  winnerRegistrationId: string | null
  status: "pending" | "completed"
  slot1Name: string
  slot1GuildTag: string | null
  slot1Roster: VisibleRosterEntry[]
  slot2Name: string
  slot2GuildTag: string | null
  slot2Roster: VisibleRosterEntry[]
  winnerName: string | null
}

type BracketData = {
  tournament: { name: string; status: string; visibility: Visibility }
  totalPhases: number
  matches: Match[]
  champion: { registrationId: string | null; name: string | null } | null
}

type ConfirmAction = {
  type: "resolve" | "revert"
  matchId: string
  label: string
  winnerRegistrationId?: string
}

type BracketViewProps = {
  tournamentId: string
  adminMode?: boolean
  onResolve?: (matchId: string, winnerRegistrationId: string) => void
  onRevert?: (matchId: string) => void
  resolvingMatchId?: string | null
  revertingMatchId?: string | null
}

function SlotName({
  name,
  guildTag,
  roster,
  visibility,
  isWinner,
  isComplete,
}: {
  name: string
  guildTag: string | null
  roster: VisibleRosterEntry[]
  visibility: Visibility
  isWinner: boolean
  isComplete: boolean
}) {
  const label = guildTag ? `${name} [${guildTag}]` : name

  return (
    <span className={cn("flex items-center gap-1.5 truncate", isWinner && "font-semibold text-primary")}>
      <ParticipantSidebar name={label} roster={roster} visibility={visibility}>
        <span className="truncate cursor-pointer underline-offset-2 hover:underline">{label}</span>
      </ParticipantSidebar>
      {isWinner && isComplete ? <Trophy className="size-3.5 shrink-0 text-primary" aria-label="Vencedor" /> : null}
    </span>
  )
}

function MatchCard({
  match,
  adminMode,
  visibility,
  onResolve,
  onRevert,
  resolving,
  reverting,
}: {
  match: Match
  adminMode?: boolean
  visibility: Visibility
  onResolve?: (matchId: string, winnerRegistrationId: string) => void
  onRevert?: (matchId: string) => void
  resolving?: boolean
  reverting?: boolean
}) {
  const isComplete = match.status === "completed"
  const slot1IsWinner = match.winnerRegistrationId === match.slot1RegistrationId
  const slot2IsWinner = match.winnerRegistrationId === match.slot2RegistrationId
  const slot2IsBye = !match.slot2RegistrationId
  const busy = resolving || reverting

  return (
    <div className="w-56 shrink-0 rounded-lg border border-border bg-background/60 p-0 text-sm">
      <div
        className={cn(
          "flex w-full items-center justify-between gap-2 border-b border-border/50 px-3 py-2",
          slot1IsWinner && "bg-primary/10",
        )}
      >
        <SlotName
          name={match.slot1Name}
          guildTag={match.slot1GuildTag}
          roster={match.slot1Roster}
          visibility={visibility}
          isWinner={slot1IsWinner}
          isComplete={isComplete}
        />
        {adminMode && isComplete ? (
          <button
            type="button"
            disabled={busy || reverting}
            onClick={() => onRevert?.(match.id)}
            className={cn(
              "shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive",
              reverting && "animate-pulse opacity-60",
            )}
            aria-label={`Desfazer resultado de ${match.slot1Name}`}
          >
            <Undo2 className="size-3" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2",
          slot2IsWinner && "bg-primary/10",
        )}
      >
        <SlotName
          name={match.slot2Name}
          guildTag={match.slot2GuildTag}
          roster={match.slot2Roster}
          visibility={visibility}
          isWinner={slot2IsWinner}
          isComplete={isComplete}
        />
        {slot2IsBye ? (
          <span className="text-xs text-muted-foreground">BYE</span>
        ) : null}
      </div>

      {adminMode && !isComplete && match.slot1RegistrationId && match.slot2RegistrationId ? (
        <div className="flex border-t border-border/50">
          <button
            type="button"
            disabled={busy}
            onClick={() => onResolve?.(match.id, match.slot1RegistrationId!)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10",
              busy && "animate-pulse opacity-60",
            )}
          >
            {match.slot1GuildTag ? `${match.slot1Name} [${match.slot1GuildTag}]` : match.slot1Name}
          </button>
          <div className="w-px bg-border/50" aria-hidden="true" />
          <button
            type="button"
            disabled={busy}
            onClick={() => onResolve?.(match.id, match.slot2RegistrationId!)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10",
              busy && "animate-pulse opacity-60",
            )}
          >
            {match.slot2GuildTag ? `${match.slot2Name} [${match.slot2GuildTag}]` : match.slot2Name}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function BracketView({ tournamentId, adminMode, onResolve, onRevert, resolvingMatchId, revertingMatchId }: BracketViewProps) {
  const [data, setData] = useState<BracketData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const internalResolve = adminMode && !onResolve
  const internalRevert = adminMode && !onRevert

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)

  const activeResolving = resolvingMatchId ?? (internalResolve ? resolvingId : null)
  const activeReverting = revertingMatchId ?? (internalRevert ? revertingId : null)

  const loadBracket = useCallback(async () => {
    try {
      const result = await fetch(`/api/tournaments/${tournamentId}/bracket`)
      if (!result.ok) {
        const body = await result.json() as { error?: string }
        setError(body.error ?? "Não foi possível carregar a chave.")
        return
      }
      const json = await result.json() as BracketData
      setData(json)
      setError(null)
    } catch {
      setError("Erro de conexão ao carregar a chave.")
    }
  }, [tournamentId])

  useEffect(() => {
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout> | undefined

    async function run() {
      try {
        const result = await fetch(`/api/tournaments/${tournamentId}/bracket`)
        if (cancelled) return
        if (!result.ok) {
          const body = await result.json() as { error?: string }
          setError(body.error ?? "Não foi possível carregar a chave.")
          timeout = setTimeout(() => void run(), 10000)
          return
        }
        const json = await result.json() as BracketData
        setData(json)
        setError(null)
        if (json.tournament.status === "active") timeout = setTimeout(() => void run(), 10000)
      } catch {
        if (!cancelled) {
          setError("Erro de conexão ao carregar a chave.")
          timeout = setTimeout(() => void run(), 10000)
        }
      }
    }
    void run()
    return () => { cancelled = true; if (timeout) clearTimeout(timeout) }
  }, [tournamentId])

  async function executeResolve(matchId: string, winnerRegistrationId: string) {
    setError(null)
    setSuccess(null)
    setResolvingId(matchId)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerRegistrationId }),
    })
    setResolvingId(null)
    if (!result.ok) {
      setError(await readApiError(result, "Não foi possível definir o vencedor. Tente novamente."))
      return
    }
    setSuccess("Partida finalizada com sucesso.")
    void loadBracket()
  }

  async function executeRevert(matchId: string) {
    setError(null)
    setSuccess(null)
    setRevertingId(matchId)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket/matches/${matchId}`, { method: "DELETE" })
    setRevertingId(null)
    if (!result.ok) {
      setError(await readApiError(result, "Não foi possível desfazer o resultado. Tente novamente."))
      return
    }
    setSuccess("Resultado desfeito com sucesso.")
    void loadBracket()
  }

  function handleInternalResolve(matchId: string, winnerRegistrationId: string) {
    if (!data) return
    const bracketMatch = data.matches.find((m) => m.id === matchId)
    if (!bracketMatch) return
    const winnerName = winnerRegistrationId === bracketMatch.slot1RegistrationId
      ? (bracketMatch.slot1GuildTag ? `${bracketMatch.slot1Name} [${bracketMatch.slot1GuildTag}]` : bracketMatch.slot1Name)
      : (bracketMatch.slot2GuildTag ? `${bracketMatch.slot2Name} [${bracketMatch.slot2GuildTag}]` : bracketMatch.slot2Name)
    setConfirmAction({ type: "resolve", matchId, label: winnerName, winnerRegistrationId })
  }

  function handleInternalRevert(matchId: string) {
    if (!data) return
    const bracketMatch = data.matches.find((m) => m.id === matchId)
    if (!bracketMatch) return
    const slot1Label = bracketMatch.slot1GuildTag ? `${bracketMatch.slot1Name} [${bracketMatch.slot1GuildTag}]` : bracketMatch.slot1Name
    const slot2Label = bracketMatch.slot2GuildTag ? `${bracketMatch.slot2Name} [${bracketMatch.slot2GuildTag}]` : bracketMatch.slot2Name
    setConfirmAction({ type: "revert", matchId, label: `${slot1Label} vs ${slot2Label}` })
  }

  function executeConfirm() {
    if (!confirmAction) return
    if (confirmAction.type === "resolve" && confirmAction.winnerRegistrationId) {
      void executeResolve(confirmAction.matchId, confirmAction.winnerRegistrationId)
    } else if (confirmAction.type === "revert") {
      void executeRevert(confirmAction.matchId)
    }
    setConfirmAction(null)
  }

  const resolveHandler = internalResolve ? handleInternalResolve : onResolve
  const revertHandler = internalRevert ? handleInternalRevert : onRevert

  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive" role="alert">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" aria-label="Carregando" />
      </div>
    )
  }

  if (data.matches.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma partida encontrada.</p>
  }

  const phases = new Map<number, Match[]>()
  for (const match of data.matches) {
    const list = phases.get(match.phase) ?? []
    list.push(match)
    phases.set(match.phase, list)
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {success ? <p className="text-sm text-primary" role="status">{success}</p> : null}

      {confirmAction ? (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 space-y-3">
          <p className="text-sm font-medium">
            {confirmAction.type === "resolve"
              ? <>Definir <strong>{confirmAction.label}</strong> como vencedor?</>
              : <>Desfazer o resultado de <strong>{confirmAction.label}</strong>?</>
            }
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={executeConfirm}>Confirmar</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}

      {data.champion ? (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="grid size-12 place-items-center rounded-full bg-accent/20 ring-2 ring-accent/40">
              <Trophy className="size-6 text-accent" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Campeão</p>
              <p className="font-heading text-lg font-bold">{data.champion.name}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {adminMode ? (
        <div className="flex items-center gap-2">
          <BracketHistorySidebar tournamentId={tournamentId} totalPhases={data.totalPhases} />
        </div>
      ) : null}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6" role="region" aria-label="Chave do torneio">
          {Array.from(phases.entries()).map(([phase, matches]) => (
            <div key={phase} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Swords className="size-4 text-accent" aria-hidden="true" />
                <h3 className="font-heading text-sm font-semibold">{getPhaseLabel(phase, data.totalPhases)}</h3>
              </div>
              <div className="flex flex-col gap-4">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    adminMode={adminMode}
                    visibility={data.tournament.visibility}
                    onResolve={resolveHandler}
                    onRevert={revertHandler}
                    resolving={activeResolving === match.id}
                    reverting={activeReverting === match.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.tournament.status === "active" ? (
        <p className="text-xs text-muted-foreground">Atualização automática a cada 10 segundos.</p>
      ) : null}
    </div>
  )
}
