"use client"

import { Check, Copy, LinkIcon, LoaderCircle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage, readApiError } from "@/lib/error-messages"

type InvitePanelProps = { guildId: string }

export function InvitePanel({ guildId }: InvitePanelProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsGenerating(true)
    setCopied(false)

    try {
      const response = await fetch(`/api/guilds/${guildId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const result = response.ok ? await response.json() as { url?: string } : null
      if (!response.ok || !result?.url) throw new Error(await readApiError(response, "Não foi possível gerar o convite. Tente novamente."))
      setInviteUrl(result.url)
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível gerar o convite. Tente novamente."))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = inviteUrl
      textarea.setAttribute("readonly", "")
      textarea.style.position = "absolute"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        setError("Não foi possível copiar o link. Copie o endereço manualmente e tente novamente.")
      }
      document.body.removeChild(textarea)
    }
  }

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="size-5 text-accent" aria-hidden="true" />
          Convites
        </CardTitle>
        <CardDescription>Gere um link de convite para novos membros entrarem na guilda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex gap-3" onSubmit={(event) => void handleGenerate(event)}>
          <Button className="flex-1" variant="outline" type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <><LoaderCircle className="animate-spin" aria-hidden="true" /> Gerando...</>
            ) : (
              <><LinkIcon aria-hidden="true" /> Gerar link de convite</>
            )}
          </Button>
        </form>

        {inviteUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/40 p-3">
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{inviteUrl}</span>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => void handleCopy()}
                aria-label={copied ? "Link copiado" : "Copiar link de convite"}
              >
                {copied ? <Check className="size-4 text-green-500" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">Qualquer pessoa com este link poderá entrar na guilda.</p>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
