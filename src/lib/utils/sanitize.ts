import DOMPurify from "dompurify";
import { parseHTML } from "linkedom";

// Use linkedom to provide a lightweight DOM for DOMPurify on the server.
// Unlike jsdom, linkedom is pure JavaScript with no native modules,
// so it works reliably in Vercel's serverless runtime.
const { window } = parseHTML("<!DOCTYPE html><html><body></body></html>");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(window as any);

export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "a", "strong", "em", "u", "s", "code", "pre", "blockquote",
      "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "sub", "sup",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "width", "height",
      "class", "id", "style",
    ],
  });
}
