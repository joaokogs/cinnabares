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

function matchesInvalidCredentials(message: string) {
  return message.includes("invalid password") || message.includes("invalid credentials") || message.includes("email or password")
}

function matchesUnknownAccount(message: string) {
  return message.includes("user not found") || message.includes("account not found")
}

function matchesEmailTaken(message: string) {
  return message.includes("email already") || message.includes("email exists")
}

function matchesUsernameTaken(message: string) {
  return message.includes("username") && (message.includes("taken") || message.includes("already") || message.includes("exists"))
}

function matchesWeakPassword(message: string) {
  return message.includes("password") && (message.includes("short") || message.includes("minimum") || message.includes("at least"))
}

function matchesRateLimit(message: string) {
  return message.includes("too many") || message.includes("rate limit")
}

export function getAuthErrorMessage(message: string | undefined, fallback: string) {
  const normalized = message?.trim().toLowerCase() ?? ""

  if (matchesInvalidCredentials(normalized)) {
    return "E-mail/username ou senha incorretos. Confira os dados e tente novamente."
  }
  if (matchesUnknownAccount(normalized)) {
    return "Não encontramos uma conta com esses dados. Confira o e-mail ou username."
  }
  if (matchesEmailTaken(normalized)) {
    return "Este e-mail já está cadastrado. Tente entrar ou use outro e-mail."
  }
  if (matchesUsernameTaken(normalized)) {
    return "Esse username já está em uso. Escolha outro."
  }
  if (matchesWeakPassword(normalized)) {
    return "A senha precisa ter pelo menos 8 caracteres."
  }
  if (matchesRateLimit(normalized)) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente."
  }

  return fallback
}
