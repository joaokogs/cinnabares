import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Providers } from "@/providers"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
