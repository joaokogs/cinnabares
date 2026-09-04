import { randomUUID } from "node:crypto"
import { config } from "dotenv"
import { asc, eq } from "drizzle-orm"

import {
  bracket,
  bracketActionLog,
  bracketMatch,
  guild,
  guildMember,
  tournament,
  tournamentRegistration,
  user,
} from "../src/db/schema"
import type { TournamentPokemon, TournamentRosterEntry, TournamentTier } from "../src/db/schema"

config({ path: ".env.local" })

const GUILD_ALFA = { tag: "alfa", name: "Teste Alfa Mantido" }
const GUILD_BETA = { tag: "beta", name: "Teste Beta Mantido" }
const CREATOR_USERNAME = "kaorichi"

const TIERS = ["overused", "underused", "neverused"] as const
const TIER_RULES = { overused: 3, underused: 1, neverused: 1 }
const TIER_ORDER: TournamentTier[] = ["overused", "overused", "overused", "underused", "neverused"]
const TEAM_SIZE = 5

const FINISHED_NAME = "XT Guilda Demo Finalizado 3-1"
const OPEN_NAME = "XT Guilda Demo Aberto"
const ACTIVE_NAME = "XT Guilda Demo Em Andamento"

const TEAMS: TournamentPokemon[][] = [
  [
    { name: "garchomp", item: "choice-scarf" },
    { name: "heatran", item: "air-balloon" },
    { name: "ferrothorn", item: "leftovers" },
    { name: "rotom", item: "choice-specs" },
    { name: "starmie", item: "life-orb" },
    { name: "tentacruel", item: "black-sludge" },
  ],
  [
    { name: "tyranitar", item: "choice-band" },
    { name: "excadrill", item: "focus-sash" },
    { name: "scizor", item: "rocky-helmet" },
    { name: "gliscor", item: "toxic-orb" },
    { name: "breloom", item: "life-orb" },
    { name: "skarmory", item: "leftovers" },
  ],
  [
    { name: "dragonite", item: "lum-berry" },
    { name: "salamence", item: "choice-specs" },
    { name: "metagross", item: "expert-belt" },
    { name: "gengar", item: "black-sludge" },
    { name: "alakazam", item: "focus-sash" },
    { name: "blissey", item: "leftovers" },
  ],
  [
    { name: "hydreigon", item: "choice-scarf" },
    { name: "volcarona", item: "life-orb" },
    { name: "latios", item: "choice-specs" },
    { name: "jellicent", item: "leftovers" },
    { name: "conkeldurr", item: "flame-orb" },
    { name: "sigilyph", item: "light-clay" },
  ],
  [
    { name: "landorus", item: "choice-band" },
    { name: "thundurus", item: "life-orb" },
    { name: "swampert", item: "leftovers" },
    { name: "infernape", item: "expert-belt" },
    { name: "empoleon", item: "rocky-helmet" },
    { name: "whimsicott", item: "sitrus-berry" },
  ],
  [
    { name: "zapdos", item: "leftovers" },
    { name: "gyarados", item: "lum-berry" },
    { name: "milotic", item: "flame-orb" },
    { name: "mamoswine", item: "life-orb" },
    { name: "weavile", item: "choice-band" },
    { name: "magnezone", item: "air-balloon" },
  ],
]

