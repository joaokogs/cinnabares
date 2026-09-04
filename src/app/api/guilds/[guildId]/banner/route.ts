import { del, get, put } from "@vercel/blob"

import { auth } from "@/lib/auth"
import { clearGuildBanner, findGuildBanner, updateGuildBanner } from "@/lib/guilds/repository"

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

function bannerProxyUrl(guildId: string, pathname: string) {
  return `/api/guilds/${guildId}/banner?path=${encodeURIComponent(pathname)}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const pathname = new URL(request.url).searchParams.get("path")
  const currentGuild = await findGuildBanner(guildId)

  if (!pathname || !currentGuild?.banner || currentGuild.banner !== pathname) {
    return new Response("Banner não encontrado.", { status: 404 })
  }

  const blob = await get(pathname, { access: "private" })
  if (!blob || !blob.stream) return new Response("Banner não encontrado.", { status: 404 })

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": blob.blob.contentType,
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const currentGuild = await findGuildBanner(guildId)

  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para editar o banner desta guilda." }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return Response.json({ error: "Selecione uma imagem para continuar." }, { status: 400 })
  }
  if (!allowedImageTypes.has(file.type)) {
    return Response.json({ error: "Escolha uma imagem JPG, PNG ou WebP." }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "A imagem deve ter no máximo 3 MB. Escolha um arquivo menor." }, { status: 400 })
  }

  const blob = await put(`guilds/${guildId}/banner`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  })

  await updateGuildBanner(guildId, blob.pathname)

  if (currentGuild.banner) {
    await del(currentGuild.banner).catch(() => {})
  }

  return Response.json({ url: bannerProxyUrl(guildId, blob.pathname) })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const currentGuild = await findGuildBanner(guildId)

  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para remover o banner desta guilda." }, { status: 403 })
  }

  if (currentGuild.banner) {
    await del(currentGuild.banner).catch(() => {})
  }

  await clearGuildBanner(guildId)

  return Response.json({ ok: true })
}
