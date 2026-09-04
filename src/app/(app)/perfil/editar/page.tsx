import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ArrowLeft, AtSign, Mail, ShieldCheck } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { getUserProfile } from "@/lib/users/account"
import { AvatarUploader } from "../_components/avatar-uploader"
import { ProfileForm } from "../_components/profile-form"

export const metadata: Metadata = {
  title: "Editar perfil",
}

export default async function EditProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/login")

  const player = await getUserProfile(session.user.id)

  if (!player) redirect("/login")

  const avatarUrl = player.image
    ? `/api/profile/avatar?path=${encodeURIComponent(player.image)}`
    : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6">
        <Link href="/perfil" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao perfil
        </Link>

        <Card className="border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
          <CardHeader>
            <CardTitle>Editar perfil</CardTitle>
            <CardDescription>Atualize as informações que aparecem no seu perfil público.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <AvatarUploader initialUrl={avatarUrl} username={player.username ?? player.name} />

            <ProfileForm initialName={player.name} initialUsername={player.username ?? ""} />

            <div className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <AtSign className="size-4 text-accent" aria-hidden="true" /> Username
                </div>
                <p className="mt-2 font-heading font-semibold">{player.username ?? "Não informado"}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <Mail className="size-4 text-accent" aria-hidden="true" /> Email
                </div>
                <p className="mt-2 break-all font-heading font-semibold">{player.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <p>Sua senha e protegida pelo Better Auth e nunca e exibida nesta pagina.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
