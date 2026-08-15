import { defineField, defineType } from "sanity"

export const guide = defineType({
  name: "guide",
  title: "Guia",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "mode",
      title: "Modo",
      type: "string",
      options: {
        list: [
          { title: "PvE", value: "pve" },
          { title: "PvP", value: "pvp" },
        ],
        layout: "radio",
      },
      initialValue: "pve",
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "coverImage",
      title: "Imagem de capa",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Publicado em",
      type: "date",
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "string",
    }),
    defineField({
      name: "body",
      title: "Conteúdo",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Título 2", value: "h2" },
            { title: "Título 3", value: "h3" },
            { title: "Citação", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Negrito", value: "strong" },
              { title: "Itálico", value: "em" },
              { title: "Código", value: "code" },
            ],
            annotations: [
              {
                title: "Link",
                name: "link",
                type: "object",
                fields: [
                  {
                    title: "URL",
                    name: "href",
                    type: "url",
                  },
                ],
              },
            ],
          },
        },
        {
          type: "image",
          title: "Imagem",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              title: "Texto alternativo",
              description: "Descreva a imagem para acessibilidade e SEO.",
              type: "string",
              validation: (rule) => rule.required(),
            },
            {
              name: "caption",
              title: "Legenda",
              type: "string",
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "mode",
      media: "coverImage",
    },
  },
})
