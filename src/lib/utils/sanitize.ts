import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
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
