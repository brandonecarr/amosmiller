import type { RichTextBlock as RichTextBlockType } from "@/types/cms";
import { sanitizeHtml } from "@/lib/utils/sanitize";

interface RichTextBlockProps {
  block: RichTextBlockType;
}

export function RichTextBlock({ block }: RichTextBlockProps) {
  const { html } = block.data;

  if (!html) return null;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div
        className="tiptap"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </div>
  );
}
