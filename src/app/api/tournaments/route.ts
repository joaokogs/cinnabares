import { randomUUID } from "node:crypto"
import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { tournament } from "@/db/schema"
import type { TournamentTier } from "@/db/schema"
import { getAdminSession } from "@/lib/tournaments/auth"
import { listTournaments } from "@/lib/tournaments/queries"

const validSlots = new Set([8, 16, 32, 64, 128])
const validTiers = new Set(["overused", "underused", "neverused", "doubles", "random"])
const validVisibility = new Set(["blind", "partial", "total"])

function readTournamentInput(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Não recebemos os dados do torneio. Revise o formulário e tente novamente." as const }

  const input = body as Record<string, unknown>
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const description = typeof input.description === "string" ? input.description.trim() : ""
  const format = input.format === "individual" || input.format === "guild" ? input.format : null
  const tiers = Array.isArray(input.tiers) ? input.tiers.filter((tier): tier is string => typeof tier === "string") : []
  const slots = typeof input.slots === "number" ? input.slots : Number(input.slots)
  const visibility = typeof input.visibility === "string" ? input.visibility : ""
  const rawRules = input.tierRules && typeof input.tierRules === "object" ? input.tierRules as Record<string, unknown> : {}
  const tierRules = Object.fromEntries(Object.entries(rawRules).map(([tier, amount]) => [tier, Number(amount)]))

  if (name.length < 3 || name.length > 100) return { error: "O nome deve ter entre 3 e 100 caracteres." as const }
  if (description.length > 1000) return { error: "A descrição deve ter no máximo 1000 caracteres." as const }
  if (!format) return { error: "Escolha se o torneio será individual ou por guildas." as const }
  if (!tiers.length || tiers.some((tier) => !validTiers.has(tier))) return { error: "Escolha pelo menos um tier válido para o torneio." as const }
  if (format === "individual" && tiers.length !== 1) return { error: "Torneios individuais devem ter exatamente um tier." as const }
  if (!validSlots.has(slots)) return { error: "Escolha uma quantidade de vagas: 8, 16, 32, 64 ou 128." as const }
  if (!validVisibility.has(visibility)) return { error: "Escolha como os times serão exibidos durante a inscrição." as const }

  const normalizedRules = Object.fromEntries(tiers.map((tier) => [tier, Math.max(0, Math.floor(tierRules[tier] ?? 0))]))
  if (format === "guild" && Object.values(normalizedRules).reduce((sum, amount) => sum + amount, 0) !== 5) {
    return { error: "A composição da equipe deve totalizar exatamente 5 players." as const }
  }

  return {
    value: {
      name,
      description,
      format: format as "individual" | "guild",
      tiers: tiers as TournamentTier[],
      tierRules: normalizedRules,
      slots,
      visibility: visibility as "blind" | "partial" | "total",
      teamSize: format === "guild" ? 5 : 1,
    },
  }
}

export async function GET() {
  return Response.json(await listTournaments())
}

export async function POST(request: Request) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const parsed = readTournamentInput(await request.json())
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 })

  const id = randomUUID()
  await db.insert(tournament).values({ id, createdBy: admin.session.user.id, ...parsed.value })

  return Response.json({ id }, { status: 201 })
}
