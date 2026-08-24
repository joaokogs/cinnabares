"use client"

import { useCallback, useEffect, useState } from "react"
import { History, Trophy, Swords, Undo2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readApiError } from "@/lib/error-messages"
import { cn } from "@/lib/utils"
import { getPhaseLabel } from "@/lib/tournaments/bracket"
import { BracketView } from "@/app/(public)/torneios/[id]/bracket/_components/bracket-view"

type Registration = { id: string; status: "pending" | "approved" | "rejected"; userName: string | null; username: string | null; guildName: string | null; guildTag: string | null; createdAt: string }

type BracketData = {
  totalPhases: number
  matches: Array<{
    id: string
    phase: number
    position: number
    slot1RegistrationId: string | null
    slot2RegistrationId: string | null
    winnerRegistrationId: string | null
    status: "pending" | "completed"
    slot1Name: string
    slot1GuildTag: string | null
    slot2Name: string
    slot2GuildTag: string | null
    winnerName: string | null
  }>
  champion: { registrationId: string | null; name: string | null } | null
}

type ActionLogEntry = {
  id: string
  matchId: string
  action: string
  createdAt: string
  matchPhase: number
  matchPosition: number
  slot1Name: string | null
  slot1Username: string | null
  slot1GuildName: string | null
  slot1GuildTag: string | null
  slot2Name: string | null
  slot2Username: string | null
  slot2GuildName: string | null
  slot2GuildTag: string | null
  winnerName: string | null
  winnerUsername: string | null
  winnerGuildName: string | null
  winnerGuildTag: string | null
  createdByName: string | null
}

