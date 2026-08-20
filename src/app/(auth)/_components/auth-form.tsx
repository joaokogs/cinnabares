"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

type AuthFormProps = {
  mode: "login" | "register"
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRedirect = searchParams.get("redirect")
  const redirectTo = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : "/perfil"
  const isRegister = mode === "register"
  const [username, setUsername] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    const result = isRegister
      ? await authClient.signUp.email({
          name: username,
          username,
          email,
          password,
        })
      : identifier.includes("@")
        ? await authClient.signIn.email({ email: identifier, password })
        : await authClient.signIn.username({ username: identifier, password })

    setIsPending(false)

    if (result.error) {
      setError(result.error.message ?? "Não foi possível concluir a operação.")
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
      <CardHeader className="gap-2 pb-2">
        <CardTitle className="text-2xl">
          {isRegister ? "Entre para a guilda" : "Bem-vindo de volta"}
        </CardTitle>
        <CardDescription>
          {isRegister
            ? "Crie sua conta de player para acompanhar a guilda."
            : "Acesse sua conta para continuar sua jornada."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <>
              <label className="block space-y-2 text-sm font-medium" htmlFor="username">
                Username
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  minLength={3}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium" htmlFor="email">
                Email
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
              </label>
            </>
          ) : (
            <label className="block space-y-2 text-sm font-medium" htmlFor="identifier">
              Email ou username
              <input
                id="identifier"
                name="identifier"
                autoComplete="username"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </label>
          )}
          <label className="block space-y-2 text-sm font-medium" htmlFor="password">
            Senha
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </label>
          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="h-10 w-full" type="submit" disabled={isPending}>
            {isPending ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {isRegister ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
