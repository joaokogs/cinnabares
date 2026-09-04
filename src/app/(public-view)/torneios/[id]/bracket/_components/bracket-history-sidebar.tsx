"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { History, Undo2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPhaseLabel } from "@/lib/tournaments/bracket"

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

type BracketHistorySidebarProps = {
  tournamentId: string
  totalPhases: number
}

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex=\"-1\"])"

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

function ActionBadge({ action }: { action: string }) {
  if (action === "resolve") return <Badge variant="default" className="shrink-0">Resolveu</Badge>
  if (action === "order") return <Badge variant="secondary" className="shrink-0">Ordem</Badge>
  return <Badge variant="destructive" className="shrink-0 gap-1"><Undo2 className="size-3" aria-hidden="true" /> Desfez</Badge>
}

function ActionDescription({ entry }: { entry: ActionLogEntry }) {
  if (entry.action === "resolve") return <>{formatWinnerName(entry)} venceu</>
  if (entry.action === "order") return <>Ordem de batalha atualizada</>
  return <>Resultado removido: {formatSlotName(entry, "1")} vs {formatSlotName(entry, "2")}</>
}

export function BracketHistorySidebar({ tournamentId, totalPhases }: BracketHistorySidebarProps) {
  const [history, setHistory] = useState<ActionLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const asideRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetch(`/api/tournaments/${tournamentId}/bracket/history`)
      if (!result.ok) {
        setError("Não foi possível carregar o histórico. Tente novamente.")
        return
      }
      setHistory(await result.json() as ActionLogEntry[])
    } catch {
      setError("Erro de conexão ao carregar o histórico.")
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  const handleClose = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose()
        return
      }
      if (event.key === "Tab" && asideRef.current) {
        const focusable = asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, handleClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    asideRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    return () => { document.body.style.overflow = prev }
  }, [open])

  function handleOpen() {
    setOpen(true)
    void loadHistory()
  }

  return (
    <>
      <Button
        ref={triggerRef}
        size="sm"
        variant="ghost"
        className="gap-1.5"
        onClick={handleOpen}
      >
        <History className="size-4" aria-hidden="true" />
        Histórico
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} aria-hidden="true" />
          <aside
            ref={asideRef}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Histórico de ações"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <History className="size-4 text-accent" aria-hidden="true" />
                <h2 className="font-heading text-sm font-semibold">Histórico de ações</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Fechar histórico"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" aria-label="Carregando" />
                </div>
              ) : error ? (
                <p className="py-16 text-center text-sm text-destructive" role="alert">{error}</p>
              ) : history.length > 0 ? (
                <div className="space-y-1">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <ActionBadge action={entry.action} />
                        <span className="text-muted-foreground">
                          {getPhaseLabel(entry.matchPhase, totalPhases)} #{entry.matchPosition + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          <ActionDescription entry={entry} />
                        </p>
                        <p className="text-muted-foreground">
                          {entry.createdByName} · {new Date(entry.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">Nenhuma ação registrada.</p>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
