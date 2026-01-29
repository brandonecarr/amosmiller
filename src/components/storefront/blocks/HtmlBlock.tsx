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
      className="max-w-5xl mx-auto px-4 [&_h1]:font-heading [&_h1]:text-slate-900 [&_h2]:font-heading [&_h2]:text-slate-900 [&_h3]:font-heading [&_h3]:text-slate-900 [&_h4]:font-heading [&_h4]:text-slate-900 [&_p]:text-slate-700 [&_a]:text-orange-500 hover:[&_a]:text-orange-600 [&_a]:transition-colors"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
