import type { Guide } from "@/lib/guides/types"

import base from "@/assets/images/base.png"
import chibi from "@/assets/images/chibi.png"
import evento1 from "@/assets/images/evento1.png"
import evento2 from "@/assets/images/evento2.png"

export const localGuides: Guide[] = [
  {
    slug: "rotas-de-farm-de-dinheiro",
    title: "Rotas de farm de dinheiro em PvE",
    excerpt:
      "As rotas mais consistentes para encher os bolsos no PokeMMO, com ou sem grupo, e como turbinar o lucro com itens certos.",
    mode: "pve",
    category: { title: "Farms", slug: "farms" },
    tags: ["Farms", "Estratégias", "Rotas"],
    cover: {
      url: base.src,
      alt: "Arte principal da guilda Cinnabares ilustrando o guia de rotas de farm",
    },
    publishedAt: "2026-07-20",
    author: "Cinna",
    body: [
      {
        _type: "block",
        _key: "f1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "f1s1",
            text: "Farmar dinheiro é o primeiro passo para qualquer objetivo no PokeMMO: comprar shinys, montar times ou simplesmente viver sem aperto. Neste guia, reunimos as rotas mais consistentes para encher os bolsos sem perder a sanidade.",
          },
        ],
      },
      {
        _type: "block",
        _key: "f2",
        style: "h2",
        children: [
          {
            _type: "span",
            _key: "f2s1",
            text: "Por que farmar em grupo?",
          },
        ],
      },
      {
        _type: "block",
        _key: "f3",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "f3s1",
            text: "Farmar com a guilda não só torna o processo mais rápido, como também ",
          },
          {
            _type: "span",
            _key: "f3s2",
            text: "muito mais divertido",
            marks: ["strong"],
          },
          {
            _type: "span",
            _key: "f3s3",
            text: ". Dividir rotas e loot reduz o tédio, aumenta a segurança contra trolls e ainda rende conversa boa no canal.",
          },
        ],
      },
      {
        _type: "block",
        _key: "f4",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "f4s1",
            text: "Para preços atualizados de itens e shinys, vale consultar o ",
          },
          {
            _type: "span",
            _key: "f4s2",
            text: "fórum oficial de economia",
            marks: ["f4link"],
          },
          {
            _type: "span",
            _key: "f4s3",
            text: " antes de decidir o que farmar.",
          },
        ],
        markDefs: [
          {
            _type: "link",
            _key: "f4link",
            href: "https://forums.pokemmo.com/index.php?/forum/24-trade-corner/",
          },
        ],
      },
      {
        _type: "block",
        _key: "f5",
        style: "h2",
        children: [
          {
            _type: "span",
            _key: "f5s1",
            text: "Rotas recomendadas",
          },
        ],
      },
      {
        _type: "image",
        _key: "f5img",
        asset: { ref: "local:evento1.png", url: evento1.src },
        alt: "Guilda reunida numa caçada de itens raros em alto-mar",
        caption: "Caçada coletiva da guilda durante evento de rotas de farm.",
        width: 980,
        height: 587,
      },
      {
        _type: "block",
        _key: "f6",
        style: "normal",
        listItem: "bullet",
        level: 1,
        children: [
          {
            _type: "span",
            _key: "f6s1",
            text: "Treinador rico em Kanto, com Amulet Coin e Recompensa de Treinador ativa — rendimento estável por hora.",
          },
        ],
      },
      {
        _type: "block",
        _key: "f7",
        style: "normal",
        listItem: "bullet",
        level: 1,
        children: [
          {
            _type: "span",
            _key: "f7s1",
            text: "Caçada a itens valiosos em Unova usando Pokémon com Pickup.",
          },
        ],
      },
      {
        _type: "block",
        _key: "f8",
        style: "normal",
        listItem: "bullet",
        level: 1,
        children: [
          {
            _type: "span",
            _key: "f8s1",
            text: "Criação e venda de Pokémon competitivos com IVs, naturezas e egg moves certos.",
          },
        ],
      },
      {
        _type: "block",
        _key: "f9",
        style: "blockquote",
        children: [
          {
            _type: "span",
            _key: "f9s1",
            text: "Consistência vale mais que sorte: rotas simples feitas todos os dias batem qualquer jackpot esporádico.",
          },
        ],
      },
    ],
  },
  {
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
  },
  {
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
  },
  {
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
  },
]
