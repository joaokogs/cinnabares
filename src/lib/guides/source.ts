import { getSanityClient } from "@/sanity/lib/client"
import {
  fetchGuideFromSanity,
  fetchGuideSlugsFromSanity,
  fetchGuidesFromSanity,
} from "./sanity-source"
import {
  getLocalGuideBySlug,
  getLocalGuideSlugs,
  getLocalGuides,
} from "./local-source"
import type { Guide, GuideSummary } from "./types"

const sanityConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
      process.env.NEXT_PUBLIC_SANITY_DATASET &&
      getSanityClient()
  )

export async function getGuides(): Promise<GuideSummary[]> {
  if (sanityConfigured()) {
    try {
      return await fetchGuidesFromSanity()
    } catch {
      return getLocalGuides()
    }
  }
  return getLocalGuides()
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  if (sanityConfigured()) {
    try {
      return await fetchGuideFromSanity(slug)
    } catch {
      return getLocalGuideBySlug(slug)
    }
  }
  return getLocalGuideBySlug(slug)
}

export async function getGuideSlugs(): Promise<string[]> {
  if (sanityConfigured()) {
    try {
      return await fetchGuideSlugsFromSanity()
    } catch {
      return getLocalGuideSlugs()
    }
  }
  return getLocalGuideSlugs()
}