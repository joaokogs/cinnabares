import { Swords } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ItemSprite } from "@/app/(app)/estatisticas/_components/item-sprite"
import { PokemonSprite } from "@/app/(app)/estatisticas/_components/pokemon-sprite"
import { titleCase } from "@/lib/tournaments/stats-core"
import type { PokemonItemUsage } from "@/lib/tournaments/stats-core"

export function PlayerTopPokemon({ favorite }: { favorite: PokemonItemUsage[] }) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="size-5 text-accent" aria-hidden="true" /> Pokémon mais usados
        </CardTitle>
        <CardDescription>Seus 6 Pokémon mais usados e os itens equipados nos torneios.</CardDescription>
      </CardHeader>
      <CardContent>
        {favorite.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem times registrados ainda.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {favorite.map((pokemon) => (
              <li key={pokemon.name} className="rounded-xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-3">
                  <PokemonSprite name={pokemon.name} size={48} />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-semibold">{titleCase(pokemon.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {pokemon.uses} uso{pokemon.uses === 1 ? "" : "s"} em torneios
                    </p>
                  </div>
                </div>
                {pokemon.items.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pokemon.items.map((item) => (
                      <span
                        key={item.name}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-xs"
                      >
                        <ItemSprite name={item.name} size={18} />
                        <span className="font-medium">{titleCase(item.name)}</span>
                        <span className="text-muted-foreground">×{item.count}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Sem itens registrados.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
