"use client"

import Image from "next/image"
import { Package } from "lucide-react"
import { useState } from "react"

export function ItemSprite({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(
    name.trim().toLowerCase(),
  )}.png`

  if (failed) {
    return <Package className={`shrink-0 text-muted-foreground ${className ?? ""}`} style={{ width: size, height: size }} aria-hidden="true" />
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 object-contain ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  )
}
