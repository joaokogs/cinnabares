"use client"

import { LoaderCircle, Plus, Save } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { GuildMediaUploader } from "@/components/shared/guild-media-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage, readApiError } from "@/lib/error-messages"

type GuildData = { id: string; name: string; tag: string; description: string; imageUrl: string | null; bannerUrl: string | null }
type Role = { id: string; name: string; color: string; position: number; isDefault: boolean; permissions: Record<string, boolean> }

export function GuildAdminPanel({ guild, initialRoles }: { guild: GuildData; initialRoles: Role[] }) {
  const router = useRouter()
  const [name, setName] = useState(guild.name)
  const [tag, setTag] = useState(guild.tag)
  const [description, setDescription] = useState(guild.description)
  const [roles, setRoles] = useState(initialRoles)
  const [roleName, setRoleName] = useState("")
  const [roleColor, setRoleColor] = useState("#ff5b4f")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingRole, setIsCreatingRole] = useState(false)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)
    const formData = new FormData()
    formData.set("name", name)
    formData.set("tag", tag)
    formData.set("description", description)

    try {
      const response = await fetch(`/api/guilds/${guild.id}`, { method: "PATCH", body: formData })
      const result = response.ok ? await response.json() as { tag?: string } : null
      if (!response.ok || !result?.tag) throw new Error(await readApiError(response, "Não foi possível salvar as alterações da guilda."))
      router.push(`/guildas/${result.tag}/admin`)
      router.refresh()
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Não foi possível salvar as alterações da guilda. Tente novamente."))
      setIsSaving(false)
    }
  }

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsCreatingRole(true)
    try {
      const response = await fetch(`/api/guilds/${guild.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, color: roleColor }),
      })
      const result = response.ok ? await response.json() as { role?: { id: string; name: string; color: string } } : null
      if (!response.ok || !result?.role) throw new Error(await readApiError(response, "Não foi possível criar o cargo. Confira o nome e tente novamente."))
      setRoles((currentRoles) => [...currentRoles, { ...result.role!, position: currentRoles.length, isDefault: false, permissions: {} }])
      setRoleName("")
    } catch (roleError) {
      setError(getErrorMessage(roleError, "Não foi possível criar o cargo. Tente novamente."))
    } finally {
      setIsCreatingRole(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-border/70 bg-card/90">
        <CardHeader><CardTitle>Informacoes publicas</CardTitle><CardDescription>Esses dados aparecem na pagina da guilda.</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSave}>
            <GuildMediaUploader guildId={guild.id} type="avatar" initialUrl={guild.imageUrl} guildName={guild.name} />
            <GuildMediaUploader guildId={guild.id} type="banner" initialUrl={guild.bannerUrl} guildName={guild.name} />
            <label className="block space-y-2 text-sm font-medium" htmlFor="admin-guild-name">Nome<input id="admin-guild-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            <label className="block space-y-2 text-sm font-medium" htmlFor="admin-guild-tag">Tag<input id="admin-guild-tag" required minLength={1} maxLength={4} pattern="[a-z0-9][a-z0-9-]{0,3}" value={tag} onChange={(event) => setTag(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 4))} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            <label className="block space-y-2 text-sm font-medium" htmlFor="admin-guild-description">Descricao<textarea id="admin-guild-description" maxLength={500} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full resize-y rounded-lg border border-input bg-background/70 px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSaving}><Save aria-hidden="true" /> {isSaving ? "Salvando..." : "Salvar informacoes"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader><CardTitle>Cargos</CardTitle><CardDescription>Permissoes serao vinculadas aos cargos em uma proxima etapa.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">{roles.map((role) => <div key={role.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/40 px-3 py-2.5"><div className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: role.color }} aria-hidden="true" /><span className="font-medium">{role.name}</span></div>{role.isDefault ? <span className="text-xs text-muted-foreground">padrao</span> : null}</div>)}</div>
          <form className="space-y-3 border-t border-border/70 pt-5" onSubmit={handleCreateRole}>
            <label className="block space-y-2 text-sm font-medium" htmlFor="role-name">Novo cargo<input id="role-name" required minLength={2} maxLength={40} value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Moderador" className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            <label className="flex items-center justify-between gap-3 text-sm font-medium" htmlFor="role-color">Cor<input id="role-color" type="color" value={roleColor} onChange={(event) => setRoleColor(event.target.value)} className="size-10 cursor-pointer rounded-lg border border-input bg-background/70 p-1" /></label>
            <Button className="w-full" variant="outline" type="submit" disabled={isCreatingRole}>{isCreatingRole ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />} {isCreatingRole ? "Criando..." : "Criar cargo"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
