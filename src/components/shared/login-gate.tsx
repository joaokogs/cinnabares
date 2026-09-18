"use client"

import Link from "next/link"
import { createContext, useContext, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type LoginGate = {
  isAuthenticated: boolean
  openLogin: (redirectTo?: string) => void
}

const LoginGateContext = createContext<LoginGate>({ isAuthenticated: true, openLogin: () => {} })

export function useLoginGate() {
  return useContext(LoginGateContext)
}

function LoginDialog({ open, onOpenChange, redirectTo }: { open: boolean; onOpenChange: (open: boolean) => void; redirectTo: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Entre para continuar</DialogTitle>
          <DialogDescription>Faça login para continuar usando os recursos da comunidade.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Agora não</Button>
          </DialogClose>
          <Button asChild>
            <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Fazer login</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LoginGateProvider({ viewerId, children }: { viewerId: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState("/posts")

  function openLogin(target?: string) {
    setRedirectTo(target ?? `${window.location.pathname}${window.location.search}`)
    setOpen(true)
  }

  return (
    <LoginGateContext.Provider value={{ isAuthenticated: viewerId !== null, openLogin }}>
      {children}
      <LoginDialog open={open} onOpenChange={setOpen} redirectTo={redirectTo} />
    </LoginGateContext.Provider>
  )
}
