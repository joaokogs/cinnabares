"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readApiError } from "@/lib/error-messages"

type Registration = {
  id: string
  status: "pending" | "approved" | "rejected"
  userName: string | null
  username: string | null
  guildName: string | null
  guildTag: string | null
  createdAt: string
}

export function TournamentControls({ tournamentId, status }: { tournamentId: string; status: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [error, setError] = useState<string | null>(null)
  const [startingBracket, setStartingBracket] = useState(false)

  useEffect(() => {
    if (status === "finished") return
    let cancelled = false

    async function run() {
      const result = await fetch(`/api/tournaments/${tournamentId}/registrations`)
      if (!cancelled && result.ok) setRegistrations(await result.json() as Registration[])
    }

    void run()
    return () => { cancelled = true }
  }, [tournamentId, status])

  async function review(id: string, reviewStatus: "approved" | "rejected") {
    setError(null)
    const result = await fetch(`/api/tournaments/${tournamentId}/registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: reviewStatus }),
    })
    if (!result.ok) {
      setError(await readApiError(result, "Não foi possível atualizar o status da inscrição. Tente novamente."))
      return
    }
    const reload = await fetch(`/api/tournaments/${tournamentId}/registrations`)
    if (reload.ok) setRegistrations(await reload.json() as Registration[])
  }

  async function changeStatus(nextStatus: "draft" | "open" | "closed" | "active" | "finished") {
    const result = await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (!result.ok) {
      setError(await readApiError(result, "Não foi possível atualizar o torneio. Tente novamente."))
      return
    }
    window.location.reload()
  }

  async function startBracket() {
    setError(null)
    setStartingBracket(true)
    const result = await fetch(`/api/tournaments/${tournamentId}/bracket`, { method: "POST" })
    if (!result.ok) {
      setError(await readApiError(result, "Não foi possível iniciar o torneio. Tente novamente."))
      setStartingBracket(false)
      return
    }
    window.location.reload()
  }

  const showRegistrationQueue = status === "open" || status === "draft" || status === "closed"

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <CardTitle>Painel de gerenciamento</CardTitle>
          <div className="flex flex-wrap gap-2">
            {status === "draft" ? (
              <Button size="sm" onClick={() => void changeStatus("open")}>Abrir inscrições</Button>
            ) : null}
            {status === "open" ? (
              <Button size="sm" variant="outline" onClick={() => void changeStatus("closed")}>Fechar inscrições</Button>
            ) : null}
            {status === "closed" ? (
              <Button size="sm" onClick={() => void startBracket()} disabled={startingBracket}>
                {startingBracket ? "Iniciando..." : "Iniciar torneio"}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

        {showRegistrationQueue ? (
          <div className="space-y-3">
            {registrations.length ? registrations.map((registration) => (
              <div key={registration.id} className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium">
                    {registration.guildName
                      ? `${registration.guildName} [${registration.guildTag}]`
                      : registration.username ?? registration.userName ?? "Player"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(registration.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={registration.status === "approved" ? "default" : "outline"}>
                    {registration.status}
                  </Badge>
                  {registration.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => void review(registration.id, "approved")}>Aceitar</Button>
                      <Button size="sm" variant="outline" onClick={() => void review(registration.id, "rejected")}>Recusar</Button>
                    </>
                  ) : null}
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhuma inscrição na fila.</p>
            )}
          </div>
        ) : null}

        {(status === "active" || status === "finished") ? (
          <p className="text-sm text-muted-foreground">
            {status === "finished"
              ? "O torneio foi finalizado. Acesse a "
              : "O torneio está em andamento. Acesse a "}
            <Link href={`/torneios/${tournamentId}/bracket`} className="text-primary underline underline-offset-2 hover:text-primary/80">
              chave do torneio
            </Link>
            {" "}para ver as partidas.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
