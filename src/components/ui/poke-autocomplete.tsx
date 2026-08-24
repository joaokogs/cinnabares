"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, CircleDot, Package } from "lucide-react"

import type { PokeOption } from "@/hooks/use-pokeapi-data"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  options: PokeOption[]
  kind: "pokemon" | "item"
  placeholder: string
  id: string
  required?: boolean
}

const specialNames: Record<string, string> = {
  farfetchd: "Farfetch'd",
  "ho-oh": "Ho-Oh",
  "mime-jr": "Mime Jr.",
  "mr-mime": "Mr. Mime",
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "porygon-z": "Porygon-Z",
}

function formatName(name: string) {
  if (specialNames[name]) return specialNames[name]

  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function PokeIcon({ option, kind, className }: { option?: PokeOption; kind: Props["kind"]; className?: string }) {
  const [failed, setFailed] = useState(false)
  const FallbackIcon = kind === "pokemon" ? CircleDot : Package

  if (!option?.iconUrl || failed) return <FallbackIcon aria-hidden="true" className={cn("text-muted-foreground", className)} />

  return <Image src={option.iconUrl} alt="" width={28} height={28} className={cn("object-contain", className)} onError={() => setFailed(true)} unoptimized />
}

export function PokeAutocomplete({ value, onChange, options, kind, placeholder, id, required = false }: Props) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const closeTimer = useRef<number | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedOption = options.find((option) => option.name === value.trim().toLowerCase())
  const query = value.trim().toLowerCase()
  const filteredOptions = options
    .filter((option) => option.name.includes(query) || formatName(option.name).toLowerCase().includes(query))
    .slice(0, 8)

  useEffect(() => {
    if (open) optionRefs.current[highlighted]?.scrollIntoView({ block: "nearest" })
  }, [highlighted, open])

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
  }, [])

  function selectOption(option: PokeOption) {
    onChange(option.name)
    setOpen(false)
    setHighlighted(0)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setHighlighted(0)
      } else {
        setHighlighted((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)))
      }
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlighted((current) => Math.max(current - 1, 0))
    }
    if (event.key === "Enter" && open && filteredOptions[highlighted]) {
      event.preventDefault()
      selectOption(filteredOptions[highlighted])
    }
    if (event.key === "Escape") setOpen(false)
  }

  return (
    <div className="relative">
      <PokeIcon option={selectedOption} kind={kind} className="pointer-events-none absolute top-1/2 left-2 z-10 size-6 -translate-y-1/2" />
      <input
        id={id}
        required={required}
        value={selectedOption ? formatName(selectedOption.name) : value}
        onChange={(event) => {
          onChange(event.target.value)
          setHighlighted(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
          closeTimer.current = window.setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-label={placeholder}
        aria-controls={`${id}-options`}
        aria-expanded={open}
        aria-activedescendant={open && filteredOptions[highlighted] ? `${id}-option-${highlighted}` : undefined}
        className="h-9 w-full rounded-lg border border-input bg-background/70 pr-7 pl-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
      <ChevronDown aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground transition-transform", open && "rotate-180")} />
      {open ? (
        <div className="absolute top-full z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {filteredOptions.length > 0 ? <div id={`${id}-options`} role="listbox">
            {filteredOptions.map((option, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === highlighted}
                id={`${id}-option-${index}`}
                key={option.name}
                ref={(element) => { optionRefs.current[index] = element }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlighted(index)}
                className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted", index === highlighted && "bg-muted")}
              >
                <PokeIcon option={option} kind={kind} className="size-7 shrink-0" />
                <span className="truncate">{formatName(option.name)}</span>
              </button>
            ))}
          </div> : <p role="status" className="px-2 py-2 text-xs text-muted-foreground">Nenhuma sugestão encontrada.</p>}
        </div>
      ) : null}
    </div>
  )
}
