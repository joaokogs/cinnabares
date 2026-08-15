"use client"

import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"

import { schemaTypes } from "./src/sanity/schemaTypes"

export default defineConfig({
  name: "cinnabares",
  title: "Cinnabares Guias",
  basePath: "/studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "local-project",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})
