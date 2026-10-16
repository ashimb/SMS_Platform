import { toast } from "@school-platform/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/shared/components/PageHeader.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";

import { useCreateStudent } from "../api/index.ts";
import { StudentForm } from "../components/StudentForm.tsx";
import { fullName } from "../components/StudentStatusBadge.tsx";
import { BackToStudents } from "./StudentDetailPage.tsx";

export function StudentCreatePage() {
  const { t } = useTranslation("students");
  const navigate = useNavigate();
  const create = useCreateStudent();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("form.createTitle")}
        description={t("form.createDescription")}
        breadcrumbs={<BackToStudents />}
      />
      <StudentForm
        mode="create"
        onCancel={() => void navigate(ROUTES.students)}
        onSubmit={async (values) => {
          const student = await create.mutateAsync(values);
          toast.success(t("form.created", { name: fullName(student) }));
          void navigate(ROUTES.student(student.id), { replace: true });
        }}
      />
    </div>
  );
}

export default StudentCreatePage;
