"use client"

import { motion, useReducedMotion } from "motion/react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import chibi from "@/assets/images/chibi.png"

type ChibiProps = {
  className?: string
}

export function Chibi({ className }: ChibiProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={cn("relative", className)}
      animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        aria-hidden="true"
        className="glow-pulse absolute -inset-8 -z-10 rounded-full bg-accent/30 blur-2xl"
      />
      <Image
        src={chibi}
        alt=""
        aria-hidden="true"
        className="relative w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
        sizes="(max-width: 640px) 9rem, (max-width: 1024px) 13rem, 16rem"
      />
    </motion.div>
  )
}
