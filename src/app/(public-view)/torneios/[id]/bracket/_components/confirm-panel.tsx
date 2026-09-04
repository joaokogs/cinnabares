"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConfirmAction } from "./types"

export function ConfirmPanel({
  action,
  onConfirm,
  onCancel,
  onLoserScoreChange,
}: {
  action: ConfirmAction
  onConfirm: () => void
  onCancel: () => void
  onLoserScoreChange: (loserScore: 0 | 1 | 2) => void
}) {
  return (
    <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 space-y-3">
      <p className="text-sm font-medium">
        {action.type === "resolve"
          ? <>Definir <strong>{action.label}</strong> como vencedor?</>
          : <>Desfazer o resultado de <strong>{action.label}</strong>?</>
        }
      </p>
      {action.type === "resolve" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Placar da série (melhor de 5):</span>
          <div role="group" aria-label="Placar da série" className="flex gap-2">
            {([0, 1, 2] as const).map((loserScore) => {
              const selected = (action.loserScore ?? 0) === loserScore
              return (
                <button
                  key={loserScore}
                  type="button"
                  onClick={() => onLoserScoreChange(loserScore)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    selected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-background/50 text-muted-foreground hover:bg-muted",
                  )}
                  aria-pressed={selected}
                >
                  Vencedor: 3 – {loserScore}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm}>Confirmar</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}