import {
  computeChampionPokemonItemUsage,
  computePlayerTopPokemon,
  computeTopChampions,
  computeTopWinningItems,
  computeTopWinningPokemon,
  derivePlacement,
  titleCase,
  type BracketMatchLike,
  type ChampionTournament,
  type PlayerRosterSource,
} from "../src/lib/tournaments/stats-core"

let failures = 0

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1
    console.error(`  ✗ ${message}`)
  } else {
    console.log(`  ✓ ${message}`)
  }
}

function makeTournament(overrides: Partial<ChampionTournament>): ChampionTournament {
  return {
    tournamentId: "t1",
    tournamentName: "Test",
    format: "individual",
    tiers: ["overused"],
    createdAt: new Date(),
    championRegistrationId: "r1",
    championUserId: "u1",
    championGuildId: null,
    championRoster: [],
    championUserName: "Player",
    championUserUsername: "player",
    championGuildName: null,
    championGuildTag: null,
    ...overrides,
  }
}

function match(
  phase: number,
  status: "completed" | "pending",
  slot1: string,
  slot2: string,
  winner: string | null,
): BracketMatchLike {
  return {
    phase,
    status,
    slot1RegistrationId: slot1,
    slot2RegistrationId: slot2,
    winnerRegistrationId: winner,
  }
}

console.log("stats-core: defensive empty input")
{
  assert(computeTopWinningPokemon([]).length === 0, "empty pokemon list")
  assert(computeTopWinningItems(null).length === 0, "null items list")
  assert(computeTopChampions(undefined).length === 0, "undefined champions list")
  assert(computePlayerTopPokemon([], "u1").length === 0, "empty player sources")
  assert(computePlayerTopPokemon(null, "").length === 0, "empty player id returns empty")
  assert(computeChampionPokemonItemUsage([]).length === 0, "empty item-by-pokemon list")
  assert(derivePlacement([], "r1").label === "Em andamento", "no matches -> Em andamento")
  assert(derivePlacement(null, "r1").label === "Em andamento", "null matches -> Em andamento")
}

console.log("stats-core: winning pokemon and items")
{
  const tournaments: ChampionTournament[] = [
    makeTournament({
      tournamentId: "t1",
      championUserId: "u1",
      championRoster: [
        { playerId: "u1", tier: "overused", team: [{ name: "Pikachu", item: "LightBall" }, { name: "Charizard" }] },
      ],
    }),
    makeTournament({
      tournamentId: "t2",
      championUserId: "u2",
      championRoster: [{ playerId: "u2", tier: "overused", team: [{ name: "Pikachu", item: "LightBall" }] }],
    }),
  ]

  const pokemon = computeTopWinningPokemon(tournaments)
  const pikachu = pokemon.find((p) => p.name === "Pikachu")
  const charizard = pokemon.find((p) => p.name === "Charizard")
  assert(!!pikachu && pikachu.wins === 2 && pikachu.uses === 2, "Pikachu wins 2 tournaments, used 2 times")
  assert(!!charizard && charizard.wins === 1 && charizard.uses === 1, "Charizard wins 1 tournament")

  const items = computeTopWinningItems(tournaments)
  const lightBall = items.find((i) => i.name === "LightBall")
  assert(!!lightBall && lightBall.wins === 2 && lightBall.uses === 2, "LightBall wins 2 tournaments")
}

console.log("statsios: champions ranking")
{
  const tournaments: ChampionTournament[] = [
    makeTournament({ tournamentId: "t1", championUserId: "u1", championUserName: "Alice" }),
    makeTournament({ tournamentId: "t2", championUserId: "u1", championUserName: "Alice" }),
    makeTournament({ tournamentId: "t3", championUserId: "u2", championUserName: "Bob" }),
  ]
  const champions = computeTopChampions(tournaments)
  assert(champions[0]?.name === "Alice" && champions[0]?.wins === 2, "Alice is top with 2 titles")
  assert(champions.length === 2, "two distinct champions counted")
}

console.log("stats-core: player favorite pokemon (counts duplicates, distinct tournaments)")
{
  const sources: PlayerRosterSource[] = [
    { tournamentId: "t1", roster: [{ playerId: "u1", tier: "overused", team: [{ name: "Pikachu" }, { name: "Pikachu" }] }] },
    { tournamentId: "t2", roster: [{ playerId: "u1", tier: "overused", team: [{ name: "Charizard" }] }] },
    { tournamentId: "t3", roster: [{ playerId: "other", tier: "overused", team: [{ name: "Pikachu" }] }] },
  ]
  const top = computePlayerTopPokemon(sources, "u1")
  const pikachu = top.find((p) => p.name === "Pikachu")
  const charizard = top.find((p) => p.name === "Charizard")
  assert(!!pikachu && pikachu.uses === 2 && pikachu.tournaments === 1, "Pikachu used twice in one tournament")
  assert(!!charizard && charizard.uses === 1 && charizard.tournaments === 1, "Charizard used once")
  assert(top[0]?.name === "Pikachu", "Pikachu is most used")
}

