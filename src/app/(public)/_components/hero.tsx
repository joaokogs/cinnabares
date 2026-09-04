"use client"

import { MotionValue, motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { CalendarDays, Gamepad2, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import base from "@/assets/images/base.png"
import { Aurora } from "./motion/aurora"
import { Chibi } from "./motion/chibi"
import { CountUp } from "./motion/count-up"
import { Marquee } from "./motion/marquee"
import { TextReveal } from "./motion/text-reveal"
import { Tilt } from "./motion/tilt"

const marqueeItems = [
  "PvE e farms",
  "PvP e competitivo",
  "Caçadas a shinys",
  "Times e tiers",
  "Eventos semanais",
  "Torneios da guilda",
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

type HeroProps = {
  guideCount: number
}

function HeroStats({ guideCount }: { guideCount: number }) {
  const stats: Array<{ label: string; value: number } | { label: string; text: string }> = [
    { label: "Na ativa desde", value: 2018 },
    { label: "Guias publicadas", value: guideCount },
    { label: "Eventos", text: "Semanais" },
  ]

  return (
    <motion.dl
      className="mt-1 grid w-full max-w-md grid-cols-3 gap-4 border-t border-border pt-5"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: {} }}
      transition={{ delayChildren: 0.55, staggerChildren: 0.1 }}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="font-heading text-2xl font-bold text-accent">
            {"value" in stat ? <CountUp value={stat.value} /> : stat.text}
          </dd>
        </motion.div>
      ))}
    </motion.dl>
  )
}

function HeroCopy({ guideCount }: { guideCount: number }) {
  return (
    <div className="flex flex-col items-start gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
      >
        <Badge
          variant="outline"
          className="gap-1.5 border-accent/40 bg-accent/10 text-foreground"
        >
          <Gamepad2 className="size-3" aria-hidden="true" />
          Guilda de PokeMMO · comunidade ativa desde 2018
        </Badge>
      </motion.div>
      <h1 className="font-heading text-5xl leading-[1.08] font-bold tracking-tight text-balance sm:text-6xl lg:text-[4rem]">
        <TextReveal
          delay={0.12}
          stagger={0.06}
          segments={[
            { text: "Um lugar para aprender, jogar e" },
            { text: "fazer parte", className: "text-outline-accent" },
          ]}
        />
      </h1>
      <motion.p
        className="max-w-xl text-lg leading-relaxed text-muted-foreground"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
      >
        A Cinnabares reúne jogadores competitivos e casuais, publica guias
        abertos e organiza eventos para toda a comunidade PokeMMO.
      </motion.p>
      <motion.div
        className="flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
      >
        <Button asChild size="lg" className="btn-shine relative">
          <a href="#eventos">Ver eventos</a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/guias">Explorar guias</Link>
        </Button>
      </motion.div>
      <HeroStats guideCount={guideCount} />
    </div>
  )
}

type HeroImageProps = {
  imageScale: MotionValue<number>
  imageY: MotionValue<number>
  badgesY: MotionValue<number>
  reduceMotion: boolean | null
}

function HeroImage({ imageScale, imageY, badgesY, reduceMotion }: HeroImageProps) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/10 blur-3xl"
        style={{ scale: reduceMotion ? 1 : imageScale }}
      />
      <Tilt>
        <motion.div
          className="relative overflow-hidden rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-white/15"
          style={{
            scale: reduceMotion ? 1 : imageScale,
            y: reduceMotion ? 0 : imageY,
          }}
        >
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
          <motion.div
            className="absolute top-4 left-4 flex flex-col gap-2 sm:top-6 sm:left-6"
            style={{ y: reduceMotion ? 0 : badgesY }}
          >
            {floatingBadges.map((badge) => (
              <div
                key={badge.title}
                className="flex items-center gap-2.5 rounded-xl bg-background/85 px-3 py-2 shadow-lg ring-1 ring-white/15 backdrop-blur-md"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
                  <badge.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-xs font-semibold">{badge.title}</span>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {badge.description}
                  </span>
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Tilt>
      <Chibi className="absolute right-0 bottom-0 z-10 w-36 sm:w-52 lg:w-64" />
    </motion.div>
  )
}

export function Hero({ guideCount }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -28])
  const badgesY = useTransform(scrollYProgress, [0, 1], [0, -56])

  return (
    <section ref={sectionRef} id="inicio" className="relative overflow-hidden">
      <Aurora />
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:pt-16 lg:pb-14">
        <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <HeroCopy guideCount={guideCount} />
          <HeroImage
            imageScale={imageScale}
            imageY={imageY}
            badgesY={badgesY}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
      <Marquee
        items={marqueeItems}
        className="border-y border-border/60 bg-card/40 py-3"
      />
    </section>
  )
}
