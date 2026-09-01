import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PlayerStatus } from "@/lib/users/queries"

import { PLAYERS_PATH } from "./player-filters"

type PlayerPaginationProps = {
  page: number
  totalPages: number
  params: { q?: string; guild?: string; status: PlayerStatus }
}

function buildHref(params: PlayerPaginationProps["params"], page: number) {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.guild) search.set("guild", params.guild)
  if (params.status !== "all") search.set("status", params.status)
  search.set("page", String(page))
  return `${PLAYERS_PATH}?${search.toString()}`
}

export function PlayerPagination({ page, totalPages, params }: PlayerPaginationProps) {
  if (totalPages <= 1) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Paginação de players">
      {prevDisabled ? (
        <Button variant="outline" size="sm" disabled aria-disabled="true">
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(params, page - 1)} rel="prev">
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Link>
        </Button>
      )}

      <span className="text-sm text-muted-foreground" aria-live="polite">
        Página {page} de {totalPages}
      </span>

      {nextDisabled ? (
        <Button variant="outline" size="sm" disabled aria-disabled="true">
          Próxima
          <ChevronRight aria-hidden="true" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(params, page + 1)} rel="next">
            Próxima
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      )}
    </nav>
  )
}
