import base from "@/assets/images/base.png"
import { getSanityClient } from "@/sanity/lib/client"
import {
  GUIDE_BY_SLUG_QUERY,
  GUIDES_LIST_QUERY,
  GUIDES_SLUGS_QUERY,
} from "./queries"
import type { Guide, GuideBody, GuideMode, GuideSummary } from "./types"

type SanityGuide = {
  _id: string
  title: string
  slug: string
  excerpt?: string | null
  mode?: string | null
  category?: { title: string; slug: string } | null
  tags?: string[] | null
  coverImage?: { url?: string | null; alt?: string | null } | null
  publishedAt?: string | null
  author?: string | null
  body?: GuideBody | null
}

type SanitySlug = {
  slug: string
}

function toMode(mode: string | null | undefined): GuideMode {
  return mode === "pvp" ? "pvp" : "pve"
}

function mapGuide(raw: SanityGuide): Guide {
  return {
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt ?? "",
    mode: toMode(raw.mode),
    category: raw.category ?? { title: "Geral", slug: "geral" },
    tags: raw.tags ?? [],
    cover: {
      url: raw.coverImage?.url ?? base.src,
      alt: raw.coverImage?.alt ?? raw.title,
    },
    publishedAt: raw.publishedAt ?? "",
    author: raw.author ?? "Guilda",
    body: raw.body ?? [],
  }
}

function mapSummary(raw: SanityGuide): GuideSummary {
  const guide = mapGuide(raw)
  const { body: _body, ...summary } = guide
  return summary
}

export async function fetchGuidesFromSanity(): Promise<GuideSummary[]> {
  const client = getSanityClient()
  if (!client) return []

  const guides = await client.fetch<SanityGuide[]>(GUIDES_LIST_QUERY)
  return guides.map(mapSummary)
}

export async function fetchGuideFromSanity(slug: string): Promise<Guide | null> {
  const client = getSanityClient()
  if (!client) return null

  const guide = await client.fetch<SanityGuide | null>(GUIDE_BY_SLUG_QUERY, { slug })
  return guide ? mapGuide(guide) : null
}

export async function fetchGuideSlugsFromSanity(): Promise<string[]> {
  const client = getSanityClient()
  if (!client) return []

  const slugs = await client.fetch<SanitySlug[]>(GUIDES_SLUGS_QUERY)
  return slugs.map((item) => item.slug).filter(Boolean)
}
