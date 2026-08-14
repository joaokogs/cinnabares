import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Cinnabares",
    template: "%s | Cinnabares",
  },
  description:
    "Guilda Cinnabares — time de PokeMMO unido por amizade, treino competitivo e muita canela. Junte-se à nossa jornada!",
  keywords: ["PokeMMO", "guilda", "Cinnabares", "pokemon", "MMO"],
  openGraph: {
    title: "Cinnabares",
    description:
      "Guilda de PokeMMO — amizade, competitivo e muita canela.",
    type: "website",
    locale: "pt_BR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
