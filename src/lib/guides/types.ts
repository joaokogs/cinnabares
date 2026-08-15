export type GuideMode = "pve" | "pvp"

export type Category = {
  title: string
  slug: string
}

export type Cover = {
  url: string
  alt: string
}

export type PortableTextMark = {
  _key: string
  _type: string
  href?: string
}

export type PortableTextSpan = {
  _type: "span"
  _key?: string
  text: string
  marks?: string[]
}

export type PortableTextBlock = {
  _type: "block"
  _key?: string
  style?: "normal" | "h1" | "h2" | "h3" | "h4" | "blockquote"
  listItem?: "bullet" | "number"
  level?: number
  children?: PortableTextSpan[]
  markDefs?: PortableTextMark[]
}

export type PortableTextImage = {
  _type: "image"
  _key: string
  asset: {
    ref: string
    url?: string
  }
  alt?: string
  caption?: string
  width?: number
  height?: number
}

export type GuideBodyItem = PortableTextBlock | PortableTextImage

export type GuideBody = GuideBodyItem[]

export type Guide = {
  slug: string
  title: string
  excerpt: string
  mode: GuideMode
  category: Category
  tags: string[]
  cover: Cover
  publishedAt: string
  author: string
  body: GuideBody
}

export type GuideSummary = Omit<Guide, "body">
