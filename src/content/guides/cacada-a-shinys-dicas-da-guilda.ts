import type { Guide } from "@/lib/guides/types"

import chibi from "@/assets/images/chibi.png"

export const cacadaAShinysDicasDaGuilda: Guide = {
  slug: "cacada-a-shinys-dicas-da-guilda",
  title: "Caçada a shinys: dicas da guilda",
  excerpt:
    "Encounter, suor e paciência: como a Cinnabares organiza suas caçadas e o que você pode fazer para aumentar as chances.",
  mode: "pve",
  category: { title: "Shiny Hunts", slug: "shiny-hunts" },
  tags: ["Shiny Hunts", "Estratégias"],
  cover: {
    url: chibi.src,
    alt: "Mascote chibi da guilda ilustrando o guia de caçada a shinys",
  },
  publishedAt: "2026-07-05",
  author: "Kanoa",
  body: [
    {
      _type: "block",
      _key: "s1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s1t1",
          text: "Caçar shinys é uma das paixões da guilda. Todo mês rola uma caçada coletiva, e a regra é simples: ",
        },
        {
          _type: "span",
          _key: "s1t2",
          text: "ninguém caça sozinho",
          marks: ["strong"],
        },
        {
          _type: "span",
          _key: "s1t3",
          text: " por muito tempo. Dividir o grind em turnos de trinta minutos mantém todo mundo fresco e no clima.",
        },
      ],
    },
    {
      _type: "block",
      _key: "s2",
      style: "h2",
      children: [
        {
          _type: "span",
          _key: "s2t1",
          text: "Antes de começar",
        },
      ],
    },
    {
      _type: "block",
      _key: "s3",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s3t1",
          text: "Leve repelentes em quantidade, tenha uma equipe com Sweet Scent ou abilities de encounter e deixe espaço no PC. E o mais importante: defina um limite de tempo. Caçada longa demais vira tédio, e tédio leva a erro de atenção.",
        },
      ],
    },
    {
      _type: "block",
      _key: "s4",
      style: "h3",
      children: [
        {
          _type: "span",
          _key: "s4t1",
          text: "Ferramentas que ajudam",
        },
      ],
    },
    {
      _type: "block",
      _key: "s5",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "s5t1",
          text: "Encounter tracker para acompanhar contagens e trocar de rota.",
        },
      ],
    },
    {
      _type: "block",
      _key: "s6",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "s6t1",
          text: "Dois monitores ou PiP para assistir algo leve durante o grind.",
        },
      ],
    },
    {
      _type: "block",
      _key: "s7",
      style: "blockquote",
      children: [
        {
          _type: "span",
          _key: "s7t1",
          text: "A caçada ideal não é a mais rápida, é a que você consegue repetir amanhã sem se cansar.",
        },
      ],
    },
  ],
}