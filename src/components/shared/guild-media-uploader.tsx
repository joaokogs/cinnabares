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

function fitWithinBounds(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function toWebPBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((blobResolve) => canvas.toBlob(blobResolve, "image/webp", quality))
}

async function compressGuildImage(image: HTMLImageElement, maxEdge: number, fileName: string) {
  let { width, height } = fitWithinBounds(image.naturalWidth, image.naturalHeight, maxEdge)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Não foi possível preparar a imagem para envio.")
  const webpName = fileName.replace(/\.[^.]+$/, ".webp")

  for (let attempt = 0; attempt < 4; attempt += 1) {
    canvas.width = width
    canvas.height = height
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const blob = await toWebPBlob(canvas, [0.82, 0.7, 0.58, 0.46][attempt])

    if (!blob) throw new Error("Não foi possível preparar a imagem para envio.")

    if (blob.size <= MAX_BYTES || attempt === 3) {
      return new File([blob], webpName, { type: "image/webp" })
    }

    width = Math.max(256, Math.round(width * 0.8))
    height = Math.max(256, Math.round(height * 0.8))
  }

  throw new Error("Não foi possível preparar a imagem para envio.")
}

function compressImage(file: File, maxEdge: number) {
  return new Promise<File>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = async () => {
      try {
        resolve(await compressGuildImage(image, maxEdge, file.name))
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

type GuildMediaState = {
  url: string | null
  isUploading: boolean
  error: string | null
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleRemove: () => void
}

function useGuildMediaUpload({ guildId, type, initialUrl }: GuildMediaUploaderProps): GuildMediaState {
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

  const handleFileChangeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFileChange(event)
  }

  const handleRemoveClick = () => {
    void handleRemove()
  }

  return { url, isUploading, error, handleFileChange: handleFileChangeEvent, handleRemove: handleRemoveClick }
}

function GuildAvatarUploader({ guildName, media }: { guildName: string; media: GuildMediaState }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0">
        <div className="grid size-28 place-items-center overflow-hidden rounded-3xl bg-accent/15 text-3xl font-semibold text-accent ring-1 ring-accent/30">
          {media.url ? (
            <NextImage loader={blobImageLoader} className="size-full object-cover" src={media.url} alt={`Avatar de ${guildName}`} width={112} height={112} unoptimized />
          ) : (
            guildName.slice(0, 1).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={media.isUploading}
          aria-label="Alterar avatar da guilda"
          className="absolute -bottom-2 -right-2 grid size-9 place-items-center rounded-xl border border-background bg-accent text-accent-foreground shadow-lg transition hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-60"
        >
          {media.isUploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
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
            disabled={media.isUploading}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background/70 px-3 py-1.5 text-sm transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60"
          >
            {media.isUploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            {media.isUploading ? "Comprimindo..." : media.url ? "Trocar imagem" : "Escolher imagem"}
          </button>
          {media.url ? (
            <button
              type="button"
              onClick={media.handleRemove}
              disabled={media.isUploading}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-60"
            >
              <X className="size-4" aria-hidden="true" /> Remover
            </button>
          ) : null}
        </div>
        {media.error ? <p className="text-sm text-destructive" role="alert">{media.error}</p> : null}
      </div>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={media.handleFileChange} aria-label="Selecionar avatar da guilda" />
    </div>
  )
}

function GuildBannerUploader({ guildName, media }: { guildName: string; media: GuildMediaState }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <div className="relative h-32 overflow-hidden rounded-xl bg-accent/10 sm:h-40">
        {media.url ? (
          <NextImage loader={blobImageLoader} className="size-full object-cover" src={media.url} alt={`Banner da guilda ${guildName}`} width={1200} height={400} unoptimized />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-8" aria-hidden="true" /></div>
        )}
        {media.isUploading ? (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <LoaderCircle className="size-6 animate-spin text-accent" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={media.isUploading}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background/70 px-3 py-1.5 text-sm transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60"
        >
          <ImagePlus className="size-4" aria-hidden="true" /> {media.url ? "Trocar banner" : "Escolher banner"}
        </button>
        {media.url ? (
          <button
            type="button"
            onClick={media.handleRemove}
            disabled={media.isUploading}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-60"
          >
            <X className="size-4" aria-hidden="true" /> Remover
          </button>
        ) : null}
        {media.error ? <p className="text-sm text-destructive" role="alert">{media.error}</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">
         A imagem será redimensionada para até {BANNER_MAX_EDGE}px e convertida para WebP. Máximo de 3 MB.
      </p>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={media.handleFileChange} aria-label="Selecionar banner da guilda" />
    </div>
  )
}

export function GuildMediaUploader(props: GuildMediaUploaderProps) {
  const media = useGuildMediaUpload(props)
  if (props.type === "avatar") {
    return <GuildAvatarUploader guildName={props.guildName} media={media} />
  }
  return <GuildBannerUploader guildName={props.guildName} media={media} />
}
