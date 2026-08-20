import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AtSign, Mail, ShieldCheck } from "lucide-react"
import { eq } from "drizzle-orm"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { AvatarUploader } from "./_components/avatar-uploader"
import { SignOutButton } from "./_components/sign-out-button"
import { ProfileForm } from "./_components/profile-form"

export const metadata: Metadata = {
  title: "Meu perfil",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const [player] = await db
    .select({ name: user.name, username: user.username, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!player) {
    redirect("/login")
  }

  const avatarUrl = player.image
    ? `/api/profile/avatar?path=${encodeURIComponent(player.image)}`
    : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 size-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Area do player</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Seu perfil</h1>
          </div>
          <SignOutButton />
        </div>

        <Card className="border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
          <CardHeader>
            <CardTitle>Detalhes da conta</CardTitle>
            <CardDescription>Gerencie sua identidade dentro da guilda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <AvatarUploader initialUrl={avatarUrl} username={player.username ?? player.name} />

            <div className="border-t border-border/70 pt-6">
              <h2 className="mb-4 font-heading text-lg font-semibold">Editar perfil</h2>
              <ProfileForm
                initialName={player.name}
                initialUsername={player.username ?? ""}
              />
            </div>

            <div className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <AtSign className="size-4 text-accent" aria-hidden="true" /> Username
                </div>
                <p className="mt-2 font-heading font-semibold">{player.username ?? "Nao informado"}</p>
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
