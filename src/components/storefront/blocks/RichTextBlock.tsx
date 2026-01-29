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
        className="tiptap prose prose-slate prose-headings:font-heading prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-orange-500 hover:prose-a:text-orange-600 prose-strong:text-slate-900"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </div>
  );
}
