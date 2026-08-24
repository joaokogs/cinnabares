"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PokeAutocomplete } from "@/components/ui/poke-autocomplete"
import { usePokeApiData } from "@/hooks/use-pokeapi-data"
import { readApiError } from "@/lib/error-messages"

type Props = {
  tournamentId: string
  format: "individual" | "guild"
  visibility: "blind" | "partial" | "total"
  tiers: string[]
  tierRules: Record<string, number>
  teamSize: number
  playerId: string
  guildId: string | null
  isGuildFounder: boolean
  status: string
}

export function RegistrationForm({ tournamentId, format, visibility, tiers, tierRules, teamSize, playerId, guildId, isGuildFounder, status }: Props) {
  const router = useRouter()
  const [tier, setTier] = useState(tiers[0] ?? "random")
  const [pokemon, setPokemon] = useState(Array.from({ length: 6 }, () => ({ name: "", item: "" })))
  const [guildRoster, setGuildRoster] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const { pokemon: pokemonOptions, items: itemOptions } = usePokeApiData()

  function updatePokemon(index: number, field: "name" | "item", value: string) {
    setPokemon((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    let roster: unknown[] = []
    if (format === "individual" && visibility !== "blind") roster = [{ playerId, tier, team: pokemon.map((entry) => ({ name: entry.name, ...(visibility === "total" ? { item: entry.item } : {}) })) }]
    if (format === "guild") {
      try { roster = JSON.parse(guildRoster) } catch { setError("A escalação da guilda precisa ser um JSON válido."); setPending(false); return }
    }
    const result = await fetch(`/api/tournaments/${tournamentId}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guildId, roster }) })
    setPending(false)
    if (!result.ok) { setError(await readApiError(result, "Não foi possível enviar sua inscrição. Confira os dados e tente novamente.")); return }
    router.refresh()
  }

  if (status !== "open") return <p className="text-sm text-muted-foreground">As inscrições estão fechadas.</p>
  if (format === "guild" && (!guildId || !isGuildFounder)) return <p className="text-sm text-muted-foreground">Apenas o líder de uma guilda pode enviar esta inscrição.</p>

  return <form className="space-y-4" onSubmit={submit}>
    {format === "guild" ? <label className="block space-y-2 text-sm font-medium">Escalação em JSON<textarea required value={guildRoster} onChange={(event) => setGuildRoster(event.target.value)} rows={8} placeholder={'[{"playerId":"id-do-player","tier":"overused","team":[{"name":"Garchomp"}]}]'} className="w-full rounded-lg border border-input bg-background/70 px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /><span className="block text-xs font-normal text-muted-foreground">Informe {teamSize} players. Tiers: {Object.entries(tierRules).map(([name, amount]) => `${name}: ${amount}`).join(", ")}.</span></label> : visibility === "blind" ? <p className="rounded-lg border border-border bg-background/50 p-3 text-sm text-muted-foreground">Você não precisa cadastrar o time agora.</p> : <><label className="block space-y-2 text-sm font-medium">Tier<select value={tier} onChange={(event) => setTier(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm">{tiers.map((currentTier) => <option key={currentTier}>{currentTier}</option>)}</select></label><fieldset className="space-y-2"><legend className="text-sm font-medium">Time de 6 Pokémon</legend>{pokemon.map((entry, index) => <div key={index} className="grid grid-cols-2 gap-2"><PokeAutocomplete id={`pokemon-${index}`} required value={entry.name} onChange={(value) => updatePokemon(index, "name", value)} options={pokemonOptions} kind="pokemon" placeholder={`Pokémon ${index + 1}`} />{visibility === "total" ? <PokeAutocomplete id={`item-${index}`} required value={entry.item} onChange={(value) => updatePokemon(index, "item", value)} options={itemOptions} kind="item" placeholder="Item" /> : null}</div>)}</fieldset></>}
    {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}<Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Enviar inscrição"}</Button>
  </form>
}