console.log("stats-core: defensive against malformed roster")
{
  const tournaments: ChampionTournament[] = [
    makeTournament({
      tournamentId: "t1",
      championRoster: [
        { playerId: "u1", tier: "overused", team: [] },
        { playerId: "u1", tier: "overused" },
        { playerId: "u1", tier: "overused", team: [{ name: "" }, { item: "Ball" } as never] },
      ],
    }),
  ]
  const pokemon = computeTopWinningPokemon(tournaments)
  const items = computeTopWinningItems(tournaments)
  assert(pokemon.length === 0, "no pokemon from malformed roster")
  assert(items.length === 0, "no items from malformed roster")
}

console.log("stats-core: derivePlacement from bracket matches")
{
  // 2-player bracket
  let p2 = derivePlacement([match(0, "completed", "r1", "r2", "r1")], "r1")
  assert(p2.rank === 1 && p2.label === "1º", "2-player winner is 1º")
  p2 = derivePlacement([match(0, "completed", "r1", "r2", "r1")], "r2")
  assert(p2.rank === 2 && p2.label === "2º", "2-player loser is 2º")
  p2 = derivePlacement([match(0, "pending", "r1", "r2", null)], "r1")
  assert(p2.label === "Em andamento", "2-player pending final -> Em andamento")

  // phase scheme: final=2, semifinal=1, quarterfinal=0
  // champion
  let p = derivePlacement(
    [
      match(2, "completed", "r1", "r2", "r1"),
      match(1, "completed", "r1", "r3", "r1"),
      match(1, "completed", "r2", "r4", "r2"),
    ],
    "r1",
  )
  assert(p.rank === 1 && p.label === "1º", "winner of final is 1º")

  // final loser
  p = derivePlacement(
    [
      match(2, "completed", "r1", "r2", "r1"),
      match(1, "completed", "r1", "r3", "r1"),
      match(1, "completed", "r2", "r4", "r2"),
    ],
    "r2",
  )
  assert(p.rank === 2 && p.label === "2º", "final loser is 2º")

  // semifinal loser -> 3º-4º
  p = derivePlacement(
    [
      match(2, "completed", "r1", "r2", "r1"),
      match(1, "completed", "r1", "r3", "r1"),
      match(1, "completed", "r2", "r4", "r2"),
    ],
    "r3",
  )
  assert(p.rank === 3 && p.label === "3º-4º", "semifinal loser is 3º-4º")

  // quarterfinal loser -> 5º-8º
  p = derivePlacement(
    [
      match(2, "completed", "r1", "r2", "r1"),
      match(1, "completed", "r1", "r3", "r1"),
      match(1, "completed", "r2", "r4", "r2"),
      match(0, "completed", "r3", "r5", "r3"),
      match(0, "completed", "r6", "r7", "r6"),
    ],
    "r5",
  )
  assert(p.rank === 5 && p.label === "5º-8º", "quarterfinal loser is 5º-8º")

  // final not completed yet -> ongoing
  p = derivePlacement(
    [
      match(2, "pending", "r1", "r2", null),
      match(1, "completed", "r1", "r3", "r1"),
      match(1, "completed", "r2", "r4", "r2"),
    ],
    "r1",
  )
  assert(p.label === "Em andamento", "undecided final -> Em andamento")

  // registration not in any match -> ongoing
  p = derivePlacement(
    [
      match(2, "completed", "r1", "r2", "r1"),
      match(1, "completed", "r1", "r3", "r1"),
    ],
    "r9",
  )
  assert(p.label === "Em andamento", "registration without matches -> Em andamento")
}

console.log("stats-core: item-by-pokemon aggregation (champion teams)")
{
  const tournaments: ChampionTournament[] = [
    makeTournament({
      tournamentId: "t1",
      championRoster: [
        {
          playerId: "u1",
          tier: "overused",
          team: [
            { name: "pikachu", item: "light-ball" },
            { name: "pikachu", item: "light-ball" },
            { name: "charizard", item: "leftovers" },
          ],
        },
      ],
    }),
    makeTournament({
      tournamentId: "t2",
      championRoster: [
        {
          playerId: "u2",
          tier: "overused",
          team: [
            { name: "Pikachu", item: "light-ball" },
            { name: "charizard", item: "life-orb" },
          ],
        },
      ],
    }),
  ]

  const usage = computeChampionPokemonItemUsage(tournaments, { limit: 6, itemsLimit: 3 })
  assert(usage.length === 2, "two distinct pokemon aggregated")
  const pikachu = usage.find((p) => p.name === "pikachu")
  const charizard = usage.find((p) => p.name === "charizard")
  assert(!!pikachu && pikachu.uses === 3, "Pikachu used 3 times across champion teams")
  assert(!!pikachu && pikachu.items[0]?.name === "light-ball" && pikachu.items[0]?.count === 3, "Pikachu top item light-ball x3")
  assert(!!charizard && charizard.uses === 2, "Charizard used 2 times")
  assert(!!charizard && charizard.items.length === 2, "Charizard has 2 distinct items")
}

console.log("stats-core: titleCase formatting")
{
  assert(titleCase("pikachu") === "Pikachu", "pikachu -> Pikachu")
  assert(titleCase("tapu-lele") === "Tapu Lele", "tapu-lele -> Tapu Lele")
  assert(titleCase("mr-mime") === "Mr Mime", "mr-mime -> Mr Mime")
}

if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam.`)
  process.exitCode = 1
} else {
  console.log("\nTodas as verificações passaram.")
}
