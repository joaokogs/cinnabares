"use client"

import { LoaderCircle } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage, readApiError } from "@/lib/error-messages"

export function NewGuildForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("tag", tag)

    try {
      const response = await fetch("/api/guilds", { method: "POST", body: formData })
      const result = response.ok ? await response.json() as { tag?: string } : null
      if (!response.ok || !result?.tag) throw new Error(await readApiError(response, "Não foi possível criar sua guilda. Confira os dados e tente novamente."))
      router.push(`/guildas/${result.tag}`)
      router.refresh()
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Não foi possível criar sua guilda. Tente novamente em instantes."))
      setIsPending(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
      <CardHeader>
        <CardTitle>Identidade da guilda</CardTitle>
        <CardDescription>O fundador e o cargo Founder serao criados automaticamente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2 text-sm font-medium" htmlFor="guild-name">
            Nome
            <input id="guild-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="guild-tag">
            Tag
            <input id="guild-tag" required minLength={1} maxLength={4} pattern="[a-z0-9][a-z0-9-]{0,3}" value={tag} onChange={(event) => setTag(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 4))} placeholder="CNB" className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" />
             <span className="text-xs text-muted-foreground">Até 4 caracteres, sem espaços.</span>
          </label>
          {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? <><LoaderCircle className="animate-spin" aria-hidden="true" /> Criando...</> : "Criar guilda"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
