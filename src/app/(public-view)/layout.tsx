import { MotionProvider } from "../(public)/_components/motion-provider"

export default function PublicViewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MotionProvider>
      <div id="conteudo" tabIndex={-1} className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    </MotionProvider>
  )
}
