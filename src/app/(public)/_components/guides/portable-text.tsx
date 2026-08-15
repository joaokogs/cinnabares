import {
  PortableText as PortableTextRenderer,
  type PortableTextComponent,
  type PortableTextComponents,
} from "@portabletext/react"
import Image from "next/image"

import type {
  GuideBody,
  GuideBodyItem,
  PortableTextImage,
} from "@/lib/guides/types"
import { cn } from "@/lib/utils"

const GuideImage: PortableTextComponent<PortableTextImage> = ({ value }) => {
  const src = value.asset?.url
  if (!src) return null

  const alt = value.alt ?? ""
  const hasRatio = Boolean(value.width && value.height)

  return (
    <figure className="mt-6 first:mt-0">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-black/40 ring-1 ring-foreground/10",
          !hasRatio && "aspect-video"
        )}
        style={
          hasRatio ? { aspectRatio: (value.width ?? 1) / (value.height ?? 1) } : undefined
        }
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          loading="lazy"
        />
      </div>
      {value.caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {value.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

const components: PortableTextComponents<GuideBodyItem> = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-tight first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 font-heading text-xl font-semibold tracking-tight first:mt-0">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="mt-4 leading-relaxed text-foreground/85 first:mt-0">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 rounded-r-lg border-l-2 border-accent bg-accent/10 px-4 py-3 italic text-foreground/85 first:mt-0">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = (value as { href?: string } | undefined)?.href
      const safeHref =
        href?.startsWith("https://") ||
        href?.startsWith("http://") ||
        href?.startsWith("/") ||
        href?.startsWith("#")
          ? href
          : "#"
      const external = safeHref.startsWith("http")

      return (
        <a
          href={safeHref}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="font-medium text-accent underline underline-offset-4 hover:text-accent/80"
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
        {children}
      </code>
    ),
  },
  types: {
    image: GuideImage,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 ml-5 list-disc space-y-2 text-foreground/85 marker:text-accent first:mt-0">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 ml-5 list-decimal space-y-2 text-foreground/85 marker:text-accent first:mt-0">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
}

type GuidePortableTextProps = {
  body: GuideBody
  className?: string
}

export function GuidePortableText({ body, className }: GuidePortableTextProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <PortableTextRenderer value={body} components={components} />
    </div>
  )
}
