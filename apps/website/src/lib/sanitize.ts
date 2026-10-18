/**
 * Sanitiser for CMS rich text (FRD FR-SEC-018). The only HTML that reaches the page passes
 * through here, via components/security/SafeHtml.tsx.
 *
 * Allow-list approach: a small set of formatting tags and attributes. Scripts, styles, forms,
 * iframes, event handlers, inline styles, data attributes and non-http(s)/mailto/tel URLs are
 * removed. Links that open a new tab always get rel="noopener noreferrer".
 */
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "a",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];
const ALLOWED_ATTR = ["href", "title", "target", "rel", "colspan", "rowspan"];
const ALLOWED_URI = /^(?:(?:https?|mailto|tel):|\/(?![/\\])|#)/i;

let hooked = false;

function ensureHook(): void {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName !== "A") return;
    if (node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    } else {
      node.removeAttribute("target");
      node.removeAttribute("rel");
    }
  });
}

export function sanitizeHtml(dirty: string): string {
  ensureHook();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: ALLOWED_URI,
    // DOMPurify tests every non-listed attribute value against the URI pattern above; these two
    // carry keywords (`_blank`, `noopener`), not URLs, and are normalised by the hook.
    ADD_URI_SAFE_ATTR: ["target", "rel"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "svg", "math"],
    RETURN_TRUSTED_TYPE: false,
  });
}
