import { BookOpen } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function GuidesEmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-background/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
        <BookOpen className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-heading text-lg font-semibold">Guias a caminho</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        A biblioteca da guilda está sendo escrita. Volte em breve para encontrar
        farms, caçadas a shinys e estratégias da comunidade.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/guias">Acompanhar novidades</Link>
      </Button>
    </div>
  )
}
