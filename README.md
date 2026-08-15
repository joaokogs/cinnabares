# Cinnabares

Site da guilda **Cinnabares** — time de [PokeMMO](https://pokemmo.eu/) unido por amizade, treino competitivo e muita canela.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components por padrão)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (preset `radix-nova`, base Radix)
- [next-themes](https://github.com/pacocoursey/next-themes) (tema dark-first sem hydration mismatch)
- [motion](https://motion.dev) e [lucide-react](https://lucide.dev) (animações e ícones)
- [Sanity](https://www.sanity.io) + [next-sanity](https://next-sanity.vercel.app) (CMS opcional)
- [@portabletext/react](https://portabletext.org) (renderização de Portable Text)

## Requisitos

- Node.js 20+
- npm 10+

## Scripts

```bash
npm run dev       # servidor de desenvolvimento (http://localhost:3000)
npm run build     # build de produção
npm run start     # serve o build de produção
npm run studio    # inicia o Sanity Studio standalone
npm run lint      # ESLint
npm run typecheck # checagem de tipos (tsc --noEmit)
```

## Estrutura

```
src/
├── app/
│   ├── (public)/        # Rotas públicas (landing, etc.)
│   ├── globals.css      # Tokens de tema (dark-first) + Tailwind v4
│   └── layout.tsx       # Root layout (pt-BR, metadados, providers)
├── components/
│   └── ui/              # Componentes shadcn/ui (button, card, badge, ...)
├── lib/
│   └── utils.ts         # cn() — clsx + tailwind-merge
└── providers.tsx        # ThemeProvider (next-themes)
```

## Tema

O site é **dark-first**: os tokens escuros são o padrão em `:root` e o tema claro
é opt-in via classe `.light`. O `ThemeProvider` aplica a classe no `<html>` com
`suppressHydrationWarning`, evitando flash de tema incorreto.

## Adicionar componentes shadcn/ui

```bash
npx shadcn@latest add <componente>
```

## Guias (`/guias`)

Seção de guias estilo blog (farms, shiny hunts, times, tiers e estratégias) com
categorias PvE/PvP, tags, busca e filtros sincronizados na URL.

**Fontes de dados:**

- **Fallback local (padrão):** sem credenciais, os guias vêm de `src/content/guides.ts`
  e funcionam em qualquer ambiente.
- **Sanity CMS (opcional):** defina no `.env` (veja `.env.example`):

  ```bash
  NEXT_PUBLIC_SANITY_PROJECT_ID=seu-projeto
  NEXT_PUBLIC_SANITY_DATASET=production
  NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01 # opcional
  ```

  Com as duas primeiras variáveis presentes, a rota passa a consumir os documentos
  `guide`/`category` do Sanity. Os schemas estão em `src/sanity/schemaTypes/` e o
  contrato/fontes em `src/lib/guides/`.

  O Studio integrado fica disponível em `/studio` durante o desenvolvimento e usa
  `sanity.config.ts` e os schemas compartilhados. O comando `npm run studio` continua
  disponível como alternativa standalone. O site Next.js usa o fallback local quando
  essas variáveis não estão configuradas.

  Para permitir o acesso dos moderadores, adicione `http://localhost:3000` e o domínio
  de produção em **Manage > API > CORS origins** no projeto Sanity, habilitando
  credenciais. Depois convide os moderadores em **Manage > Members** com o papel
  `Editor`.

**Inserir imagens no conteúdo dos guias:**

No Studio, no campo **Conteúdo**, clique em **+** e escolha **Imagem**. Faça o
upload, preencha o **texto alternativo** (obrigatório) e, se quiser, a **legenda**.
A imagem é renderizada no site entre os blocos de texto, responsiva, com lazy
loading e largura alinhada ao artigo.

## Comandos de inicialização (referência)

O setup inicial deste projeto foi feito com:

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react next-themes motion
npm install -D typescript @types/node @types/react @types/react-dom
npx shadcn@latest init -y -b radix -p nova
npx shadcn@latest add button card badge separator skeleton -y
```
