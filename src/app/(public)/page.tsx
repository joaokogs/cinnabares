import { Events } from "./_components/events"
import { Hero } from "./_components/hero"

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Events />
    </main>
  )
}
