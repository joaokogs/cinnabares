"use client"

import { LoaderCircle, LogOut, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getErrorMessage, readApiError } from "@/lib/error-messages"

type GuildMembershipActionsProps = {
  guildId: string
  isFounder: boolean
  isMember: boolean
}

const CONFIRM_WORD = "Confirmar"

export function GuildMembershipActions({ guildId, isFounder, isMember }: GuildMembershipActionsProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  async function handleLeave() {
    setError(null)
    setIsLeaving(true)
    try {
      const response = await fetch(`/api/guilds/${guildId}/leave`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível sair da guilda. Tente novamente."))
      router.push("/guildas")
      router.refresh()
    } catch (err) {
      const fallback = "Não foi possível sair da guilda. Tente novamente."
      setError(err instanceof TypeError ? fallback : getErrorMessage(err, "Não foi possível sair da guilda. Tente novamente."))
      setIsLeaving(false)
    }
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (confirmText !== CONFIRM_WORD) return
    setError(null)
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/guilds/${guildId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmText }),
      })
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível excluir a guilda. Tente novamente."))
      router.push("/guildas")
      router.refresh()
    } catch (err) {
      const fallback = "Não foi possível excluir a guilda. Tente novamente."
      setError(err instanceof TypeError ? fallback : getErrorMessage(err, "Não foi possível excluir a guilda. Tente novamente."))
      setIsDeleting(false)
    }
  }

  if (isFounder) {
    return (
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) {
            setConfirmText("")
            setError(null)
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 aria-hidden="true" /> Excluir guilda
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir guilda</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os membros, cargos e convites serão removidos permanentemente. Para
              confirmar, digite <span className="font-semibold text-foreground">Confirmar</span> no campo abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleDelete(event)} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium" htmlFor="delete-guild-confirm">
              <span className="text-muted-foreground">
                Digite <span className="font-semibold text-foreground">Confirmar</span> para habilitar a exclusão
              </span>
              <input
                id="delete-guild-confirm"
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete="off"
                aria-describedby="delete-guild-help"
                className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </label>
            <p id="delete-guild-help" className="text-xs text-muted-foreground">
              O texto deve ser exato e diferencia maiúsculas de minúsculas.
            </p>
            {error ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={isDeleting || confirmText !== CONFIRM_WORD}>
                {isDeleting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                {isDeleting ? "Excluindo..." : "Excluir guilda"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  if (isMember) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <LogOut aria-hidden="true" /> Sair da guilda
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair da guilda</DialogTitle>
            <DialogDescription>
              Você perderá o acesso à guilda e precisará de um novo convite para voltar. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={() => void handleLeave()} disabled={isLeaving}>
              {isLeaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
              {isLeaving ? "Saindo..." : "Sair da guilda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
