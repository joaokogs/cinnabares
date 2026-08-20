import type { Metadata } from "next"

import { NewGuildForm } from "../_components/new-guild-form"

export const metadata: Metadata = {
  title: "Criar guilda",
}

export default async function NewGuildPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Nova comunidade</p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Crie sua guilda</h1>
          <p className="mt-3 leading-7 text-muted-foreground">De um nome ao seu espaco e comeca a reunir seus players.</p>
        </div>
        <NewGuildForm />
      </div>
    </main>
  )
}
