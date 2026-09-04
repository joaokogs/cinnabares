import type { Guide } from "@/lib/guides/types"

import base from "@/assets/images/base.png"
import evento1 from "@/assets/images/evento1.png"

export const rotasDeFarmDeDinheiro: Guide = {
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
}