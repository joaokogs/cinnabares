# Cinnabares

Site da guilda **Cinnabares** — time de [PokeMMO](https://pokemmo.eu/) unido por amizade, treino competitivo e muita canela.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components por padrão)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (preset `radix-nova`, base Radix)
- [next-themes](https://github.com/pacocoursey/next-themes) (tema dark-first sem hydration mismatch)
- [motion](https://motion.dev) e [lucide-react](https://lucide.dev) (animações e ícones)

## Requisitos

- Node.js 20+
- npm 10+

## Scripts

```bash
npm run dev       # servidor de desenvolvimento (http://localhost:3000)
npm run build     # build de produção
npm run start     # serve o build de produção
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

## Comandos de inicialização (referência)

O setup inicial deste projeto foi feito com:

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react next-themes motion
npm install -D typescript @types/node @types/react @types/react-dom
npx shadcn@latest init -y -b radix -p nova
npx shadcn@latest add button card badge separator skeleton -y
```
