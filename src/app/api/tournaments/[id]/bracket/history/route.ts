import { aliasedTable } from "drizzle-orm"
import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { bracketActionLog, bracketMatch, guild, tournamentRegistration, user } from "@/db/schema"
import { getAdminSession } from "@/lib/tournaments/auth"
import { getBracketByTournamentId } from "@/lib/tournaments/queries"

type RouteProps = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(_request.headers)
  if (admin.response) return admin.response

  const { id } = await params
  const currentBracket = await getBracketByTournamentId(id)
  if (!currentBracket) return Response.json({ error: "A chave deste torneio não foi iniciada." }, { status: 404 })

  const slot1Reg = aliasedTable(tournamentRegistration, "hist_slot1_reg")
  const slot1User = aliasedTable(user, "hist_slot1_user")
  const slot1Guild = aliasedTable(guild, "hist_slot1_guild")
  const slot2Reg = aliasedTable(tournamentRegistration, "hist_slot2_reg")
  const slot2User = aliasedTable(user, "hist_slot2_user")
  const slot2Guild = aliasedTable(guild, "hist_slot2_guild")
  const winnerReg = aliasedTable(tournamentRegistration, "hist_winner_reg")
  const winnerUser = aliasedTable(user, "hist_winner_user")
  const winnerGuild = aliasedTable(guild, "hist_winner_guild")

  const actions = await db
    .select({
      id: bracketActionLog.id,
      matchId: bracketActionLog.matchId,
      action: bracketActionLog.action,
      createdAt: bracketActionLog.createdAt,
      matchPhase: bracketMatch.phase,
      matchPosition: bracketMatch.position,
      slot1Name: slot1User.name,
      slot1Username: slot1User.username,
      slot1GuildName: slot1Guild.name,
      slot1GuildTag: slot1Guild.tag,
      slot2Name: slot2User.name,
      slot2Username: slot2User.username,
      slot2GuildName: slot2Guild.name,
      slot2GuildTag: slot2Guild.tag,
      winnerName: winnerUser.name,
      winnerUsername: winnerUser.username,
      winnerGuildName: winnerGuild.name,
      winnerGuildTag: winnerGuild.tag,
      createdByName: user.name,
    })
    .from(bracketActionLog)
    .innerJoin(bracketMatch, eq(bracketActionLog.matchId, bracketMatch.id))
    .leftJoin(slot1Reg, eq(bracketMatch.slot1RegistrationId, slot1Reg.id))
    .leftJoin(slot1User, eq(slot1Reg.userId, slot1User.id))
    .leftJoin(slot1Guild, eq(slot1Reg.guildId, slot1Guild.id))
    .leftJoin(slot2Reg, eq(bracketMatch.slot2RegistrationId, slot2Reg.id))
    .leftJoin(slot2User, eq(slot2Reg.userId, slot2User.id))
    .leftJoin(slot2Guild, eq(slot2Reg.guildId, slot2Guild.id))
    .leftJoin(winnerReg, eq(bracketActionLog.winnerRegistrationId, winnerReg.id))
    .leftJoin(winnerUser, eq(winnerReg.userId, winnerUser.id))
    .leftJoin(winnerGuild, eq(winnerReg.guildId, winnerGuild.id))
    .innerJoin(user, eq(bracketActionLog.createdBy, user.id))
    .where(eq(bracketActionLog.bracketId, currentBracket.id))
    .orderBy(desc(bracketActionLog.createdAt))
    .limit(50)

  return Response.json(actions)
}
