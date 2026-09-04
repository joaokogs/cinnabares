"use client"

import { Camera, LoaderCircle } from "lucide-react"
import NextImage, { type ImageLoaderProps } from "next/image"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { getErrorMessage, readApiError } from "@/lib/error-messages"

const MAX_EDGE = 512
const MAX_BYTES = 250 * 1024

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

async function compressAvatarImage(image: HTMLImageElement) {
  let { width, height } = fitWithinBounds(image.naturalWidth, image.naturalHeight, MAX_EDGE)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Não foi possível preparar a imagem para envio.")
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    canvas.width = width
    canvas.height = height
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const blob = await toWebPBlob(canvas, [0.82, 0.7, 0.58, 0.46][attempt])

    if (!blob) {
      throw new Error("Não foi possível preparar a imagem para envio.")
    }

    if (blob.size <= MAX_BYTES || attempt === 3) {
      return new File([blob], "avatar.webp", { type: "image/webp" })
    }

    width = Math.max(128, Math.round(width * 0.8))
    height = Math.max(128, Math.round(height * 0.8))
  }

  throw new Error("Não foi possível preparar a imagem para envio.")
}

function compressAvatar(file: File) {
  return new Promise<File>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = async () => {
      try {
        resolve(await compressAvatarImage(image))
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

type AvatarUploaderProps = {
  initialUrl: string | null
  username: string
}

export function AvatarUploader({ initialUrl, username }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const compressedFile = await compressAvatar(file)
      const formData = new FormData()
      formData.append("file", compressedFile)

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })
      const result = response.ok ? await response.json() as { url?: string } : null

      if (!response.ok || !result?.url) {
        throw new Error(await readApiError(response, "Não foi possível salvar seu avatar. Tente novamente."))
      }

      setAvatarUrl(result.url)
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Não foi possível salvar seu avatar. Tente novamente."))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0">
        <div className="grid size-28 place-items-center overflow-hidden rounded-3xl bg-accent/15 text-3xl font-semibold text-accent ring-1 ring-accent/30">
          {avatarUrl ? (
            <NextImage
              loader={blobImageLoader}
              className="size-full object-cover"
              src={avatarUrl}
              alt={`Avatar de ${username}`}
              width={112}
              height={112}
              unoptimized
            />
          ) : (
            username.slice(0, 1).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Alterar avatar"
          className="absolute -bottom-2 -right-2 grid size-9 place-items-center rounded-xl border border-background bg-accent text-accent-foreground shadow-lg transition hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-60"
        >
          {isUploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            void handleFileChange(event)
          }}
          aria-label="Selecionar avatar"
        />
      </div>
      <div className="space-y-2 text-center sm:text-left">
        <p className="font-heading text-lg font-semibold">Seu avatar</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Escolha uma imagem. Ela sera redimensionada para ate 512px e convertida para WebP antes do upload.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? "Comprimindo..." : "Escolher imagem"}
        </Button>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
    </div>
  )
}
