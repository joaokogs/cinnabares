import { and, eq, inArray, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db"
import { guild, guildMember, tournamentRegistration } from "@/db/schema"
import type { TournamentRosterEntry, TournamentTier } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getTournament, listTournamentRegistrations } from "@/lib/tournaments/queries"
import { getAdminSession } from "@/lib/tournaments/auth"

type RouteProps = { params: Promise<{ id: string }> }
const validTiers = new Set<TournamentTier>(["overused", "underused", "neverused", "doubles", "random"])

function normalizeRoster(value: unknown): TournamentRosterEntry[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => {
    const item = entry as Record<string, unknown>
    const team = Array.isArray(item.team)
      ? item.team.map((pokemon) => {
          const current = pokemon as Record<string, unknown>
          return { name: typeof current.name === "string" ? current.name.trim() : "", item: typeof current.item === "string" ? current.item.trim() : undefined }
        })
      : undefined
    return { playerId: typeof item.playerId === "string" ? item.playerId : "", tier: typeof item.tier === "string" ? item.tier as TournamentTier : "random", team }
  })
}

function validateRoster(roster: TournamentRosterEntry[], visibility: "blind" | "partial" | "total", expectedSize: number, allowedTiers: TournamentTier[], tierRules: Partial<Record<TournamentTier, number>>) {
  if (visibility === "blind" && expectedSize === 1 && roster.length === 0) return null
  if (roster.length !== expectedSize) return `A inscrição precisa escalar ${expectedSize} player${expectedSize === 1 ? "" : "s"}.`
  if (roster.some((entry) => !entry.playerId || !allowedTiers.includes(entry.tier))) return "Há um player ou tier inválido na escalação."
  const tierCounts = new Map<TournamentTier, number>()
  for (const entry of roster) tierCounts.set(entry.tier, (tierCounts.get(entry.tier) ?? 0) + 1)
  for (const tier of allowedTiers) {
    if ((tierCounts.get(tier) ?? 0) !== (tierRules[tier] ?? (expectedSize === 1 ? 1 : 0))) return "A escalação não respeita a composição de tiers do torneio."
  }
  if (visibility !== "blind" && roster.some((entry) => !entry.team || entry.team.length !== 6 || entry.team.some((pokemon) => !pokemon.name))) return "Cada player deve informar exatamente 6 Pokémon."
  if (visibility === "total" && roster.some((entry) => entry.team?.some((pokemon) => !pokemon.item))) return "Cada Pokémon precisa informar um item nesta modalidade."
  return null
}

export async function GET(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response
  const { id } = await params
  const tournamentData = await getTournament(id)
  if (!tournamentData) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
  return Response.json(await listTournamentRegistrations(id))
}

export async function POST(request: Request, { params }: RouteProps) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para se inscrever." }, { status: 401 })

  const { id: tournamentId } = await params
  const tournamentData = await getTournament(tournamentId)
  if (!tournamentData) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
  if (tournamentData.status !== "open") return Response.json({ error: "As inscrições estão fechadas no momento." }, { status: 409 })

  const body = await request.json() as { guildId?: string; roster?: unknown }
  const roster = normalizeRoster(body.roster)
  const rosterError = validateRoster(roster, tournamentData.visibility, tournamentData.teamSize, tournamentData.tiers, tournamentData.tierRules)
  if (rosterError) return Response.json({ error: `Revise a escalação: ${rosterError}` }, { status: 400 })

  let guildId: string | null = null
  if (tournamentData.format === "guild") {
    if (!body.guildId) return Response.json({ error: "Selecione a guilda que participará do torneio." }, { status: 400 })
    const [guildData] = await db.select({ id: guild.id, founderId: guild.founderId }).from(guild).where(eq(guild.id, body.guildId)).limit(1)
    if (!guildData) return Response.json({ error: "Não encontramos a guilda selecionada." }, { status: 404 })
    if (guildData.founderId !== session.user.id) return Response.json({ error: "Somente o líder da guilda pode enviar a inscrição." }, { status: 403 })
    const playerIds = roster.map((entry) => entry.playerId)
    if (new Set(playerIds).size !== playerIds.length) return Response.json({ error: "A escalação não pode repetir players." }, { status: 400 })
    const members = await db.select({ userId: guildMember.userId }).from(guildMember).where(and(eq(guildMember.guildId, body.guildId), inArray(guildMember.userId, playerIds)))
    if (members.length !== playerIds.length) return Response.json({ error: "Todos os players escalados precisam pertencer à guilda selecionada." }, { status: 400 })
    guildId = body.guildId
  } else {
    if (roster.length && (roster.length !== 1 || roster[0].playerId !== session.user.id)) return Response.json({ error: "A inscrição individual deve usar apenas seu próprio player." }, { status: 400 })
  }

  const [approved] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(tournamentRegistration).where(and(eq(tournamentRegistration.tournamentId, tournamentId), eq(tournamentRegistration.status, "approved")))
  if ((approved?.count ?? 0) + 1 > tournamentData.slots) return Response.json({ error: "Este torneio já atingiu o limite de inscrições aprovadas." }, { status: 409 })

  try {
    await db.insert(tournamentRegistration).values({ id: randomUUID(), tournamentId, userId: guildId ? null : session.user.id, guildId, roster })
  } catch (error) {
    const databaseError = error as { cause?: { code?: string } }
    if (databaseError.cause?.code === "23505") return Response.json({ error: "Você ou sua guilda já enviou uma inscrição para este torneio." }, { status: 409 })
    return Response.json({ error: "Não foi possível enviar a inscrição agora. Tente novamente em instantes." }, { status: 500 })
  }

  return Response.json({ status: "pending" }, { status: 201 })
}
