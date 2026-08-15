"use client"

import { Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import type { GuideMode } from "@/lib/guides/types"
import { cn } from "@/lib/utils"

type GuideFiltersProps = {
  tags: string[]
}

const modeOptions: Array<{ label: string; value: GuideMode | null }> = [
  { label: "Todos", value: null },
  { label: "PvE", value: "pve" },
  { label: "PvP", value: "pvp" },
]

function parseMode(value: string | null): GuideMode | null {
  return value === "pve" || value === "pvp" ? value : null
}

export function GuideFilters({ tags }: GuideFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMode = parseMode(searchParams.get("mode"))
  const activeTag = searchParams.get("tag")
  const urlQuery = searchParams.get("q") ?? ""

  const [query, setQuery] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)

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

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, urlQuery, searchParams, router, pathname])

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const clearFilters = () => router.replace(pathname, { scroll: false })

  const hasActiveFilters = Boolean(currentMode || activeTag || query.trim())

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="busca-guia" className="sr-only">
            Buscar guia
          </label>
          <input
            id="busca-guia"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar guia..."
            className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Filtrar por modo"
          className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1"
        >
          {modeOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={currentMode === option.value}
              onClick={() => updateParams({ mode: option.value })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                currentMode === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Tags
        </span>
        <button
          type="button"
          aria-pressed={activeTag === null}
          onClick={() => updateParams({ tag: null })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
            activeTag === null
              ? "bg-accent/15 text-accent ring-1 ring-accent/30"
              : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
          )}
        >
          Todas
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={activeTag === tag}
            onClick={() => updateParams({ tag: activeTag === tag ? null : tag })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
              activeTag === tag
                ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
            )}
          >
            #{tag}
          </button>
        ))}
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <X className="size-3" aria-hidden="true" />
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  )
}
