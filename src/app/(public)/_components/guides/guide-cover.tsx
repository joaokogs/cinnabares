import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import type { GuideMode } from "@/lib/guides/types"
import { cn } from "@/lib/utils"

type GuideCoverProps = {
  url: string
  alt: string
  mode?: GuideMode
  className?: string
  priority?: boolean
  sizes?: string
}

export function GuideCover({
  url,
  alt,
  mode,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 400px",
}: GuideCoverProps) {
  return (
    <div className={cn("relative overflow-hidden bg-black/40", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {mode ? (
        <Badge
          variant="outline"
          className={cn(
            "absolute top-3 left-3 border-transparent text-[0.7rem] uppercase tracking-wide backdrop-blur-md",
            mode === "pvp"
              ? "bg-accent/90 text-accent-foreground"
              : "bg-emerald-500/90 text-emerald-950"
          )}
        >
          {mode === "pvp" ? "PvP" : "PvE"}
        </Badge>
      ) : null}
    </div>
  )
}