import { getGuides } from "@/lib/guides/source"

import { Events } from "./_components/events"
import { GuidesShowcase } from "./_components/guides-cta"
import { Hero } from "./_components/hero"

export default async function Home() {
  const guides = await getGuides()

  return (
    <main className="flex-1">
      <Hero guideCount={guides.length} />
      <Events />
      <GuidesShowcase guides={guides} />
    </main>
  )
}
