"use client"

import { useState } from "react"
import { Swords, Trophy } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { getPhaseLabel } from "@/lib/tournaments/bracket"
import { BracketHistorySidebar } from "./bracket-history-sidebar"
import { ConfirmPanel } from "./confirm-panel"
import { MatchCard } from "./match-card"
import { MatchupDialog } from "./matchup-dialog"
import type { ConfirmAction, Match } from "./types"
import { useBracketData } from "./use-bracket"

type BracketViewProps = {
  tournamentId: string
  adminMode?: boolean
  onResolve?: (matchId: string, winnerRegistrationId: string) => void
  onRevert?: (matchId: string) => void
  resolvingMatchId?: string | null
  revertingMatchId?: string | null
}

function ChampionBanner({ champion }: { champion: { registrationId: string | null; name: string | null } }) {
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="grid size-12 place-items-center rounded-full bg-accent/20 ring-2 ring-accent/40">
          <Trophy className="size-6 text-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Campeão</p>
          <p className="font-heading text-lg font-bold">{champion.name}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function FinishedNotice({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
      <Trophy className="size-4 text-accent" aria-hidden="true" />
      <span>Este torneio foi <strong className="font-semibold text-foreground">finalizado</strong>. A chave reflete o resultado final e não recebe novas atualizações.</span>
    </div>
  )
}

function groupMatchesByPhase(matches: Match[]): Map<number, Match[]> {
  const phases = new Map<number, Match[]>()
  for (const match of matches) {
    const list = phases.get(match.phase) ?? []
    list.push(match)
    phases.set(match.phase, list)
  }
  return phases
}

function findMatch(matches: Match[], matchId: string | null): Match | null {
  if (!matchId) return null
  return matches.find((m) => m.id === matchId) ?? null
}

function resolveActiveId(external: string | null | undefined, internal: boolean | undefined, internalId: string | null): string | null {
  return external ?? (internal ? internalId : null)
}

function PhaseColumn({
  phase,
  matches,
  totalPhases,
  adminMode,
  finished,
  onResolve,
  onRevert,
  activeResolving,
  activeReverting,
  onViewMatchup,
}: {
  phase: number
  matches: Match[]
  totalPhases: number
  adminMode?: boolean
  finished?: boolean
  onResolve?: (matchId: string, winnerRegistrationId: string) => void
  onRevert?: (matchId: string) => void
  activeResolving: string | null
  activeReverting: string | null
  onViewMatchup: (matchId: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Swords className="size-4 text-accent" aria-hidden="true" />
        <h3 className="font-heading text-sm font-semibold">{getPhaseLabel(phase, totalPhases)}</h3>
      </div>
      <div className="flex flex-col gap-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            adminMode={adminMode}
            finished={finished}
            onResolve={onResolve}
            onRevert={onRevert}
            resolving={activeResolving === match.id}
            reverting={activeReverting === match.id}
            onViewMatchup={onViewMatchup}
          />
        ))}
      </div>
    </div>
  )
}

function BracketFeedback({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {success ? <p className="text-sm text-primary" role="status">{success}</p> : null}
    </>
  )
}

function ConfirmActionPanel({
  action,
  onConfirm,
  onCancel,
  onLoserScoreChange,
}: {
  action: ConfirmAction | null
  onConfirm: () => void
  onCancel: () => void
  onLoserScoreChange: (loserScore: 0 | 1 | 2) => void
}) {
  if (!action) return null
  return (
    <ConfirmPanel
      action={action}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onLoserScoreChange={onLoserScoreChange}
    />
  )
}

function ChampionSection({ champion }: { champion: { registrationId: string | null; name: string | null } | null }) {
  if (!champion) return null
  return <ChampionBanner champion={champion} />
}

function AdminHistorySection({ show, tournamentId, totalPhases }: { show: boolean | undefined; tournamentId: string; totalPhases: number }) {
  if (!show) return null
  return (
    <div className="flex items-center gap-2">
      <BracketHistorySidebar tournamentId={tournamentId} totalPhases={totalPhases} />
    </div>
  )
}

function AutoRefreshNotice({ active }: { active: boolean }) {
  if (!active) return null
  return <p className="text-xs text-muted-foreground">Atualização automática a cada 10 segundos.</p>
}

