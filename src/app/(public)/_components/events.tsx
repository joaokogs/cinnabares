import { CalendarDays, PartyPopper } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"

import evento1 from "@/assets/images/evento1.png"
import evento2 from "@/assets/images/evento2.png"

const events = [
  {
    image: evento1,
    alt: "Arte do evento de caçada em grupo da Cinnabares",
    title: "Caçada em grupo",
    description: "Junte-se à guilda para procurar shinys, trocar dicas e curtir uma noite leve com a comunidade.",
  },
  {
    image: evento2,
    alt: "Arte do torneio da guilda Cinnabares",
    title: "Torneio da guilda",
    description: "Torneios com ranking próprio, regulamento aberto e espaço para jogadores de todos os níveis.",
  },
]

export function Events() {
  return (
    <section id="eventos" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mb-7 max-w-2xl">
          <Badge variant="outline" className="gap-1.5 border-accent/40 bg-accent/10 text-foreground">
            <CalendarDays className="size-3" aria-hidden="true" />
            Eventos da comunidade
          </Badge>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Um pouco do que já rolou
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Alguns momentos que já reuniram a comunidade para jogar junto, competir e manter a canela quente.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {events.map((event) => (
            <article key={event.title} className="group overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-xl hover:shadow-black/25">
              <div className="relative aspect-video overflow-hidden bg-black/40">
                <Image
                  src={event.image}
                  alt={event.alt}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-lg font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <PartyPopper className="size-4 text-accent" aria-hidden="true" />
          A agenda completa fica no canal da guilda.
        </p>
      </div>
    </section>
  )
}
