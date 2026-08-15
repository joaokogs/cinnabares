import { localGuides } from "@/content/guides"
import type { Guide, GuideSummary } from "./types"

export function getLocalGuides(): GuideSummary[] {
  return localGuides.map(({ body: _body, ...guide }) => guide)
}

export function getLocalGuideBySlug(slug: string): Guide | null {
  return localGuides.find((guide) => guide.slug === slug) ?? null
}

export function getLocalGuideSlugs(): string[] {
  return localGuides.map((guide) => guide.slug)
}
