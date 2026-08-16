"use client"

import { motion, useReducedMotion } from "motion/react"
import { Fragment, useId } from "react"

type TextSegment = {
  text: string
  className?: string
}

type TextRevealProps = {
  segments: TextSegment[]
  className?: string
  delay?: number
  stagger?: number
}

export function TextReveal({
  segments,
  className,
  delay = 0,
  stagger = 0.07,
}: TextRevealProps) {
  const reduceMotion = useReducedMotion()
  const id = useId()

  if (reduceMotion) {
    return (
      <span className={className}>
        {segments.map((segment, index) => (
          <Fragment key={`${id}-s-${index}`}>
            <span className={segment.className}>{segment.text}</span>
            {index < segments.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    )
  }

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
      }}
    >
      {segments.map((segment, index) => (
        <span key={`${id}-s-${index}`} className={segment.className}>
          {segment.text.split(" ").map((word, wordIndex, words) => (
            <Fragment key={`${id}-w-${index}-${wordIndex}`}>
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: "0.6em", filter: "blur(5px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {word}
              </motion.span>
              {wordIndex < words.length - 1 ? " " : null}
            </Fragment>
          ))}
          {index < segments.length - 1 ? " " : null}
        </span>
      ))}
    </motion.span>
  )
}