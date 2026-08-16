import { SiteFooter } from "./_components/site-footer"
import { SiteHeader } from "./_components/site-header"
import { MotionProvider } from "./_components/motion-provider"

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:ring-2 focus:ring-accent"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <MotionProvider>
        <div id="conteudo" tabIndex={-1} className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </MotionProvider>
      <SiteFooter />
    </>
  )
}
