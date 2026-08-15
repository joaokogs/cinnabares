import { CalendarDays, Gamepad2, Users } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import base from "@/assets/images/base.png"
import chibi from "@/assets/images/chibi.png"

const stats = [
  { label: "Na ativa desde", value: "2018" },
  { label: "Eventos", value: "Semanais" },
  { label: "Foco", value: "PvP + PvE" },
]

const floatingBadges = [
  {
    icon: CalendarDays,
    title: "Eventos semanais",
    description: "Caçadas e torneios",
  },
  {
    icon: Users,
    title: "Comunidade ativa",
    description: "Desde 2018",
  },
]

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgba(255,91,79,0.14),transparent_62%)]"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:pt-16 lg:pb-16">
        <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="flex flex-col items-start gap-5">
            <Badge
              variant="outline"
              className="gap-1.5 border-accent/40 bg-accent/10 text-foreground"
            >
              <Gamepad2 className="size-3" aria-hidden="true" />
              Guilda de PokeMMO · comunidade ativa desde 2018
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Um lugar para aprender, jogar e{" "}
              <span className="text-accent">fazer parte</span>.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              A Cinnabares reúne jogadores competitivos e casuais para participar
              de eventos e encontrar uma comunidade acolhedora.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#eventos">Ver eventos</a>
              </Button>
            </div>
            <dl className="mt-1 grid w-full max-w-md grid-cols-3 gap-4 border-t border-border pt-5">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="font-heading text-2xl font-bold text-accent">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/10 blur-3xl"
            />
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-white/15">
              <Image
                src={base}
                alt="Arte principal da guilda Cinnabares"
                className="aspect-[4/3] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2 sm:top-6 sm:left-6">
                {floatingBadges.map((badge) => (
                  <div
                    key={badge.title}
                    className="flex items-center gap-2.5 rounded-xl bg-background/85 px-3 py-2 shadow-lg ring-1 ring-white/15 backdrop-blur-md"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
                      <badge.icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-semibold">
                        {badge.title}
                      </span>
                      <span className="text-[0.7rem] text-muted-foreground">
                        {badge.description}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Image
              src={chibi}
              alt=""
              aria-hidden="true"
              className="absolute right-0 bottom-0 z-10 w-40 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] sm:w-52 lg:w-64"
              sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 16rem"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
