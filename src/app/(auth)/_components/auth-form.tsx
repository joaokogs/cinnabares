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
import { getAuthErrorMessage } from "@/lib/error-messages"

type AuthFormProps = {
  mode: "login" | "register"
}

type AuthCopy = {
  title: string
  description: string
  submitLabel: string
  switchPrompt: string
  switchHref: "/login" | "/register"
  switchLabel: string
}

const COPY: Record<"login" | "register", AuthCopy> = {
  login: {
    title: "Bem-vindo de volta",
    description: "Acesse sua conta para continuar sua jornada.",
    submitLabel: "Entrar",
    switchPrompt: "Ainda não possui uma conta?",
    switchHref: "/register",
    switchLabel: "Criar conta",
  },
  register: {
    title: "Entre para a guilda",
    description: "Crie sua conta de player para acompanhar a guilda.",
    submitLabel: "Criar conta",
    switchPrompt: "Já possui uma conta?",
    switchHref: "/login",
    switchLabel: "Entrar",
  },
}

type AuthFieldsProps = {
  mode: "login" | "register"
  username: string
  email: string
  identifier: string
  onUsernameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onIdentifierChange: (value: string) => void
}

function AuthFields({
  mode,
  username,
  email,
  identifier,
  onUsernameChange,
  onEmailChange,
  onIdentifierChange,
}: AuthFieldsProps) {
  if (mode === "register") {
    return (
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
            onChange={(event) => onUsernameChange(event.target.value)}
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
            onChange={(event) => onEmailChange(event.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </label>
      </>
    )
  }

  return (
    <label className="block space-y-2 text-sm font-medium" htmlFor="identifier">
      Email ou username
      <input
        id="identifier"
        name="identifier"
        autoComplete="username"
        required
        value={identifier}
        onChange={(event) => onIdentifierChange(event.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
    </label>
  )
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRedirect = searchParams.get("redirect")
  const redirectTo = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : "/perfil"
  const isRegister = mode === "register"
  const copy = COPY[mode]
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

    try {
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

      if (result.error) {
        setError(getAuthErrorMessage(result.error.message, isRegister ? "Não foi possível criar sua conta. Confira os dados e tente novamente." : "Não foi possível entrar. Confira seus dados e tente novamente."))
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError("Não foi possível conectar ao serviço de autenticação. Tente novamente em instantes.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur">
      <CardHeader className="gap-2 pb-2">
        <CardTitle className="text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <AuthFields
            mode={mode}
            username={username}
            email={email}
            identifier={identifier}
            onUsernameChange={setUsername}
            onEmailChange={setEmail}
            onIdentifierChange={setIdentifier}
          />
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
            {isPending ? "Aguarde..." : copy.submitLabel}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.switchPrompt}{" "}
          <Link
            href={copy.switchHref}
            className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {copy.switchLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
