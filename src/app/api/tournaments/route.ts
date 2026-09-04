import { randomUUID } from "node:crypto"

import { getAdminSession } from "@/lib/tournaments/auth"
import { readTournamentInput } from "@/lib/tournaments/input"
import { listTournaments } from "@/lib/tournaments/queries"
import { createTournament } from "@/lib/tournaments/repository"

export async function GET() {
  return Response.json(await listTournaments())
}

export async function POST(request: Request) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const parsed = readTournamentInput(await request.json())
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 })

  const id = randomUUID()
  await createTournament(id, admin.session.user.id, parsed.value)

  return Response.json({ id }, { status: 201 })
}