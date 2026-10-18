import { sanitizeHtml } from "@/lib/sanitize.ts";

interface SafeHtmlProps {
  /** Untrusted HTML from the CMS. It is sanitised here; never pass pre-trusted strings around. */
  html: string;
  className?: string;
}

/**
 * The single place where CMS HTML is rendered. ESLint bans dangerouslySetInnerHTML everywhere
 * else (packages/config/eslint); this component is the reviewed exception because the markup
 * always passes through the allow-list sanitiser first (lib/sanitize.ts, covered by tests).
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = sanitizeHtml(html);
  return (
    <div
      className={className ? `prose-cms ${className}` : "prose-cms"}
      // eslint-disable-next-line no-restricted-syntax -- sanitised above with an allow-list
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
