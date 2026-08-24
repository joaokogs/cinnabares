"use client"

import { Camera, ImagePlus, LoaderCircle, X } from "lucide-react"
import NextImage, { type ImageLoaderProps } from "next/image"
import { useRef, useState } from "react"

import { getErrorMessage, readApiError } from "@/lib/error-messages"

const AVATAR_MAX_EDGE = 512
const BANNER_MAX_EDGE = 1200
const MAX_BYTES = 3 * 1024 * 1024

function blobImageLoader({ src }: ImageLoaderProps) {
  return src
}

function compressImage(file: File, maxEdge: number) {
  return new Promise<File>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = async () => {
      try {
        let width = image.naturalWidth
        let height = image.naturalHeight
        const scale = Math.min(1, maxEdge / Math.max(width, height))
        width = Math.max(1, Math.round(width * scale))
        height = Math.max(1, Math.round(height * scale))

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        if (!context) throw new Error("Não foi possível preparar a imagem para envio.")

        for (let attempt = 0; attempt < 4; attempt += 1) {
          canvas.width = width
          canvas.height = height
          context.clearRect(0, 0, width, height)
          context.drawImage(image, 0, 0, width, height)

          const quality = [0.82, 0.7, 0.58, 0.46][attempt]
          const blob = await new Promise<Blob | null>((blobResolve) =>
            canvas.toBlob(blobResolve, "image/webp", quality)
          )

          if (!blob) throw new Error("Não foi possível preparar a imagem para envio.")

          if (blob.size <= MAX_BYTES || attempt === 3) {
            const name = file.name.replace(/\.[^.]+$/, ".webp")
            resolve(new File([blob], name, { type: "image/webp" }))
            return
          }

          width = Math.max(256, Math.round(width * 0.8))
          height = Math.max(256, Math.round(height * 0.8))
        }
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Não foi possível ler essa imagem. Escolha outro arquivo e tente novamente."))
    }
    image.src = objectUrl
  })
}

type GuildMediaUploaderProps = {
  guildId: string
  type: "avatar" | "banner"
  initialUrl: string | null
  guildName: string
}

export function GuildMediaUploader({ guildId, type, initialUrl, guildName }: GuildMediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAvatar = type === "avatar"
  const maxEdge = isAvatar ? AVATAR_MAX_EDGE : BANNER_MAX_EDGE
  const endpoint = `/api/guilds/${guildId}/${isAvatar ? "image" : "banner"}`

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const compressedFile = await compressImage(file, maxEdge)
      const formData = new FormData()
      formData.append("file", compressedFile)

      const response = await fetch(endpoint, { method: "POST", body: formData })
      const result = response.ok ? await response.json() as { url?: string } : null

      if (!response.ok || !result?.url) {
        throw new Error(await readApiError(response, "Não foi possível salvar a imagem. Tente novamente."))
      }

      setUrl(result.url)
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Não foi possível salvar a imagem. Tente novamente."))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove() {
    setError(null)
    setIsUploading(true)

    try {
      const response = await fetch(endpoint, { method: "DELETE" })
      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível remover a imagem. Tente novamente."))
      }

      setUrl(null)
    } catch (removeError) {
      setError(getErrorMessage(removeError, "Não foi possível remover a imagem. Tente novamente."))
    } finally {
      setIsUploading(false)
    }
  }

  if (isAvatar) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <div className="grid size-28 place-items-center overflow-hidden rounded-3xl bg-accent/15 text-3xl font-semibold text-accent ring-1 ring-accent/30">
            {url ? (
              <NextImage loader={blobImageLoader} className="size-full object-cover" src={url} alt={`Avatar de ${guildName}`} width={112} height={112} unoptimized />
            ) : (
              guildName.slice(0, 1).toUpperCase()
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            aria-label="Alterar avatar da guilda"
            className="absolute -bottom-2 -right-2 grid size-9 place-items-center rounded-xl border border-background bg-accent text-accent-foreground shadow-lg transition hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-60"
          >
            {isUploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <p className="font-heading text-lg font-semibold">Avatar da guilda</p>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
             A imagem será redimensionada para até {AVATAR_MAX_EDGE}px e convertida para WebP.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background/70 px-3 py-1.5 text-sm transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60"
            >
              {isUploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
              {isUploading ? "Comprimindo..." : url ? "Trocar imagem" : "Escolher imagem"}
            </button>
            {url ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-60"
              >
                <X className="size-4" aria-hidden="true" /> Remover
              </button>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        </div>
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} aria-label="Selecionar avatar da guilda" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative h-32 overflow-hidden rounded-xl bg-accent/10 sm:h-40">
        {url ? (
          <NextImage loader={blobImageLoader} className="size-full object-cover" src={url} alt={`Banner da guilda ${guildName}`} width={1200} height={400} unoptimized />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-8" aria-hidden="true" /></div>
        )}
        {isUploading ? (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <LoaderCircle className="size-6 animate-spin text-accent" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background/70 px-3 py-1.5 text-sm transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60"
        >
          <ImagePlus className="size-4" aria-hidden="true" /> {url ? "Trocar banner" : "Escolher banner"}
        </button>
        {url ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-60"
          >
            <X className="size-4" aria-hidden="true" /> Remover
          </button>
        ) : null}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">
         A imagem será redimensionada para até {BANNER_MAX_EDGE}px e convertida para WebP. Máximo de 3 MB.
      </p>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} aria-label="Selecionar banner da guilda" />
    </div>
  )
}
