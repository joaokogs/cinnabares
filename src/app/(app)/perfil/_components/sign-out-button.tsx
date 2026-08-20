"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" onClick={handleSignOut}>
      <LogOut aria-hidden="true" />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  )
}