function fail(message: string): never {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

async function main() {
  const { db } = await import("../src/db")

  const findGuild = async (tag: string, name: string) => {
    const byTag = await db.select().from(guild).where(eq(guild.tag, tag)).limit(1)
    if (byTag[0]) return byTag[0]
    const byName = await db.select().from(guild).where(eq(guild.name, name)).limit(1)
    if (byName[0]) return byName[0]
    return null
  }

  const findCreator = async () => {
    const byUsername = await db.select().from(user).where(eq(user.username, CREATOR_USERNAME)).limit(1)
    if (byUsername[0]) return byUsername[0]
    const anyUser = await db.select().from(user).limit(1)
    if (anyUser[0]) return anyUser[0]
    return null
  }

  const loadRoster = async (guildId: string): Promise<TournamentRosterEntry[]> => {
    const members = await db
      .select({ userId: guildMember.userId, username: user.username })
      .from(guildMember)
      .leftJoin(user, eq(guildMember.userId, user.id))
      .where(eq(guildMember.guildId, guildId))
      .orderBy(asc(user.username))
      .limit(TEAM_SIZE)

    if (members.length < TEAM_SIZE) {
      fail(`A guilda ${guildId} precisa de pelo menos ${TEAM_SIZE} membros para escalar o time demo (encontrados: ${members.length}).`)
    }

    return members.map((member, i) => ({
      playerId: member.userId,
      tier: TIER_ORDER[i],
      team: TEAMS[i % TEAMS.length],
    }))
  }

  const tournamentInput: {
    tiers: TournamentTier[]
    tierRules: Partial<Record<TournamentTier, number>>
    slots: number
    visibility: "blind" | "partial" | "total"
    teamSize: number
  } = {
    tiers: [...TIERS],
    tierRules: { ...TIER_RULES },
    slots: 8,
    visibility: "total",
    teamSize: TEAM_SIZE,
  }

  const seedFinished = async (creatorId: string, alfaGuildId: string, betaGuildId: string, alfaRoster: TournamentRosterEntry[], betaRoster: TournamentRosterEntry[]) => {
    const existing = await db.select({ id: tournament.id }).from(tournament).where(eq(tournament.name, FINISHED_NAME)).limit(1)
    if (existing[0]) {
      console.log(`Torneio "${FINISHED_NAME}" já existe (${existing[0].id}). Nada a fazer.`)
      return
    }

    const tournamentId = randomUUID()
    const alfaRegistrationId = randomUUID()
    const betaRegistrationId = randomUUID()
    const bracketId = randomUUID()
    const matchId = randomUUID()

    await db.batch([
      db.insert(tournament).values({
        id: tournamentId,
        name: FINISHED_NAME,
        description: "Torneio demo de guildas finalizado com placar 3-1 na final.",
        format: "guild",
        status: "finished",
        scheduledDate: "2026-08-20",
        scheduledTime: "19:00",
        location: "Sala Guilds — Pokémon Showdown",
        reward: "Título de campeão demo",
        createdBy: creatorId,
        ...tournamentInput,
      }),
      db.insert(tournamentRegistration).values([
        {
          id: alfaRegistrationId,
          tournamentId,
          userId: null,
          guildId: alfaGuildId,
          status: "approved",
          roster: alfaRoster,
          reviewedBy: creatorId,
          reviewedAt: new Date(),
        },
        {
          id: betaRegistrationId,
          tournamentId,
          userId: null,
          guildId: betaGuildId,
          status: "approved",
          roster: betaRoster,
          reviewedBy: creatorId,
          reviewedAt: new Date(),
        },
      ]),
      db.insert(bracket).values({ id: bracketId, tournamentId }),
      db.insert(bracketMatch).values({
        id: matchId,
        bracketId,
        phase: 0,
        position: 0,
        slot1RegistrationId: alfaRegistrationId,
        slot2RegistrationId: betaRegistrationId,
        winnerRegistrationId: alfaRegistrationId,
        score1: 3,
        score2: 1,
        status: "completed",
      }),
      db.insert(bracketActionLog).values({
        id: randomUUID(),
        bracketId,
        matchId,
        action: "resolve",
        winnerRegistrationId: alfaRegistrationId,
        createdBy: creatorId,
      }),
    ])

    console.log(`✓ Torneio finalizado criado: ${FINISHED_NAME}`)
    console.log(`  ID: ${tournamentId}`)
    console.log(`  Página: /torneios/${tournamentId}`)
    console.log(`  Chave: /torneios/${tournamentId}/bracket`)
  }

  const seedOpen = async (creatorId: string) => {
    const existing = await db.select({ id: tournament.id }).from(tournament).where(eq(tournament.name, OPEN_NAME)).limit(1)
    if (existing[0]) {
      console.log(`Torneio "${OPEN_NAME}" já existe (${existing[0].id}). Nada a fazer.`)
      return
    }

    const tournamentId = randomUUID()

    await db.insert(tournament).values({
      id: tournamentId,
      name: OPEN_NAME,
      description: "Torneio demo de guildas aberto, aguardando inscrições.",
      format: "guild",
      status: "open",
      scheduledDate: "2026-09-20",
      scheduledTime: "20:00",
      location: "Sala Guilds — Pokémon Showdown",
      reward: "Vagas para o próximo demo",
      createdBy: creatorId,
      ...tournamentInput,
    })

    console.log(`✓ Torneio aberto criado: ${OPEN_NAME}`)
    console.log(`  ID: ${tournamentId}`)
    console.log(`  Página: /torneios/${tournamentId}`)
  }

  const seedActive = async (creatorId: string, alfaGuildId: string, betaGuildId: string, alfaRoster: TournamentRosterEntry[], betaRoster: TournamentRosterEntry[]) => {
    const existing = await db.select({ id: tournament.id }).from(tournament).where(eq(tournament.name, ACTIVE_NAME)).limit(1)
    if (existing[0]) {
      console.log(`Torneio "${ACTIVE_NAME}" já existe (${existing[0].id}). Nada a fazer.`)
      return
    }

    const tournamentId = randomUUID()
    const alfaRegistrationId = randomUUID()
    const betaRegistrationId = randomUUID()
    const bracketId = randomUUID()
    const matchId = randomUUID()

    await db.batch([
      db.insert(tournament).values({
        id: tournamentId,
        name: ACTIVE_NAME,
        description: "Torneio demo em andamento para testar a administração da ordem de batalha.",
        format: "guild",
        status: "active",
        scheduledDate: "2026-09-10",
        scheduledTime: "19:00",
        location: "Sala Guilds — Pokémon Showdown",
        reward: "Título de campeão demo",
        createdBy: creatorId,
        ...tournamentInput,
      }),
      db.insert(tournamentRegistration).values([
        {
          id: alfaRegistrationId,
          tournamentId,
          userId: null,
          guildId: alfaGuildId,
          status: "approved",
          roster: alfaRoster,
          reviewedBy: creatorId,
          reviewedAt: new Date(),
        },
        {
          id: betaRegistrationId,
          tournamentId,
          userId: null,
          guildId: betaGuildId,
          status: "approved",
          roster: betaRoster,
          reviewedBy: creatorId,
          reviewedAt: new Date(),
        },
      ]),
      db.insert(bracket).values({ id: bracketId, tournamentId }),
      db.insert(bracketMatch).values({
        id: matchId,
        bracketId,
        phase: 0,
        position: 0,
        slot1RegistrationId: alfaRegistrationId,
        slot2RegistrationId: betaRegistrationId,
        winnerRegistrationId: null,
        score1: 0,
        score2: 0,
        status: "pending",
      }),
    ])

    console.log(`✓ Torneio em andamento criado: ${ACTIVE_NAME}`)
    console.log(`  ID: ${tournamentId}`)
    console.log(`  Página: /torneios/${tournamentId}`)
    console.log(`  Chave: /torneios/${tournamentId}/bracket`)
  }

  const alfaGuild = await findGuild(GUILD_ALFA.tag, GUILD_ALFA.name)
  if (!alfaGuild) fail(`Guilda "${GUILD_ALFA.tag}" (fallback "${GUILD_ALFA.name}") não encontrada no banco.`)
  const betaGuild = await findGuild(GUILD_BETA.tag, GUILD_BETA.name)
  if (!betaGuild) fail(`Guilda "${GUILD_BETA.tag}" (fallback "${GUILD_BETA.name}") não encontrada no banco.`)
  const creator = await findCreator()
  if (!creator) fail("Nenhum usuário encontrado para ser o criador dos torneios demo.")

  console.log(`Guildas encontradas: ${alfaGuild.name} [${alfaGuild.tag}] e ${betaGuild.name} [${betaGuild.tag}]`)
  console.log(`Criador dos torneios: ${creator.username ?? creator.id}`)

  const alfaRoster = await loadRoster(alfaGuild.id)
  const betaRoster = await loadRoster(betaGuild.id)

  await seedFinished(creator.id, alfaGuild.id, betaGuild.id, alfaRoster, betaRoster)
  await seedOpen(creator.id)
  await seedActive(creator.id, alfaGuild.id, betaGuild.id, alfaRoster, betaRoster)

  console.log("\nSeed de torneios demo concluído.")
  process.exit(0)
}

main().catch((error) => {
  console.error("\n✗ Falha ao executar o seed:", error)
  process.exit(1)
})
