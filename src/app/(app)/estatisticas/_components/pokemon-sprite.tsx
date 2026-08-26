"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { CircleDot } from "lucide-react"

const pokemonSpriteCache = new Map<string, string | null>()

export function PokemonSprite({ name, size = 48, className }: { name: string; size?: number; className?: string }) {
  const normalized = name.trim().toLowerCase()
  const [src, setSrc] = useState<string | null>(() => pokemonSpriteCache.get(normalized) ?? null)

  useEffect(() => {
    if (pokemonSpriteCache.has(normalized)) return

    let active = true
    fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(normalized)}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ id: number }>) : Promise.reject()))
      .then(({ id }) => {
        const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        pokemonSpriteCache.set(normalized, url)
        if (active) setSrc(url)
      })
      .catch(() => pokemonSpriteCache.set(normalized, null))

    return () => {
      active = false
    }
  }, [normalized])

  if (!src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-md bg-muted/40 ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <CircleDot className="size-5 text-muted-foreground" />
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 object-contain ${className ?? ""}`}
    />
  )
}
