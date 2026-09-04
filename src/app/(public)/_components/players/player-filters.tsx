"use client"

import { Search, SlidersHorizontal, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type GuildOption = { tag: string; name: string }
type StatusValue = "all" | "member" | "solo"

export const PLAYERS_PATH = "/players"

const statusOptions: Array<{ label: string; value: StatusValue }> = [
  { label: "Todos", value: "all" },
  { label: "Em guilda", value: "member" },
  { label: "Solo", value: "solo" },
]

function FiltersPanel({
  guilds,
  idPrefix,
  status,
  guild,
  query,
  onQueryChange,
  updateParams,
  clearFilters,
  hasActive,
  filtersOpen,
  onToggleFilters,
}: {
  guilds: GuildOption[]
  idPrefix: string
  status: StatusValue
  guild: string
  query: string
  onQueryChange: (value: string) => void
  updateParams: (patch: Record<string, string | null>) => void
  clearFilters: () => void
  hasActive: boolean
  filtersOpen: boolean
  onToggleFilters: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">Filtrar players</h2>
        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="players-filtros-avancados"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
            filtersOpen || hasActive
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border/70 text-muted-foreground hover:border-accent/30 hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Filtros
          {hasActive ? <span className="sr-only"> ativos</span> : null}
        </button>
      </div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor={`${idPrefix}-busca-player`} className="sr-only">
          Buscar player
        </label>
        <input
          id={`${idPrefix}-busca-player`}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar por nome ou usuário..."
          className="h-10 w-full rounded-xl border border-input bg-background/70 pr-8 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {filtersOpen ? (
        <div id="players-filtros-avancados" className="flex flex-col gap-5 border-t border-border/60 pt-5">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</p>
            <div
              role="group"
              aria-label="Filtrar por status"
              className="grid w-full grid-cols-3 items-center gap-1 rounded-xl bg-muted p-1 lg:w-auto lg:min-w-56"
            >
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={status === option.value}
                  onClick={() => updateParams({ status: option.value === "all" ? null : option.value })}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                    status === option.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor={`${idPrefix}-filtro-guilda`}
              className="mb-2 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Guilda
            </label>
            <select
              id={`${idPrefix}-filtro-guilda`}
              value={guild}
              onChange={(event) => updateParams({ guild: event.target.value || null })}
              className="h-10 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todas as guildas</option>
              {guilds.map((option) => (
                <option key={option.tag} value={option.tag}>
                  {option.name} [{option.tag}]
                </option>
              ))}
            </select>
          </div>

          {hasActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <X className="size-3" aria-hidden="true" />
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function PlayerFilters({ guilds }: { guilds: GuildOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlQuery = searchParams.get("q") ?? ""
  const status = (searchParams.get("status") as StatusValue) || "all"
  const guild = searchParams.get("guild") ?? ""

  const [query, setQuery] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  const [filtersOpen, setFiltersOpen] = useState(() => Boolean(status !== "all" || guild))

  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery)
    setQuery(urlQuery)
  }

  useEffect(() => {
    if (query === urlQuery) return

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) params.set("q", query.trim())
      else params.delete("q")
      params.delete("page")

      const qs = params.toString()
      router.replace(qs ? `${PLAYERS_PATH}?${qs}` : PLAYERS_PATH, { scroll: false })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, urlQuery, searchParams, router])

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete("page")

    const qs = params.toString()
    router.replace(qs ? `${PLAYERS_PATH}?${qs}` : PLAYERS_PATH, { scroll: false })
  }

  const clearFilters = () => router.replace(PLAYERS_PATH, { scroll: false })

  const hasActive = Boolean(status !== "all" || guild || query.trim())

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm shadow-black/10 sm:p-5">
      <FiltersPanel
        guilds={guilds}
        idPrefix="players"
        status={status}
        guild={guild}
        query={query}
        onQueryChange={setQuery}
        updateParams={updateParams}
        clearFilters={clearFilters}
        hasActive={hasActive}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
      />
    </div>
  )
}
