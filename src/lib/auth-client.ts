"use client"

import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"

const authBaseURL = process.env.NEXT_PUBLIC_SITE_URL

export const authClient = createAuthClient({
  ...(authBaseURL ? { baseURL: authBaseURL } : {}),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [usernameClient()],
})
