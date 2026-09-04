import { auth } from "@/lib/auth"
import { deleteGuild, findConflictingGuild, findGuildFounder, updateGuild } from "@/lib/guilds/repository"

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function validateGuildUpdate(name: string, tag: string, description: string) {
  if (name.length < 2 || name.length > 80) return "O nome da guilda deve ter entre 2 e 80 caracteres."
  if (!/^[a-z0-9][a-z0-9-]{0,3}$/.test(tag)) {
    return "A tag deve ter de 1 a 4 caracteres, começar com uma letra ou número e não conter espaços."
  }
  if (description.length > 500) return "A descrição da guilda deve ter no máximo 500 caracteres."
  return null
}

function conflictResponse(conflictingGuild: { name: string; tag: string } | undefined, name: string, tag: string) {
  if (conflictingGuild?.name === name) return Response.json({ error: "Esse nome de guilda já está em uso. Escolha outro." }, { status: 409 })
  if (conflictingGuild?.tag === tag) return Response.json({ error: "Essa tag já está em uso. Escolha outra." }, { status: 409 })
  return null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const currentGuild = await findGuildFounder(guildId)

  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para editar esta guilda. Apenas o fundador pode fazer isso." }, { status: 403 })
  }

  const formData = await request.formData()
  const name = textValue(formData, "name")
  const tag = textValue(formData, "tag").toLowerCase()
  const description = textValue(formData, "description")

  const validationError = validateGuildUpdate(name, tag, description)
  if (validationError) return Response.json({ error: validationError }, { status: 400 })

  const conflictingGuild = await findConflictingGuild(guildId, name, tag)
  const conflict = conflictResponse(conflictingGuild, name, tag)
  if (conflict) return conflict

  await updateGuild(guildId, { name, tag, description })

  return Response.json({ tag })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const currentGuild = await findGuildFounder(guildId)

  if (!currentGuild) return Response.json({ error: "Esta guilda não existe mais." }, { status: 404 })
  if (currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Apenas o fundador pode excluir a guilda." }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null
  if (body?.confirmation !== "Confirmar") {
    return Response.json({ error: "Digite Confirmar para excluir a guilda." }, { status: 400 })
  }

  await deleteGuild(guildId)

  return Response.json({ ok: true })
}
