import { auth } from "@/lib/auth"
import { createPost, getPosts } from "@/lib/posts/queries"
import type { BuildPokemonInput, PostInput } from "@/lib/posts/types"

const STAT_NAMES = ["hp", "atk", "def", "spa", "spd", "spe"]

function cleanStats(value: unknown, max: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const stats: Record<string, number> = {}
  for (const name of STAT_NAMES) {
    const numberValue = Number((value as Record<string, unknown>)[name])
    if (Number.isFinite(numberValue) && numberValue >= 0 && numberValue <= max) stats[name] = Math.floor(numberValue)
  }
  return stats
}

function parsePokemonEntry(raw: unknown): BuildPokemonInput | string {
  if (!raw || typeof raw !== "object") return "Há um Pokémon inválido na build."
  const pokemon = raw as Record<string, unknown>
  const name = String(pokemon.name ?? "").trim().toLowerCase()
  if (!name || name.length > 80) return "Informe um nome válido para cada Pokémon."

  const moves = Array.isArray(pokemon.moves)
    ? pokemon.moves.map((move) => String(move).trim().toLowerCase()).filter(Boolean).slice(0, 4)
    : []
  return {
    name,
    description: String(pokemon.description ?? "").trim().slice(0, 1000),
    item: String(pokemon.item ?? "").trim().toLowerCase().slice(0, 80),
    ability: String(pokemon.ability ?? "").trim().slice(0, 80),
    nature: String(pokemon.nature ?? "").trim().slice(0, 40),
    ivs: cleanStats(pokemon.ivs, 31),
    evs: cleanStats(pokemon.evs, 252),
    moves,
  }
}

function parsePokemon(value: unknown): BuildPokemonInput[] | string {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 6) return "A build pode ter no máximo 6 Pokémon."

  const parsed = value.map(parsePokemonEntry)
  const error = parsed.find((item): item is string => typeof item === "string")
  return error ?? parsed as BuildPokemonInput[]
}

function parsePost(value: unknown): PostInput | string {
  if (!value || typeof value !== "object") return "Envie os dados do post."
  const body = value as Record<string, unknown>
  const title = String(body.title ?? "").trim()
  const description = String(body.description ?? "").trim()
  if (title.length < 3 || title.length > 120) return "O título deve ter entre 3 e 120 caracteres."
  if (description.length < 1 || description.length > 5000) return "A descrição deve ter entre 1 e 5.000 caracteres."
  const pokemon = parsePokemon(body.pokemon)
  if (typeof pokemon === "string") return pokemon
  return { title, description, pokemon }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  return Response.json({ posts: await getPosts(session.user.id) })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para publicar." }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Não foi possível ler os dados do post." }, { status: 400 })
  }

  const parsed = parsePost(body)
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 })

  const id = await createPost(session.user.id, parsed)
  return Response.json({ id }, { status: 201 })
}
