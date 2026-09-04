import type { TournamentTier } from "@/db/schema"

const validSlots = new Set([8, 16, 32, 64, 128])
const validTiers = new Set(["overused", "underused", "neverused", "doubles", "random"])
const validVisibility = new Set(["blind", "partial", "total"])

export type TournamentInput = {
  name: string
  description: string
  format: "individual" | "guild"
  tiers: TournamentTier[]
  tierRules: Record<string, number>
  slots: number
  visibility: "blind" | "partial" | "total"
  scheduledDate: string
  scheduledTime: string
  location: string
  reward: string
  teamSize: number
}

type RawInput = {
  name: string
  description: string
  format: "individual" | "guild" | null
  tiers: string[]
  slots: number
  visibility: string
  scheduledDate: string
  scheduledTime: string
  location: string
  reward: string | null
  tierRules: Record<string, number>
}

function extractReward(input: Record<string, unknown>): string | null {
  if (input.reward === undefined) return ""
  return typeof input.reward === "string" ? input.reward.trim() : null
}

function extractTierRules(input: Record<string, unknown>): Record<string, number> {
  const rawRules = input.tierRules && typeof input.tierRules === "object" ? input.tierRules as Record<string, unknown> : {}
  return Object.fromEntries(Object.entries(rawRules).map(([tier, amount]) => [tier, Number(amount)]))
}

function extractTiers(input: Record<string, unknown>): string[] {
  return Array.isArray(input.tiers) ? input.tiers.filter((tier): tier is string => typeof tier === "string") : []
}

function extractFormat(input: Record<string, unknown>): "individual" | "guild" | null {
  return input.format === "individual" || input.format === "guild" ? input.format : null
}

function extractRawInput(body: unknown): RawInput | null {
  if (!body || typeof body !== "object") return null

  const input = body as Record<string, unknown>
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const description = typeof input.description === "string" ? input.description.trim() : ""
  const format = extractFormat(input)
  const tiers = extractTiers(input)
  const slots = typeof input.slots === "number" ? input.slots : Number(input.slots)
  const visibility = typeof input.visibility === "string" ? input.visibility : ""
  const scheduledDate = typeof input.scheduledDate === "string" ? input.scheduledDate.trim() : ""
  const scheduledTime = typeof input.scheduledTime === "string" ? input.scheduledTime.trim() : ""
  const location = typeof input.location === "string" ? input.location.trim() : ""

  return {
    name,
    description,
    format,
    tiers,
    slots,
    visibility,
    scheduledDate,
    scheduledTime,
    location,
    reward: extractReward(input),
    tierRules: extractTierRules(input),
  }
}

function firstError(validators: Array<() => string | null>): string | null {
  for (const validate of validators) {
    const error = validate()
    if (error) return error
  }
  return null
}

function validateName(name: string): string | null {
  if (name.length < 3 || name.length > 100) return "O nome deve ter entre 3 e 100 caracteres."
  return null
}

function validateDescription(description: string): string | null {
  if (description.length > 1000) return "A descrição deve ter no máximo 1000 caracteres."
  return null
}

function validateFormat(format: "individual" | "guild" | null): string | null {
  if (!format) return "Escolha se o torneio será individual ou por guildas."
  return null
}

function validateTiers(tiers: string[], format: "individual" | "guild" | null): string | null {
  if (!tiers.length || tiers.some((tier) => !validTiers.has(tier))) return "Escolha pelo menos um tier válido para o torneio."
  if (format === "individual" && tiers.length !== 1) return "Torneios individuais devem ter exatamente um tier."
  return null
}

function validateSlots(slots: number): string | null {
  if (!validSlots.has(slots)) return "Escolha uma quantidade de vagas: 8, 16, 32, 64 ou 128."
  return null
}

function validateVisibility(visibility: string): string | null {
  if (!validVisibility.has(visibility)) return "Escolha como os times serão exibidos durante a inscrição."
  return null
}

function validateScheduledDate(scheduledDate: string): string | null {
  const dateParts = scheduledDate.split("-").map(Number)
  const [year, month, day] = dateParts
  const parsedDate = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 0))
  if (
    dateParts.length !== 3 ||
    dateParts.some((part) => Number.isNaN(part)) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) return "Informe uma data válida do torneio no formato AAAA-MM-DD."
  return null
}

function validateScheduledTime(scheduledTime: string): string | null {
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(scheduledTime)
  const hour = timeMatch ? Number(timeMatch[1]) : NaN
  const minute = timeMatch ? Number(timeMatch[2]) : NaN
  const second = timeMatch && timeMatch[3] ? Number(timeMatch[3]) : 0
  if (!timeMatch || Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59 || second > 59) {
    return "Informe uma hora válida do torneio no formato HH:MM."
  }
  return null
}

function validateSchedule(scheduledDate: string, scheduledTime: string): string | null {
  const dateError = validateScheduledDate(scheduledDate)
  if (dateError) return dateError
  return validateScheduledTime(scheduledTime)
}

function validateLocation(location: string): string | null {
  if (!location) return "Informe o local no jogo do torneio."
  if (location.length > 200) return "O local deve ter no máximo 200 caracteres."
  return null
}

function validateReward(reward: string | null): string | null {
  if (reward === null) return "A recompensa deve ser informada como texto."
  if (reward.length > 500) return "A recompensa deve ter no máximo 500 caracteres."
  return null
}

function validateTierRules(
  format: "individual" | "guild" | null,
  tiers: string[],
  tierRules: Record<string, number>,
): { rules: Record<string, number> } | { error: string } {
  const normalizedRules = Object.fromEntries(tiers.map((tier) => [tier, Math.max(0, Math.floor(tierRules[tier] ?? 0))]))
  if (format === "guild" && Object.values(normalizedRules).reduce((sum, amount) => sum + amount, 0) !== 5) {
    return { error: "A composição da equipe deve totalizar exatamente 5 players." }
  }
  return { rules: normalizedRules }
}

export function readTournamentInput(body: unknown) {
  const raw = extractRawInput(body)
  if (!raw) return { error: "Não recebemos os dados do torneio. Revise o formulário e tente novamente." as const }

  const error = firstError([
    () => validateName(raw.name),
    () => validateDescription(raw.description),
    () => validateFormat(raw.format),
    () => validateTiers(raw.tiers, raw.format),
    () => validateSlots(raw.slots),
    () => validateVisibility(raw.visibility),
    () => validateSchedule(raw.scheduledDate, raw.scheduledTime),
    () => validateLocation(raw.location),
    () => validateReward(raw.reward),
  ])
  if (error) return { error }

  const tierRulesResult = validateTierRules(raw.format, raw.tiers, raw.tierRules)
  if ("error" in tierRulesResult) return { error: tierRulesResult.error }

  return {
    value: {
      name: raw.name,
      description: raw.description,
      format: raw.format as "individual" | "guild",
      tiers: raw.tiers as TournamentTier[],
      tierRules: tierRulesResult.rules,
      slots: raw.slots,
      visibility: raw.visibility as "blind" | "partial" | "total",
      scheduledDate: raw.scheduledDate,
      scheduledTime: raw.scheduledTime,
      location: raw.location,
      reward: raw.reward ?? "",
      teamSize: raw.format === "guild" ? 5 : 1,
    },
  }
}