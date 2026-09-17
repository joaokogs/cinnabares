import type { Metadata } from "next"

import { CreatePostPage } from "../_components/post-interactions"

export const metadata: Metadata = {
  title: "Criar post",
}

export default function NewPostPage() {
  return <CreatePostPage />
}
