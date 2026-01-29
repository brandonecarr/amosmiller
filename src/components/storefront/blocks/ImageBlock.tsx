import Image from "next/image";
import type { ImageBlock as ImageBlockType } from "@/types/cms";

interface ImageBlockProps {
  block: ImageBlockType;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { url, alt, caption } = block.data;

  if (!url) return null;

  return (
    <figure className="max-w-4xl mx-auto px-4">
      <Image
        src={url}
        alt={alt || ""}
        width={1024}
        height={576}
        className="w-full h-auto rounded-lg"
        style={{ height: 'auto' }}
      />
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-[var(--color-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