export function TournamentAdminPanel({ tournamentId, status }: { tournamentId: string; status: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [startingBracket, setStartingBracket] = useState(false)
  const [bracket, setBracket] = useState<BracketData | null>(null)
  const [resolvingMatchId, setResolvingMatchId] = useState<string | null>(null)
  const [revertingMatchId, setRevertingMatchId] = useState<string | null>(null)
  const [history, setHistory] = useState<ActionLogEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: "resolve" | "revert"; matchId: string; label: string; winnerRegistrationId?: string } | null>(null)

  const load = useCallback(async () => {
    const result = await fetch(`/api/tournaments/${tournamentId}/registrations`)
    if (result.ok) setRegistrations(await result.json() as Registration[])
  }, [tournamentId])

  const loadBracket = useCallback(async () => {
    if (status !== "active" && status !== "finished") return
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket`)
    if (result.ok) setBracket(await result.json() as BracketData)
  }, [status, tournamentId])

  const loadHistory = useCallback(async () => {
    if (status !== "active" && status !== "finished") return
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket/history`)
    if (result.ok) setHistory(await result.json() as ActionLogEntry[])
  }, [status, tournamentId])

  useEffect(() => {
    let cancelled = false
    async function run() {
      await Promise.all([load(), loadBracket(), loadHistory()])
    }
    void run()
    if (status === "active" || status === "finished") {
      const interval = setInterval(() => { if (!cancelled) { void loadBracket(); void loadHistory() } }, 10000)
      return () => { cancelled = true; clearInterval(interval) }
    }
    return () => { cancelled = true }
  }, [load, loadBracket, loadHistory, status])

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  async function review(id: string, reviewStatus: "approved" | "rejected") {
    clearMessages()
    const result = await fetch(`/api/tournaments/${tournamentId}/registrations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: reviewStatus }) })
    if (!result.ok) { setError(await readApiError(result, "Não foi possível atualizar o status da inscrição. Tente novamente.")); return }
    await load()
  }

  async function changeStatus(nextStatus: "draft" | "open" | "closed" | "active" | "finished") {
    const result = await fetch(`/api/tournaments/${tournamentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) })
    if (!result.ok) { setError(await readApiError(result, "Não foi possível atualizar o torneio. Tente novamente.")); return }
    window.location.reload()
  }

  async function startBracket() {
    clearMessages()
    setStartingBracket(true)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket`, { method: "POST" })
    if (!result.ok) { setError(await readApiError(result, "Não foi possível iniciar o torneio. Tente novamente.")); setStartingBracket(false); return }
    window.location.reload()
  }

  async function resolveMatch(matchId: string, winnerRegistrationId: string) {
    clearMessages()
    setResolvingMatchId(matchId)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket/matches/${matchId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ winnerRegistrationId }) })
    setResolvingMatchId(null)
    if (!result.ok) { setError(await readApiError(result, "Não foi possível definir o vencedor. Tente novamente.")); return }
    setSuccess("Partida finalizada com sucesso.")
    void loadBracket()
    void loadHistory()
  }

  async function revertMatch(matchId: string) {
    clearMessages()
    setRevertingMatchId(matchId)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket/matches/${matchId}`, { method: "DELETE" })
    setRevertingMatchId(null)
    if (!result.ok) { setError(await readApiError(result, "Não foi possível desfazer o resultado. Tente novamente.")); return }
    setSuccess("Resultado desfeito com sucesso.")
    void loadBracket()
    void loadHistory()
  }

  function handleResolve(matchId: string, winnerRegistrationId: string) {
    const bracketMatch = bracket?.matches.find((m) => m.id === matchId)
    if (!bracketMatch) return
    const winnerName = winnerRegistrationId === bracketMatch.slot1RegistrationId
      ? (bracketMatch.slot1GuildTag ? `${bracketMatch.slot1Name} [${bracketMatch.slot1GuildTag}]` : bracketMatch.slot1Name)
      : (bracketMatch.slot2GuildTag ? `${bracketMatch.slot2Name} [${bracketMatch.slot2GuildTag}]` : bracketMatch.slot2Name)
    setConfirmAction({ type: "resolve", matchId, label: winnerName, winnerRegistrationId })
  }

  function handleRevert(matchId: string) {
    const bracketMatch = bracket?.matches.find((m) => m.id === matchId)
    if (!bracketMatch) return
    const slot1Label = bracketMatch.slot1GuildTag ? `${bracketMatch.slot1Name} [${bracketMatch.slot1GuildTag}]` : bracketMatch.slot1Name
    const slot2Label = bracketMatch.slot2GuildTag ? `${bracketMatch.slot2Name} [${bracketMatch.slot2GuildTag}]` : bracketMatch.slot2Name
    setConfirmAction({ type: "revert", matchId, label: `${slot1Label} vs ${slot2Label}` })
  }

  function executeConfirm() {
    if (!confirmAction) return
    if (confirmAction.type === "resolve" && confirmAction.winnerRegistrationId) {
      void resolveMatch(confirmAction.matchId, confirmAction.winnerRegistrationId)
    } else if (confirmAction.type === "revert") {
      void revertMatch(confirmAction.matchId)
    }
    setConfirmAction(null)
  }

  const pendingMatches = bracket?.matches.filter((m) => m.status === "pending" && m.slot1RegistrationId && m.slot2RegistrationId) ?? []
  const hasBracket = status === "active" || status === "finished"

  function formatSlotName(entry: ActionLogEntry, slot: "1" | "2") {
    const name = slot === "1" ? entry.slot1Name : entry.slot2Name
    const username = slot === "1" ? entry.slot1Username : entry.slot2Username
    const guildName = slot === "1" ? entry.slot1GuildName : entry.slot2GuildName
    const guildTag = slot === "1" ? entry.slot1GuildTag : entry.slot2GuildTag
    if (guildName && guildTag) return `${guildName} [${guildTag}]`
    return name ?? username ?? "Player"
  }

  function formatWinnerName(entry: ActionLogEntry) {
    if (entry.winnerGuildName && entry.winnerGuildTag) return `${entry.winnerGuildName} [${entry.winnerGuildTag}]`
    return entry.winnerName ?? entry.winnerUsername ?? "Player"
  }

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <CardTitle>{hasBracket ? "Chave do torneio" : "Fila de inscrições"}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {status === "draft" ? <Button size="sm" onClick={() => void changeStatus("open")}>Abrir inscrições</Button> : null}
            {status === "open" ? <Button size="sm" variant="outline" onClick={() => void changeStatus("closed")}>Fechar inscrições</Button> : null}
            {status === "closed" ? <Button size="sm" onClick={() => void startBracket()} disabled={startingBracket}>{startingBracket ? "Iniciando..." : "Iniciar torneio"}</Button> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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

        {hasBracket && bracket ? (
          <div className="space-y-4">
            {bracket.champion ? (
              <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <Trophy className="size-5 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Campeão</p>
                  <p className="font-medium">{bracket.champion.name}</p>
                </div>
              </div>
            ) : null}

            {pendingMatches.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Partidas pendentes</p>
                {pendingMatches.map((match) => {
                  const slot1Label = match.slot1GuildTag ? `${match.slot1Name} [${match.slot1GuildTag}]` : match.slot1Name
                  const slot2Label = match.slot2GuildTag ? `${match.slot2Name} [${match.slot2GuildTag}]` : match.slot2Name
                  return (
                    <div key={match.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="shrink-0">{getPhaseLabel(match.phase, bracket.totalPhases)}</Badge>
                        <span className="truncate font-medium">{slot1Label}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="truncate font-medium">{slot2Label}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" disabled={resolvingMatchId === match.id} onClick={() => void resolveMatch(match.id, match.slot1RegistrationId!)}>
                          {slot1Label}
                        </Button>
                        <Button size="sm" variant="outline" disabled={resolvingMatchId === match.id} onClick={() => void resolveMatch(match.id, match.slot2RegistrationId!)}>
                          {slot2Label}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : !bracket.champion ? (
              <p className="text-sm text-muted-foreground">Todas as partidas foram finalizadas.</p>
            ) : null}

            <div className="rounded-lg border border-border bg-background/40 p-4">
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Chave interativa</h4>
              <BracketView
                tournamentId={tournamentId}
                adminMode
                onResolve={handleResolve}
                onRevert={handleRevert}
                resolvingMatchId={resolvingMatchId}
                revertingMatchId={revertingMatchId}
              />
            </div>

            <div className="space-y-2">
              <Button
                size="sm"
                variant="ghost"
                className="-ml-2 gap-1.5"
                onClick={() => { setShowHistory((prev) => !prev); if (!showHistory) void loadHistory() }}
              >
                <History className="size-4" aria-hidden="true" />
                {showHistory ? "Ocultar histórico" : "Ver histórico de ações"}
              </Button>

              {showHistory ? (
                history.length > 0 ? (
                  <div className="space-y-1 rounded-lg border border-border bg-background/40 p-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-start justify-between gap-3 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          {entry.action === "resolve" ? (
                            <Badge variant="default" className="shrink-0">Resolveu</Badge>
                          ) : (
                            <Badge variant="destructive" className="shrink-0 gap-1"><Undo2 className="size-3" aria-hidden="true" /> Desfez</Badge>
                          )}
                          <span className="text-muted-foreground">
                            {getPhaseLabel(entry.matchPhase, bracket.totalPhases)} #{entry.matchPosition + 1}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {entry.action === "resolve"
                              ? <>{formatWinnerName(entry)} venceu</>
                              : <>Resultado removido: {formatSlotName(entry, "1")} vs {formatSlotName(entry, "2")}</>
                            }
                          </p>
                          <p className="text-muted-foreground">
                            {entry.createdByName} · {new Date(entry.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhuma ação registrada.</p>
                )
              ) : null}
            </div>

            <Button asChild size="sm" variant="ghost" className="-ml-2">
              <a href={`/torneios/${tournamentId}/bracket`} target="_blank" rel="noopener noreferrer">
                <Swords className="size-4" aria-hidden="true" /> Abrir chave pública
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.length ? registrations.map((registration) => (
              <div key={registration.id} className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium">{registration.guildName ? `${registration.guildName} [${registration.guildTag}]` : registration.username ?? registration.userName ?? "Player"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(registration.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={registration.status === "approved" ? "default" : "outline"}>{registration.status}</Badge>
                  {registration.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => void review(registration.id, "approved")}>Aceitar</Button>
                      <Button size="sm" variant="outline" onClick={() => void review(registration.id, "rejected")}>Recusar</Button>
                    </>
                  ) : null}
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Nenhuma inscrição na fila.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
