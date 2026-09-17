export type BuildPokemonInput = {
  name: string
  item?: string
  ability?: string
  nature?: string
  ivs?: Record<string, number>
  evs?: Record<string, number>
  moves?: string[]
}

export type PostInput = {
  title: string
  description: string
  pokemon: BuildPokemonInput[]
}

export type PostComment = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    name: string
    username: string | null
    image: string | null
    avatarUrl: string | null
  }
}

export type PostPokemon = BuildPokemonInput & {
  id: string
  slot: number
  ivs: Record<string, number>
  evs: Record<string, number>
  moves: string[]
}

export type PostFeedItem = {
  id: string
  title: string
  description: string
  createdAt: string
  author: {
    id: string
    name: string
    username: string | null
    image: string | null
    avatarUrl: string | null
  }
  pokemon: PostPokemon[]
  comments: PostComment[]
  counts: {
    likes: number
    comments: number
    reposts: number
    bookmarks: number
  }
  viewer: {
    liked: boolean
    reposted: boolean
    bookmarked: boolean
  }
}
