import sanitize from "sanitize-html";

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "a", "strong", "em", "u", "s", "code", "pre", "blockquote",
      "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "sub", "sup",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["class", "id", "style"],
    },
    allowedStyles: {
      "*": {
        color: [/.*/],
        "background-color": [/.*/],
        "text-align": [/.*/],
        "font-size": [/.*/],
        "font-weight": [/.*/],
        "font-style": [/.*/],
        "text-decoration": [/.*/],
        margin: [/.*/],
        "margin-top": [/.*/],
        "margin-bottom": [/.*/],
        "margin-left": [/.*/],
        "margin-right": [/.*/],
        padding: [/.*/],
        "padding-top": [/.*/],
        "padding-bottom": [/.*/],
        "padding-left": [/.*/],
        "padding-right": [/.*/],
        width: [/.*/],
        height: [/.*/],
        "max-width": [/.*/],
        "max-height": [/.*/],
        display: [/.*/],
        float: [/.*/],
      },
    },
  });
}
