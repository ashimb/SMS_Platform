import { PageHeader as BasePageHeader, type PageHeaderProps } from "@school-platform/ui";

import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle.ts";

/**
 * Page title block. Also sets the document title ("Students · School name"), so every route has
 * a unique title for tabs, history and screen readers (WCAG 2.4.2).
 */
export function PageHeader({
  title,
  documentTitle,
  ...props
}: PageHeaderProps & { title: string; documentTitle?: string }) {
  useDocumentTitle(documentTitle ?? title);
  return <BasePageHeader title={title} {...props} />;
}
