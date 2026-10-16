/**
 * Create/edit form (React Hook Form + Zod). Server-side validation (422) and duplicate admission
 * numbers (409) are shown on the matching field, and focus moves to the first invalid field.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, FormField, Input, Select } from "@school-platform/ui";
import { useMemo, useState } from "react";
import { Controller, type FieldPath, type Resolver, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormAlert } from "@/features/auth/components/FormAlert.tsx";
import { isApiError } from "@/lib/api.ts";
import { TraceId } from "@/shared/components/TraceId.tsx";
import { todayIsoDate } from "@/shared/utils/format.ts";

import {
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  type StudentCreateInput,
  type StudentCreateOutput,
  studentCreateSchema,
  type StudentEditFormOutput,
  studentEditFormSchema,
  type StudentUpdateOutput,
} from "../schemas.ts";
import { GENDERS, type Student } from "../types.ts";

interface CreateProps {
  mode: "create";
  onSubmit: (values: StudentCreateOutput) => Promise<unknown>;
}
interface EditProps {
  mode: "edit";
  student: Student;
  onSubmit: (values: StudentUpdateOutput) => Promise<unknown>;
}

export type StudentFormProps = (CreateProps | EditProps) & { onCancel: () => void };

type Values = StudentCreateInput;

const EMPTY: Values = {
  admission_no: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  admission_date: "",
  current_grade: "",
  section: "",
};

function defaultsFor(student: Student): Values {
  return {
    ...EMPTY,
    admission_no: student.admission_no,
    first_name: student.first_name,
    middle_name: student.middle_name ?? "",
    last_name: student.last_name ?? "",
    date_of_birth: student.date_of_birth,
    gender: student.gender,
    admission_date: student.admission_date,
    current_grade: student.current_grade ?? "",
    section: student.section ?? "",
  };
}

export function StudentForm(props: StudentFormProps) {
  const { t } = useTranslation("students");
  const isEdit = props.mode === "edit";
  const [failure, setFailure] = useState<{ traceId: string | null } | null>(null);
  const today = todayIsoDate();
  // Edit mode validates only the editable fields; the rest are shown read-only.
  const resolver: Resolver<Values, unknown, StudentCreateOutput | StudentEditFormOutput> = useMemo(
    () => (isEdit ? zodResolver(studentEditFormSchema) : zodResolver(studentCreateSchema)),
    [isEdit],
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values, unknown, StudentCreateOutput | StudentEditFormOutput>({
    resolver,
    defaultValues: props.mode === "edit" ? defaultsFor(props.student) : EMPTY,
    shouldFocusError: true,
  });

  const message = (key: FieldPath<Values>) => {
    const text = errors[key]?.message;
    return text
      ? t(text, { min: MIN_AGE_YEARS, max: MAX_AGE_YEARS, defaultValue: text })
      : undefined;
  };

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      if (props.mode === "edit") {
        const { first_name, middle_name, last_name, current_grade, section } = values;
        await props.onSubmit({ first_name, middle_name, last_name, current_grade, section });
      } else {
        await props.onSubmit(values as StudentCreateOutput);
      }
    } catch (error) {
      if (isApiError(error, 409)) {
        setError("admission_no", { message: "validation.admissionNoTaken" });
        setFocus("admission_no");
        return;
      }
      if (isApiError(error, 422)) {
        const fields = error.fieldErrors();
        const known = Object.keys(EMPTY) as FieldPath<Values>[];
        let first: FieldPath<Values> | null = null;
        for (const [field, text] of Object.entries(fields)) {
          const name = known.find((k) => k === field);
          if (name) {
            setError(name, { message: text });
            first ??= name;
          }
        }
        if (first) {
          setFocus(first);
          return;
        }
      }
      setFailure({ traceId: isApiError(error) ? error.traceId : null });
    }
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-label={isEdit ? t("form.editTitle") : t("form.createTitle")}
    >
      <Card className="divide-y divide-border">
        {failure ? (
          <div className="p-5 sm:p-6">
            <FormAlert tone="error">
              <p>{t("form.saveFailed")}</p>
              {failure.traceId ? <TraceId value={failure.traceId} /> : null}
            </FormAlert>
          </div>
        ) : null}

        <fieldset className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <legend className="sr-only">{t("form.identity")}</legend>
          <div className="sm:col-span-2">
            <h2 className="font-display text-base font-semibold text-fg">{t("form.identity")}</h2>
            <p className="text-sm text-fg-muted">{t("form.identityHint")}</p>
          </div>
          <FormField
            label={t("fields.admissionNo")}
            required={!isEdit}
            hint={isEdit ? t("form.readOnlyHint") : t("form.admissionNoHint")}
            error={message("admission_no")}
          >
            <Input
              autoComplete="off"
              readOnly={isEdit}
              disabled={isSubmitting}
              {...register("admission_no")}
            />
          </FormField>
          <FormField
            label={t("fields.admissionDate")}
            required={!isEdit}
            error={message("admission_date")}
          >
            <Input
              type="date"
              max={today}
              readOnly={isEdit}
              disabled={isSubmitting}
              {...register("admission_date")}
            />
          </FormField>
          <FormField label={t("fields.firstName")} required error={message("first_name")}>
            <Input autoComplete="off" disabled={isSubmitting} {...register("first_name")} />
          </FormField>
          <FormField label={t("fields.middleName")} error={message("middle_name")}>
            <Input autoComplete="off" disabled={isSubmitting} {...register("middle_name")} />
          </FormField>
          <FormField label={t("fields.lastName")} error={message("last_name")}>
            <Input autoComplete="off" disabled={isSubmitting} {...register("last_name")} />
          </FormField>
          <FormField
            label={t("fields.dateOfBirth")}
            required={!isEdit}
            error={message("date_of_birth")}
          >
            <Input
              type="date"
              max={today}
              readOnly={isEdit}
              disabled={isSubmitting}
              {...register("date_of_birth")}
            />
          </FormField>
          <FormField label={t("fields.gender")} required={!isEdit} error={message("gender")}>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t("form.selectGender")}
                  disabled={isEdit || isSubmitting}
                  options={GENDERS.map((value) => ({ value, label: t(`gender.${value}`) }))}
                />
              )}
            />
          </FormField>
        </fieldset>

        <fieldset className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <legend className="sr-only">{t("form.placement")}</legend>
          <div className="sm:col-span-2">
            <h2 className="font-display text-base font-semibold text-fg">{t("form.placement")}</h2>
            <p className="text-sm text-fg-muted">{t("form.placementHint")}</p>
          </div>
          <FormField
            label={t("fields.grade")}
            hint={t("form.gradeHint")}
            error={message("current_grade")}
          >
            <Input autoComplete="off" disabled={isSubmitting} {...register("current_grade")} />
          </FormField>
          <FormField
            label={t("fields.section")}
            hint={t("form.sectionHint")}
            error={message("section")}
          >
            <Input autoComplete="off" disabled={isSubmitting} {...register("section")} />
          </FormField>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button
            type="button"
            variant="secondary"
            onClick={props.onCancel}
            disabled={isSubmitting}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isEdit && !isDirty}>
            {isEdit ? t("form.saveChanges") : t("form.create")}
          </Button>
        </div>
      </Card>
    </form>
  );
}
