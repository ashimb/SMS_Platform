interface JsonLdProps {
  data: object;
}

/**
 * Structured data for search engines. JSON is serialised by us (never concatenated from request
 * input) and `<` is escaped, so a value such as "</script>" cannot end the script element.
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line no-restricted-syntax -- JSON.stringify output with "<" escaped
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
