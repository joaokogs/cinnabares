import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-6 py-24">
      <section className="flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary">PokeMMO · Guilda</Badge>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Cinnabares
        </h1>
        <p className="max-w-xl text-muted-foreground">
          A guilda onde treino sério encontra amizade de verdade. Competitivo,
          casual ou colecionador: aqui tem espaço pra todo mundo.
        </p>
        <div className="flex items-center gap-3">
          <Button>Junte-se à guilda</Button>
          <Button variant="outline">Saiba mais</Button>
        </div>
      </section>

      <section className="grid w-full gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Competitivo</CardTitle>
            <CardDescription>Times e campeonatos</CardDescription>
          </CardHeader>
          <CardContent>
            Treinamento em equipe, metas de tier e suporte dos membros mais
            experientes.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Casual</CardTitle>
            <CardDescription>Diversão em primeiro lugar</CardDescription>
          </CardHeader>
          <CardContent>
            Eventos, caçadas e aquele bate-papo leve no canal da guilda.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coleção</CardTitle>
            <CardDescription>Pokédex e cosméticos</CardDescription>
          </CardHeader>
          <CardContent>
            Troca de shinies, ajuda com o endgame e mercado do servidor.
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
