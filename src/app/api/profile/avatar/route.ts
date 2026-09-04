import { get, put } from "@vercel/blob"

import { auth } from "@/lib/auth"
import { getUserImage, updateUserAvatar } from "@/lib/users/account"

const MAX_AVATAR_BYTES = 3 * 1024 * 1024
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

function avatarProxyUrl(pathname: string) {
  return `/api/profile/avatar?path=${encodeURIComponent(pathname)}`
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return new Response("Sua sessão expirou. Entre novamente para continuar.", { status: 401 })
  }

  const pathname = new URL(request.url).searchParams.get("path")
  const image = await getUserImage(session.user.id)

  if (!pathname || !image || image !== pathname) {
    return new Response("Não encontramos seu avatar.", { status: 404 })
  }

  const blob = await get(pathname, { access: "private" })

  if (!blob || !blob.stream) {
    return new Response("Não encontramos seu avatar.", { status: 404 })
  }

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": blob.blob.contentType,
    },
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return Response.json({ error: "Selecione uma imagem para continuar." }, { status: 400 })
  }

  if (!allowedImageTypes.has(file.type)) {
    return Response.json({ error: "Escolha uma imagem JPG, PNG ou WebP." }, { status: 400 })
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return Response.json({ error: "A imagem deve ter no máximo 3 MB. Escolha um arquivo menor." }, { status: 400 })
  }

  const blob = await put(`avatars/${session.user.id}.webp`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  })

  await updateUserAvatar(session.user.id, blob.pathname)

  return Response.json({ url: avatarProxyUrl(blob.pathname) })
}
