import NextImage from "next/image"

type GuildImageProps = {
  src: string
  alt: string
  className?: string
  width: number
  height: number
}

export function GuildImage({ src, alt, className, width, height }: GuildImageProps) {
  return <NextImage src={src} alt={alt} width={width} height={height} unoptimized className={className} />
}
