"use client"

import { LoaderCircle, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { getErrorMessage, readApiError } from "@/lib/error-messages"

type JoinGuildButtonProps = { tag: string; token: string }

export function JoinGuildButton({ tag, token }: JoinGuildButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsJoining(true)

    try {
      const response = await fetch("/api/guilds/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const result = response.ok ? await response.json() as { tag?: string } : null
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível entrar na guilda. Verifique o convite e tente novamente."))
      router.push(`/guildas/${result?.tag ?? tag}`)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar na guilda. Tente novamente em instantes."))
      setIsJoining(false)
    }
  }

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isJoining}>
        {isJoining ? (
          <><LoaderCircle className="animate-spin" aria-hidden="true" /> Entrando...</>
        ) : (
          <><LogIn aria-hidden="true" /> Entrar na guilda</>
        )}
      </Button>
    </form>
  )
}
