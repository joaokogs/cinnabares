"use client"

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

type TiltProps = {
  children: ReactNode
  className?: string
  max?: number
  scale?: number
}

export function Tilt({ children, className, max = 6, scale = 1.02 }: TiltProps) {
  const reduceMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)
  const hovered = useMotionValue(0)

  const spring = { stiffness: 180, damping: 20 }

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-max, max]), spring)
  const tiltScale = useSpring(useTransform(hovered, [0, 1], [1, scale]), spring)

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)")
    const update = () => setEnabled(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  function handlePointerEnter() {
    hovered.set(1)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - rect.left) / rect.width)
    pointerY.set((event.clientY - rect.top) / rect.height)
  }

  function handlePointerLeave() {
    hovered.set(0)
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  const active = enabled && !reduceMotion

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      style={
        active
          ? {
              rotateX,
              rotateY,
              scale: tiltScale,
              transformPerspective: 900,
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      onPointerEnter={active ? handlePointerEnter : undefined}
      onPointerMove={active ? handlePointerMove : undefined}
      onPointerLeave={active ? handlePointerLeave : undefined}
    >
      {children}
    </motion.div>
  )
}