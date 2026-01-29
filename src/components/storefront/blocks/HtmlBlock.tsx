import type { HtmlBlock as HtmlBlockType } from "@/types/cms";
import { sanitizeHtml } from "@/lib/utils/sanitize";

interface HtmlBlockProps {
  block: HtmlBlockType;
}

export function HtmlBlock({ block }: HtmlBlockProps) {
  const { html } = block.data;

  if (!html) return null;

  return (
    <div
      className="max-w-5xl mx-auto px-4"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
