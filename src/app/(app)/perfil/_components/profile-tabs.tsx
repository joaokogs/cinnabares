"use client"

import type { ReactNode } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ProfileTabsProps = {
  overview: ReactNode
  historico: ReactNode
}

export function ProfileTabs({ overview, historico }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="principal" className="w-full">
      <TabsList aria-label="Seções do perfil" className="grid h-11 w-full grid-cols-2 rounded-xl bg-card/90 p-1 ring-1 ring-foreground/10">
        <TabsTrigger value="principal" className="h-9">Principal</TabsTrigger>
        <TabsTrigger value="historico" className="h-9">Histórico</TabsTrigger>
      </TabsList>
      <TabsContent value="principal" className="mt-6">
        {overview}
      </TabsContent>
      <TabsContent value="historico" className="mt-6">
        {historico}
      </TabsContent>
    </Tabs>
  )
}
