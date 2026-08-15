import { NextStudio } from "next-sanity/studio"

import config from "../../../../../sanity.config"

export const dynamic = "force-static"

export { metadata, viewport } from "next-sanity/studio"

function StudioSetupMessage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
      <div className="max-w-lg">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Cinnabares Studio
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Configure o projeto Sanity
        </h1>
        <p className="mt-3 text-muted-foreground">
          Defina NEXT_PUBLIC_SANITY_PROJECT_ID e NEXT_PUBLIC_SANITY_DATASET no ambiente e
          reinicie o servidor.
        </p>
      </div>
    </main>
  )
}

export default function StudioPage() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    return <StudioSetupMessage />
  }

  return <NextStudio config={config} />
}
