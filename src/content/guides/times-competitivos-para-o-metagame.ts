import type { Guide } from "@/lib/guides/types"

import evento1 from "@/assets/images/evento1.png"

export const timesCompetitivosParaOMetagame: Guide = {
  slug: "times-competitivos-para-o-metagame",
  title: "Times competitivos para o metagame atual",
  excerpt:
    "Como montar times balanceados para o ladder de PvP, cobrindo cores, sinergia de roles e armadilhas comuns.",
  mode: "pvp",
  category: { title: "Times", slug: "times" },
  tags: ["Times", "Tiers", "Estratégias"],
  cover: {
    url: evento1.src,
    alt: "Arte do evento de caçada ilustrando o guia de times competitivos",
  },
  publishedAt: "2026-06-18",
  author: "Guilda",
  body: [
    {
      _type: "block",
      _key: "t1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "t1s1",
          text: "Um bom time competitivo não é uma coleção dos seis Pokémon mais fortes do tier. É um quebra-cabeça de ",
        },
        {
          _type: "span",
          _key: "t1s2",
          text: "roles, coberturas e cores",
          marks: ["strong"],
        },
        {
          _type: "span",
          _key: "t1s3",
          text: " que se encaixam contra os arquétipos mais comuns do ladder.",
        },
      ],
    },
    {
      _type: "block",
      _key: "t2",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "t2s1",
          text: "Estrutura básica de um time",
        },
      ],
    },
    {
      _type: "block",
      _key: "t3",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "t3s1",
          text: "Um lead que define ritmo ou coloca hazards cedo.",
        },
      ],
    },
    {
      _type: "block",
      _key: "t4",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "t4s1",
          text: "Um wall físico e um wall especial para segurar os sweepers adversários.",
        },
      ],
    },
    {
      _type: "block",
      _key: "t5",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "t5s1",
          text: "Um ou dois wallbreakers para abrir buracos na defesa rival.",
        },
      ],
    },
    {
      _type: "block",
      _key: "t6",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "t6s1",
          text: "Um cleaner de fim de jogo, de preferência com setup rápido.",
        },
      ],
    },
    {
      _type: "block",
      _key: "t7",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "t7s1",
          text: "Monte o time num ",
        },
        {
          _type: "span",
          _key: "t7s2",
          text: "teambuilder",
          marks: ["t7link"],
        },
        {
          _type: "span",
          _key: "t7s3",
          text: " e simule as matchups antes de gastar um único poke dólar.",
        },
      ],
      markDefs: [
        {
          _type: "link",
          _key: "t7link",
          href: "https://play.pokemonshowdown.com/",
        },
      ],
    },
    {
      _type: "block",
      _key: "t8",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "t8s1",
          text: "Erros comuns",
        },
      ],
    },
    {
      _type: "block",
      _key: "t9",
      style: "blockquote",
      children: [
        {
          _type: "span",
          _key: "t9s1",
          text: "Time com seis ofensivos sem pivot? Você está a um roar de distância do 6x0. Balanceie, teste, perca, ajuste.",
        },
      ],
    },
  ],
}