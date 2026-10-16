import { Button, Skeleton } from "@school-platform/ui";
import { ArrowLeft, Pencil, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { isApiError } from "@/lib/api.ts";
import { Can } from "@/shared/components/Can.tsx";
import { EmptyState } from "@/shared/components/EmptyState.tsx";
import { PageHeader } from "@/shared/components/PageHeader.tsx";
import { QueryError } from "@/shared/components/QueryError.tsx";
import { PERMISSIONS } from "@/shared/constants/permissions.ts";
import { ROUTES } from "@/shared/constants/routes.ts";

import { useStudent } from "../api/index.ts";
import { StudentProfile } from "../components/StudentProfile.tsx";
import { fullName } from "../components/StudentStatusBadge.tsx";

export function BackToStudents() {
  const { t } = useTranslation("students");
  return (
    <Link
      to={ROUTES.students}
      className="inline-flex items-center gap-1.5 rounded text-sm text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {t("list.title")}
    </Link>
  );
}

export function StudentDetailPage() {
  const { t } = useTranslation("students");
  const { studentId = "" } = useParams();
  const query = useStudent(studentId);

  if (query.isPending) {
    return (
      <div className="space-y-6" role="status" aria-label={t("detail.loading")}>
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    // 404 also covers "exists but outside your scope" (the API never reveals which).
    return isApiError(query.error, 404) || isApiError(query.error, 422) ? (
      <div className="space-y-6">
        <PageHeader title={t("detail.notFoundTitle")} breadcrumbs={<BackToStudents />} />
        <EmptyState
          icon={<UserRound />}
          title={t("detail.notFoundTitle")}
          description={t("detail.notFoundBody")}
          headingLevel="h2"
          action={
            <Button asChild variant="secondary">
              <Link to={ROUTES.students}>{t("detail.backToList")}</Link>
            </Button>
          }
        />
      </div>
    ) : (
      <QueryError error={query.error} onRetry={() => void query.refetch()} />
    );
  }

  const student = query.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName(student)}
        breadcrumbs={<BackToStudents />}
        actions={
          <Can permission={PERMISSIONS.studentsUpdate}>
            <Button asChild variant="secondary">
              <Link to={ROUTES.studentEdit(student.id)}>
                <Pencil aria-hidden="true" />
                {t("detail.edit")}
              </Link>
            </Button>
          </Can>
        }
      />
      <StudentProfile student={student} />
    </div>
  );
}

export default StudentDetailPage;
