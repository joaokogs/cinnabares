"use client"

import { LoaderCircle, User, Check, X } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { getAuthErrorMessage } from "@/lib/error-messages"
import { Button } from "@/components/ui/button"

type ProfileFormProps = {
  initialName: string
  initialUsername: string
}

export function ProfileForm({ initialName, initialUsername }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const hasChanges = name !== initialName || username !== initialUsername

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges) return

    setError(null)
    setSuccess(null)
    setIsPending(true)

    try {
      const result = await authClient.updateUser({
        name: name.trim(),
        username: username.trim() || undefined,
      })

      if (result.error) {
        const message = getAuthErrorMessage(result.error.message, "Não foi possível atualizar seu perfil. Confira os dados e tente novamente.")
        setError(message)
      } else {
        setSuccess("Perfil atualizado com sucesso.")
        router.refresh()
      }
    } catch {
      setError("Não foi possível conectar ao serviço de perfil. Tente novamente em instantes.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-sm font-medium" htmlFor="profile-name">
        Nome
        <input
          id="profile-name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="profile-username">
        Username
        <input
          id="profile-username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9][a-z0-9_-]*"
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30))}
          placeholder="seu-username"
          className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <span className="text-xs text-muted-foreground">Use minúsculas, números, hífens e underscores.</span>
      </label>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          <X className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-500">
          <Check className="size-4 shrink-0" aria-hidden="true" />
          {success}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending || !hasChanges} className="w-full">
        {isPending ? (
          <><LoaderCircle className="animate-spin" aria-hidden="true" /> Salvando...</>
        ) : (
          <><User className="size-4" aria-hidden="true" /> Salvar alterações</>
        )}
      </Button>
    </form>
  )
}
