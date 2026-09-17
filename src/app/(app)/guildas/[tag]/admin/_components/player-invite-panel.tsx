"use client"

import Image from "next/image"
import { LoaderCircle, Search, UserPlus } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getErrorMessage, readApiError } from "@/lib/error-messages"
import { cn } from "@/lib/utils"

type PlayerOption = {
  id: string
  name: string
  username: string | null
  avatarUrl: string | null
}

export function PlayerInvitePanel({ guildId }: { guildId: string }) {
  const [query, setQuery] = useState("")
  const [players, setPlayers] = useState<PlayerOption[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dropUp, setDropUp] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (selectedPlayer || query.trim().length < 2) return

    const updatePlacement = () => {
      const rect = inputRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setDropUp(spaceBelow < 280 && spaceAbove > spaceBelow)
    }

    updatePlacement()
    window.addEventListener("resize", updatePlacement)
    window.addEventListener("scroll", updatePlacement, true)
    return () => {
      window.removeEventListener("resize", updatePlacement)
      window.removeEventListener("scroll", updatePlacement, true)
    }
  }, [isSearching, players.length, query, selectedPlayer])

  useEffect(() => {
    if (selectedPlayer || query.trim().length < 2) return

    let active = true
    const timer = window.setTimeout(() => {
      setIsSearching(true)
      void fetch(`/api/players/search?q=${encodeURIComponent(query.trim())}`)
        .then(async (response) => {
          if (!response.ok) throw new Error(await readApiError(response, "Não foi possível pesquisar players."))
          return response.json() as Promise<{ players: PlayerOption[] }>
        })
        .then((result) => {
          if (active) setPlayers(result.players)
        })
        .catch((searchError: unknown) => {
          if (active) setError(getErrorMessage(searchError, "Não foi possível pesquisar players."))
        })
        .finally(() => {
          if (active) setIsSearching(false)
        })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, selectedPlayer])

  function handleQueryChange(value: string) {
    setQuery(value)
    setSelectedPlayer(null)
    setPlayers([])
    setIsSearching(false)
    setSuccess(null)
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess(null)
    if (!selectedPlayer) {
      setError("Pesquise e selecione um player válido para enviar o convite.")
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch(`/api/guilds/${guildId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedPlayer.id }),
      })
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível enviar o convite."))
      setSuccess(`Convite enviado para ${selectedPlayer.name}. O player receberá uma notificação.`)
      setQuery("")
      setSelectedPlayer(null)
      setPlayers([])
    } catch (inviteError) {
      setError(getErrorMessage(inviteError, "Não foi possível enviar o convite."))
    } finally {
      setIsInviting(false)
    }
  }

  return <Card className="border-border/70 bg-card/90"><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="size-5 text-accent" aria-hidden="true" /> Convidar player</CardTitle><CardDescription>Pesquise pelo nome ou username e envie um convite individual.</CardDescription></CardHeader><CardContent className="space-y-4"><form className="space-y-3" onSubmit={(event) => void handleInvite(event)}><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder="Pesquisar player..." aria-label="Pesquisar player para convidar" autoComplete="off" className="h-10 w-full rounded-lg border border-input bg-background/70 pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" />{!selectedPlayer && query.trim().length >= 2 ? <div className={cn("absolute inset-x-0 z-20 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl", dropUp ? "bottom-full mb-1" : "top-full mt-1")}>{isSearching ? <p className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> Pesquisando...</p> : players.length > 0 ? <div role="listbox" aria-label="Players encontrados">{players.map((player) => <button key={player.id} type="button" role="option" aria-selected={false} onClick={() => { setSelectedPlayer(player); setQuery(player.name); setPlayers([]) }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/10"><div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 text-xs font-bold text-accent">{player.avatarUrl ? <Image src={player.avatarUrl} alt="" width={32} height={32} unoptimized className="size-full object-cover" /> : player.name.slice(0, 1).toUpperCase()}</div><span className="min-w-0"><span className="block truncate text-sm font-medium">{player.name}</span><span className="block truncate text-xs text-muted-foreground">@{player.username ?? "player"}</span></span></button>)}</div> : <p className="px-3 py-3 text-xs text-muted-foreground">Nenhum player encontrado.</p>}</div> : null}</div>{selectedPlayer ? <p className="text-xs text-muted-foreground">Selecionado: <span className="font-semibold text-foreground">{selectedPlayer.name}</span> @{selectedPlayer.username ?? "player"}</p> : null}<Button type="submit" disabled={isInviting}>{isInviting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />} {isInviting ? "Enviando..." : "Enviar convite"}</Button></form>{success ? <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400" role="status">{success}</p> : null}</CardContent><Dialog open={Boolean(error)} onOpenChange={(open) => { if (!open) setError(null) }}><DialogContent><DialogHeader><DialogTitle>Não foi possível enviar o convite</DialogTitle><DialogDescription>{error}</DialogDescription></DialogHeader><DialogFooter><Button type="button" onClick={() => setError(null)}>Entendi</Button></DialogFooter></DialogContent></Dialog></Card>
}
