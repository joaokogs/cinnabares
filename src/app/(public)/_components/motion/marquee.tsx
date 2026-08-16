import { cn } from "@/lib/utils"

type MarqueeProps = {
  items: string[]
  className?: string
}

export function Marquee({ items, className }: MarqueeProps) {
  const row = items.join("  ·  ")

  return (
    <div
      aria-hidden="true"
      className={cn("marquee relative flex w-full overflow-hidden", className)}
    >
      <div className="marquee-track flex w-max shrink-0 items-center whitespace-nowrap">
        <span className="px-5 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          {row}
        </span>
        <span className="px-5 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          {row}
        </span>
      </div>
    </div>
  )
}
