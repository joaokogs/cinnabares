type ApiErrorPayload = { error?: unknown; message?: unknown }

export async function readApiError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as ApiErrorPayload
    if (typeof payload.error === "string" && payload.error.trim()) return payload.error
    if (typeof payload.message === "string" && payload.message.trim()) return payload.message
  } catch {
    return fallback
  }

  return fallback
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export function getAuthErrorMessage(message: string | undefined, fallback: string) {
  const normalized = message?.trim().toLowerCase() ?? ""

  if (normalized.includes("invalid password") || normalized.includes("invalid credentials") || normalized.includes("email or password")) {
    return "E-mail/username ou senha incorretos. Confira os dados e tente novamente."
  }
  if (normalized.includes("user not found") || normalized.includes("account not found")) {
    return "Não encontramos uma conta com esses dados. Confira o e-mail ou username."
  }
  if (normalized.includes("email already") || normalized.includes("email exists")) {
    return "Este e-mail já está cadastrado. Tente entrar ou use outro e-mail."
  }
  if (normalized.includes("username") && (normalized.includes("taken") || normalized.includes("already") || normalized.includes("exists"))) {
    return "Esse username já está em uso. Escolha outro."
  }
  if (normalized.includes("password") && (normalized.includes("short") || normalized.includes("minimum") || normalized.includes("at least"))) {
    return "A senha precisa ter pelo menos 8 caracteres."
  }
  if (normalized.includes("too many") || normalized.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente."
  }

  return fallback
}
