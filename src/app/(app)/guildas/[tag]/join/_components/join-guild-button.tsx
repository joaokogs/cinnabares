"use client"

import { LoaderCircle, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"

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
      const result = (await response.json()) as { error?: string; tag?: string }
      if (!response.ok) throw new Error(result.error ?? "Nao foi possivel entrar na guilda.")
      router.push(`/guildas/${result.tag ?? tag}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel entrar na guilda.")
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
