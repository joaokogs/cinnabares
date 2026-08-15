export const GUIDE_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  mode,
  "category": category->{ title, "slug": slug.current },
  tags,
  "coverImage": coverImage { alt, "url": asset->url },
  publishedAt,
  author,
  "body": body[] {
    ...,
    _type == "image" => {
      ...,
      "asset": asset->{ "ref": _id, "url": url },
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    }
  }
`

export const GUIDES_LIST_QUERY = `
  *[_type == "guide"] | order(publishedAt desc) {
    ${GUIDE_PROJECTION}
  }
`

export const GUIDE_BY_SLUG_QUERY = `
  *[_type == "guide" && slug.current == $slug][0] {
    ${GUIDE_PROJECTION}
  }
`

export const GUIDES_SLUGS_QUERY = `
  *[_type == "guide"] {
    "slug": slug.current
  }
`
