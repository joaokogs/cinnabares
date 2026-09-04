import type { Guide } from "@/lib/guides/types"

import evento2 from "@/assets/images/evento2.png"

export const entendendoOsTiersEOLadder: Guide = {
  slug: "entendendo-os-tiers-e-o-ladder",
  title: "Entendendo os tiers e o ladder PvP",
  excerpt:
    "O que significam os tiers do ladder, como eles mudam e por que você não deveria se prender a tier lists prontas.",
  mode: "pvp",
  category: { title: "Tiers", slug: "tiers" },
  tags: ["Tiers", "Estratégias"],
  cover: {
    url: evento2.src,
    alt: "Arte do torneio da guilda ilustrando o guia de tiers do ladder",
  },
  publishedAt: "2026-05-30",
  author: "Cinna",
  body: [
    {
      _type: "block",
      _key: "d1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "d1s1",
          text: "Os tiers (OU, UU, NU e por aí vai) não são um ranking de quem é melhor: são um sistema baseado em ",
        },
        {
          _type: "span",
          _key: "d1s2",
          text: "uso no ladder",
          marks: ["strong"],
        },
        {
          _type: "span",
          _key: "d1s3",
          text: ". Quanto mais um Pokémon aparece, maior o tier em que ele vive.",
        },
      ],
    },
    {
      _type: "block",
      _key: "d2",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "d2s1",
          text: "Por que isso importa?",
        },
      ],
    },
    {
      _type: "block",
      _key: "d3",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "d3s1",
          text: "Porque a meta muda. Um set novo surge, um counter aparece, e o uso migra. Tier lists publicadas ficam defasadas em semanas. Em vez de copiar, entenda o ",
        },
        {
          _type: "span",
          _key: "d3s2",
          text: "porquê",
          marks: ["em"],
        },
        {
          _type: "span",
          _key: "d3s3",
          text: " por trás de cada escolha: cobertura de tipos, speed tiers e matchups de arquétipo.",
        },
      ],
    },
    {
      _type: "block",
      _key: "d4",
      style: "h3",
      children: [
        {
          _type: "span",
          _key: "d4s1",
          text: "Lendo o ladder",
        },
      ],
    },
    {
      _type: "block",
      _key: "d5",
      style: "normal",
      listItem: "number",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "d5s1",
          text: "Acompanhe o topo do ladder por algumas semanas antes de montar time.",
        },
      ],
    },
    {
      _type: "block",
      _key: "d6",
      style: "normal",
      listItem: "number",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "d6s1",
          text: "Anote os cinco Pokémon mais comuns e prepare respostas para cada um.",
        },
      ],
    },
    {
      _type: "block",
      _key: "d7",
      style: "normal",
      listItem: "number",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "d7s1",
          text: "Teste em battle simulator até o time responder sem sustos.",
        },
      ],
    },
    {
      _type: "block",
      _key: "d8",
      style: "blockquote",
      children: [
        {
          _type: "span",
          _key: "d8s1",
          text: "Meta é maré: saber surfar importa mais do que decorar a tabela do dia.",
        },
      ],
    },
  ],
}