export function BracketView({ tournamentId, adminMode, onResolve, onRevert, resolvingMatchId, revertingMatchId }: BracketViewProps) {
  const {
    data,
    error,
    success,
    setError,
    resolvingId,
    revertingId,
    executeResolve,
    executeRevert,
    savingBattlesId,
    executeSaveBattles,
  } = useBracketData(tournamentId)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)

  const finished = data?.tournament.status === "finished"
  const internalResolve = adminMode && !onResolve
  const internalRevert = adminMode && !onRevert
  const activeResolving = resolveActiveId(resolvingMatchId, internalResolve, resolvingId)
  const activeReverting = resolveActiveId(revertingMatchId, internalRevert, revertingId)

  function handleInternalResolve(matchId: string, winnerRegistrationId: string) {
    if (!data) return
    const bracketMatch = data.matches.find((m) => m.id === matchId)
    if (!bracketMatch) return
    const winnerName = winnerRegistrationId === bracketMatch.slot1RegistrationId
      ? (bracketMatch.slot1GuildTag ? `${bracketMatch.slot1Name} [${bracketMatch.slot1GuildTag}]` : bracketMatch.slot1Name)
      : (bracketMatch.slot2GuildTag ? `${bracketMatch.slot2Name} [${bracketMatch.slot2GuildTag}]` : bracketMatch.slot2Name)
    setConfirmAction({ type: "resolve", matchId, label: winnerName, winnerRegistrationId, loserScore: 0 })
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
      const bracketMatch = data?.matches.find((m) => m.id === confirmAction.matchId)
      if (!bracketMatch) {
        setError("A chave foi atualizada. Recarregue a página e tente novamente.")
        setConfirmAction(null)
        return
      }
      const winnerIsSlot1 = confirmAction.winnerRegistrationId === bracketMatch.slot1RegistrationId
      const loserScore = confirmAction.loserScore ?? 0
      void executeResolve(confirmAction.matchId, confirmAction.winnerRegistrationId, {
        score1: winnerIsSlot1 ? 3 : loserScore,
        score2: winnerIsSlot1 ? loserScore : 3,
      })
    } else if (confirmAction.type === "revert") {
      void executeRevert(confirmAction.matchId)
    }
    setConfirmAction(null)
  }

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

  const phases = groupMatchesByPhase(data.matches)
  const selectedMatch = findMatch(data.matches, selectedMatchId)

  return (
    <div className="space-y-6">
      <BracketFeedback error={error} success={success} />

      <ConfirmActionPanel
        action={confirmAction}
        onConfirm={executeConfirm}
        onCancel={() => setConfirmAction(null)}
        onLoserScoreChange={(loserScore) => setConfirmAction((current) => current ? { ...current, loserScore } : current)}
      />

      <ChampionSection champion={data.champion} />

      <FinishedNotice show={finished} />

      <AdminHistorySection show={adminMode} tournamentId={tournamentId} totalPhases={data.totalPhases} />

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6" role="region" aria-label="Chave do torneio">
          {Array.from(phases.entries()).map(([phase, matches]) => (
            <PhaseColumn
              key={phase}
              phase={phase}
              matches={matches}
              totalPhases={data.totalPhases}
              adminMode={adminMode}
              finished={finished}
              onResolve={internalResolve ? handleInternalResolve : onResolve}
              onRevert={internalRevert ? handleInternalRevert : onRevert}
              activeResolving={activeResolving}
              activeReverting={activeReverting}
              onViewMatchup={setSelectedMatchId}
            />
          ))}
        </div>
      </div>

      <AutoRefreshNotice active={data.tournament.status === "active"} />

      <MatchupDialog
        match={selectedMatch}
        visibility={data.tournament.visibility}
        viewerIsAdmin={Boolean(data.viewerIsAdmin)}
        open={Boolean(selectedMatch)}
        onOpenChange={(open) => { if (!open) setSelectedMatchId(null) }}
        onSaveBattles={adminMode ? executeSaveBattles : undefined}
        savingBattles={savingBattlesId === selectedMatchId}
      />
    </div>
  )
}
