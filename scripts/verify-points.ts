import {
  POINTS_PER_PLACEMENT,
  computePoints,
  pointsForRank,
  pointsForResult,
  sortPointsRanking,
  type PointsResultInput,
} from "../src/lib/tournaments/points"

let failures = 0

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1
    console.error(`  ✗ ${message}`)
  } else {
    console.log(`  ✓ ${message}`)
  }
}

function result(result: string, placementRank: number | null): PointsResultInput {
  return { result, placementRank }
}

console.log("points: regra de pontos por colocação")
{
  assert(POINTS_PER_PLACEMENT[1] === 100, "1º vale 100 pontos")
  assert(POINTS_PER_PLACEMENT[2] === 60, "2º vale 60 pontos")
  assert(POINTS_PER_PLACEMENT[3] === 30, "3º-4º vale 30 pontos")
  assert(POINTS_PER_PLACEMENT[5] === 15, "5º-8º vale 15 pontos")
  assert(pointsForRank(1) === 100, "pointsForRank(1) = 100")
  assert(pointsForRank(2) === 60, "pointsForRank(2) = 60")
  assert(pointsForRank(3) === 30, "pointsForRank(3) = 30")
  assert(pointsForRank(5) === 15, "pointsForRank(5) = 15")
  assert(pointsForRank(4) === 0, "rank 4 não pontua (colocação usa o limite inferior 3)")
  assert(pointsForRank(8) === 0, "rank 8 não pontua (colocação usa o limite inferior 5)")
  assert(pointsForRank(null) === 0, "sem colocação não pontua")
  assert(pointsForRank(undefined) === 0, "colocação indefinida não pontua")
}

console.log("points: pontos por resultado de torneio")
{
  assert(pointsForResult(result("champion", 1)) === 100, "campeão recebe 100")
  assert(pointsForResult(result("eliminated", 2)) === 60, "eliminado 2º recebe 60")
  assert(pointsForResult(result("eliminated", 3)) === 30, "eliminado 3º-4º recebe 30")
  assert(pointsForResult(result("eliminated", 5)) === 15, "eliminado 5º-8º recebe 15")
  assert(pointsForResult(result("eliminated", null)) === 0, "eliminado sem colocação não pontua")
  assert(pointsForResult(result("in_progress", null)) === 0, "em andamento não pontua")
  assert(pointsForResult(result("participated", null)) === 0, "participação sem colocação não pontua")
  assert(pointsForResult(result("pending", null)) === 0, "inscrição pendente não pontua")
  assert(pointsForResult(result("rejected", null)) === 0, "inscrição recusada não pontua")
  assert(pointsForResult(null) === 0, "resultado nulo não pontua")
}

console.log("points: soma de pontos de um player individual")
{
  const summary = computePoints([
    result("champion", 1),
    result("eliminated", 2),
    result("eliminated", 3),
    result("eliminated", 5),
    result("participated", null),
    result("in_progress", null),
  ])
  assert(summary.total === 100 + 60 + 30 + 15, "total soma 100+60+30+15 = 205")
  assert(summary.tournaments === 4, "apenas torneios com pontuação contam")
  assert(computePoints([]).total === 0, "lista vazia soma zero")
  assert(computePoints(null).total === 0, "lista nula soma zero")
}

console.log("points: guilda recebe o valor total da inscrição (sem divisão ambígua)")
{
  const summary = computePoints([
    result("champion", 1),
    result("eliminated", 5),
  ])
  assert(summary.total === 100 + 15, "guilda campeã e 5º-8º soma 115 para a inscrição como um todo")
}

console.log("points: ordenação do ranking")
{
  const ranking = sortPointsRanking([
    { id: "u1", name: "Alice", total: 30, tournaments: 1 },
    { id: "u2", name: "Bob", total: 100, tournaments: 1 },
    { id: "u3", name: "Carol", total: 100, tournaments: 2 },
  ])
  assert(ranking[0]?.id === "u2" && ranking[0]?.total === 100, "maior total primeiro")
  assert(ranking[1]?.id === "u3", "empate desempatado por nome ascendente (Bob antes de Carol)")
  assert(ranking[2]?.id === "u1", "Alice por último")
}

if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam.`)
  process.exitCode = 1
} else {
  console.log("\nTodas as verificações passaram.")
}