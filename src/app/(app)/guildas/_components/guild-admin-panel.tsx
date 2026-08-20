"use client"

import { ImagePlus, LoaderCircle, Plus, Save } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { GuildImage } from "@/components/shared/guild-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type GuildData = { id: string; name: string; tag: string; description: string; imageUrl: string | null }
type Role = { id: string; name: string; color: string; position: number; isDefault: boolean; permissions: Record<string, boolean> }

export function GuildAdminPanel({ guild, initialRoles }: { guild: GuildData & { bannerUrl: string | null }; initialRoles: Role[] }) {
  const router = useRouter()
  const imageRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(guild.name)
  const [tag, setTag] = useState(guild.tag)
  const [description, setDescription] = useState(guild.description)
  const [image, setImage] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
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
    if (image) formData.set("image", image)
    if (banner) formData.set("banner", banner)

    try {
      const response = await fetch(`/api/guilds/${guild.id}`, { method: "PATCH", body: formData })
      const result = (await response.json()) as { error?: string; tag?: string }
      if (!response.ok || !result.tag) throw new Error(result.error ?? "Nao foi possivel salvar as alteracoes.")
      router.push(`/guildas/${result.tag}/admin`)
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar as alteracoes.")
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
      const result = (await response.json()) as { error?: string; role?: { id: string; name: string; color: string } }
      if (!response.ok || !result.role) throw new Error(result.error ?? "Nao foi possivel criar o cargo.")
      setRoles((currentRoles) => [...currentRoles, { ...result.role!, position: currentRoles.length, isDefault: false, permissions: {} }])
      setRoleName("")
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Nao foi possivel criar o cargo.")
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
            {guild.imageUrl || image ? <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-background/40 p-3">{guild.imageUrl && !image ? <GuildImage src={guild.imageUrl} alt="Imagem atual da guilda" width={64} height={64} className="size-16 rounded-xl object-cover" /> : <div className="grid size-16 place-items-center rounded-xl bg-accent/15 text-accent"><ImagePlus aria-hidden="true" /></div>}<span className="text-sm text-muted-foreground">{image ? image.name : "Imagem atual"}</span></div> : null}
            <label className="block space-y-2 text-sm font-medium" htmlFor="admin-guild-name">Nome<input id="admin-guild-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            <label className="block space-y-2 text-sm font-medium" htmlFor="admin-guild-tag">Tag<input id="admin-guild-tag" required minLength={1} maxLength={4} pattern="[a-z0-9][a-z0-9-]{0,3}" value={tag} onChange={(event) => setTag(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 4))} className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            <label className="block space-y-2 text-sm font-medium" htmlFor="admin-guild-description">Descricao<textarea id="admin-guild-description" maxLength={500} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full resize-y rounded-lg border border-input bg-background/70 px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label>
            <button type="button" onClick={() => imageRef.current?.click()} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border/80 bg-background/40 px-4 py-4 text-left text-sm transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ImagePlus className="size-5 text-accent" aria-hidden="true" /> Escolher nova imagem</button>
            <input ref={imageRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
            {guild.bannerUrl || banner ? <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-background/40 p-3">{guild.bannerUrl && !banner ? <GuildImage src={guild.bannerUrl} alt="Banner atual da guilda" width={160} height={64} className="h-16 w-40 rounded-xl object-cover" /> : <div className="grid h-16 w-40 place-items-center rounded-xl bg-accent/15 text-accent"><ImagePlus aria-hidden="true" /></div>}<span className="text-sm text-muted-foreground">{banner ? banner.name : "Banner atual"}</span></div> : null}
            <button type="button" onClick={() => bannerRef.current?.click()} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border/80 bg-background/40 px-4 py-4 text-left text-sm transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ImagePlus className="size-5 text-accent" aria-hidden="true" /> Escolher novo banner</button>
            <input ref={bannerRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setBanner(event.target.files?.[0] ?? null)} />
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
