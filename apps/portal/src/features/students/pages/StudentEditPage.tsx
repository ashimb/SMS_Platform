import { Skeleton, toast } from "@school-platform/ui";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/shared/components/PageHeader.tsx";
import { QueryError } from "@/shared/components/QueryError.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";

import { useStudent, useUpdateStudent } from "../api/index.ts";
import { StudentForm } from "../components/StudentForm.tsx";
import { fullName } from "../components/StudentStatusBadge.tsx";
import { BackToStudents } from "./StudentDetailPage.tsx";

export function StudentEditPage() {
  const { t } = useTranslation("students");
  const navigate = useNavigate();
  const { studentId = "" } = useParams();
  const query = useStudent(studentId);
  const update = useUpdateStudent(studentId);

  if (query.isPending) {
    return (
      <div className="space-y-6" role="status" aria-label={t("detail.loading")}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />;

  const student = query.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("form.editTitle")}
        documentTitle={`${t("form.editTitle")}: ${fullName(student)}`}
        description={fullName(student)}
        breadcrumbs={<BackToStudents />}
      />
      <StudentForm
        mode="edit"
        student={student}
        onCancel={() => void navigate(ROUTES.student(student.id))}
        onSubmit={async (values) => {
          const saved = await update.mutateAsync(values);
          toast.success(t("form.saved", { name: fullName(saved) }));
          void navigate(ROUTES.student(saved.id), { replace: true });
        }}
      />
    </div>
  );
}

export default StudentEditPage;
