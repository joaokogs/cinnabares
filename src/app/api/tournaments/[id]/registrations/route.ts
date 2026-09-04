import { randomUUID } from "node:crypto"

import type { TournamentRosterEntry } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getAdminSession } from "@/lib/tournaments/auth"
import { getTournament, listTournamentRegistrations } from "@/lib/tournaments/queries"
import { normalizeRoster, validateRoster } from "@/lib/tournaments/roster-validation"
import {
  countApprovedRegistrations,
  getGuildFounder,
  getGuildMemberUserIds,
  insertTournamentRegistration,
} from "@/lib/tournaments/repository"

type RouteProps = { params: Promise<{ id: string }> }
type TournamentData = NonNullable<Awaited<ReturnType<typeof getTournament>>>
type GuildResolution = { guildId: string | null; error: Response | null }

async function resolveGuildRegistration(
  tournamentData: TournamentData,
  guildIdInput: string | undefined,
  userId: string,
  roster: TournamentRosterEntry[],
): Promise<GuildResolution> {
  if (tournamentData.format !== "guild") {
    if (roster.length && (roster.length !== 1 || roster[0].playerId !== userId)) {
      return { guildId: null, error: Response.json({ error: "A inscrição individual deve usar apenas seu próprio player." }, { status: 400 }) }
    }
    return { guildId: null, error: null }
  }

  if (!guildIdInput) return { guildId: null, error: Response.json({ error: "Selecione a guilda que participará do torneio." }, { status: 400 }) }

  const guildData = await getGuildFounder(guildIdInput)
  if (!guildData) return { guildId: null, error: Response.json({ error: "Não encontramos a guilda selecionada." }, { status: 404 }) }
  if (guildData.founderId !== userId) return { guildId: null, error: Response.json({ error: "Somente o líder da guilda pode enviar a inscrição." }, { status: 403 }) }

  const playerIds = roster.map((entry) => entry.playerId)
  if (new Set(playerIds).size !== playerIds.length) return { guildId: null, error: Response.json({ error: "A escalação não pode repetir players." }, { status: 400 }) }

  const members = await getGuildMemberUserIds(guildIdInput, playerIds)
  if (members.length !== playerIds.length) return { guildId: null, error: Response.json({ error: "Todos os players escalados precisam pertencer à guilda selecionada." }, { status: 400 }) }

  return { guildId: guildIdInput, error: null }
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
  const rosterError = await validateRoster(roster, {
    visibility: tournamentData.visibility,
    expectedSize: tournamentData.teamSize,
    allowedTiers: tournamentData.tiers,
    tierRules: tournamentData.tierRules,
  })
  if (rosterError) return Response.json({ error: `Revise a escalação: ${rosterError}` }, { status: 400 })

  const guildResolution = await resolveGuildRegistration(tournamentData, body.guildId, session.user.id, roster)
  if (guildResolution.error) return guildResolution.error

  const approved = await countApprovedRegistrations(tournamentId)
  if (approved + 1 > tournamentData.slots) return Response.json({ error: "Este torneio já atingiu o limite de inscrições aprovadas." }, { status: 409 })

  const inserted = await insertTournamentRegistration({
    id: randomUUID(),
    tournamentId,
    userId: guildResolution.guildId ? null : session.user.id,
    guildId: guildResolution.guildId,
    roster,
  })
  if (!inserted.ok) return Response.json({ error: inserted.error }, { status: inserted.status })

  return Response.json({ status: "pending" }, { status: 201 })
}