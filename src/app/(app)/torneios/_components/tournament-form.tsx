"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readApiError } from "@/lib/error-messages"

const tiers = ["overused", "underused", "neverused", "doubles", "random"] as const
const tierLabels = { overused: "OverUsed", underused: "UnderUsed", neverused: "NeverUsed", doubles: "Doubles", random: "Random" }

export function TournamentForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState<"individual" | "guild">("individual")
  const [selectedTiers, setSelectedTiers] = useState<string[]>(["overused"])
  const [tierRules, setTierRules] = useState<Record<string, number>>({ overused: 1 })
  const [slots, setSlots] = useState("8")
  const [visibility, setVisibility] = useState("blind")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [location, setLocation] = useState("")
  const [reward, setReward] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function toggleTier(tier: string) {
    setSelectedTiers((current) => current.includes(tier) ? current.filter((item) => item !== tier) : [...current, tier])
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, format, tiers: selectedTiers, tierRules, slots: Number(slots), visibility, scheduledDate, scheduledTime, location, reward }) })
    const body = result.ok ? await result.json() as { id?: string } : null
    setPending(false)
    if (!result.ok) { setError(await readApiError(result, "Não foi possível criar o torneio. Confira a configuração e tente novamente.")); return }
    if (!body?.id) { setError("O torneio foi criado, mas não foi possível abrir sua página."); return }
    router.push(`/torneios/${body.id}`)
    router.refresh()
  }

  return <Card className="border-border/70 bg-card/90"><CardHeader><CardTitle>Configuração da chave</CardTitle></CardHeader><CardContent><form className="space-y-5" onSubmit={submit}>
    <label className="block space-y-2 text-sm font-medium">Nome<input required value={name} onChange={(event) => setName(event.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
    <label className="block space-y-2 text-sm font-medium">Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background/70 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2 text-sm font-medium">Data<input required type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label><label className="block space-y-2 text-sm font-medium">Hora<input required type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label></div>
    <label className="block space-y-2 text-sm font-medium">Local no jogo<input required value={location} onChange={(event) => setLocation(event.target.value)} maxLength={200} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
    <label className="block space-y-2 text-sm font-medium">Recompensa<input value={reward} onChange={(event) => setReward(event.target.value)} maxLength={500} placeholder="Opcional" className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2 text-sm font-medium">Formato<select value={format} onChange={(event) => { const next = event.target.value as "individual" | "guild"; setFormat(next); setTierRules(next === "guild" ? { overused: 3, underused: 1, neverused: 1 } : { [selectedTiers[0] ?? "overused"]: 1 }) }} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm"><option value="individual">Individual</option><option value="guild">Guilda, 5 players</option></select></label><label className="block space-y-2 text-sm font-medium">Vagas<select value={slots} onChange={(event) => setSlots(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm">{[8, 16, 32, 64, 128].map((size) => <option key={size}>{size}</option>)}</select></label></div>
    <fieldset className="space-y-3"><legend className="text-sm font-medium">Tiers disponíveis</legend><div className="flex flex-wrap gap-2">{tiers.map((tier) => <label key={tier} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><input type="checkbox" checked={selectedTiers.includes(tier)} onChange={() => toggleTier(tier)} />{tierLabels[tier]}{format === "guild" && selectedTiers.includes(tier) ? <input aria-label={`Quantidade de ${tierLabels[tier]}`} type="number" min="0" max="5" value={tierRules[tier] ?? 0} onChange={(event) => setTierRules((current) => ({ ...current, [tier]: Number(event.target.value) }))} className="w-14 rounded border border-input bg-background px-2 py-1 text-center" /> : null}</label>)}</div>{format === "guild" ? <p className="text-xs text-muted-foreground">A composição precisa totalizar 5 players.</p> : null}</fieldset>
    <label className="block space-y-2 text-sm font-medium">Visibilidade do time<select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm"><option value="blind">Às cegas, sem cadastrar time</option><option value="partial">Parcial, mostra apenas Pokémon</option><option value="total">Total, mostra Pokémon e itens</option></select></label>
    {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}<Button type="submit" disabled={pending}>{pending ? "Criando..." : "Criar torneio"}</Button>
  </form></CardContent></Card>
}
