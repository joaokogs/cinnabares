import { useCallback, useEffect, useState } from "react"

import { readApiError } from "@/lib/error-messages"
import type { BracketData } from "./types"

export function useBracketData(tournamentId: string) {
  const [data, setData] = useState<BracketData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)

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

  async function executeResolve(matchId: string, winnerRegistrationId: string, scores: { score1: number; score2: number }) {
    setError(null)
    setSuccess(null)
    setResolvingId(matchId)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerRegistrationId, score1: scores.score1, score2: scores.score2 }),
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

  return {
    data,
    error,
    success,
    setError,
    resolvingId,
    revertingId,
    executeResolve,
    executeRevert,
  }
}