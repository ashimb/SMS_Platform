"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui.tsx";
import {
  ENQUIRY_DEFAULTS,
  type EnquiryInput,
  enquirySchema,
  GRADES,
} from "@/lib/enquiry-schema.ts";

type Status =
  { kind: "idle" } | { kind: "success"; reference: string } | { kind: "error"; message: string };

const GRADE_OPTIONS = GRADES.map((grade) => ({ value: grade, label: grade }));
const FIELD_NAMES = new Set<string>(Object.keys(ENQUIRY_DEFAULTS).concat("grade"));

function isFieldName(name: string): name is keyof EnquiryInput {
  return FIELD_NAMES.has(name);
}

/**
 * Admissions enquiry form. Early validation here is a convenience; the server re-validates every
 * field (api/enquiry), and the hidden `website` input is a honeypot for bots.
 */
export function EnquiryForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: ENQUIRY_DEFAULTS,
    mode: "onTouched",
  });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status.kind === "success") successRef.current?.focus();
  }, [status]);

  const onSubmit = handleSubmit(async (values) => {
    setStatus({ kind: "idle" });
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        // The custom header is the CSRF defence: a cross-site request cannot send it.
        headers: { "Content-Type": "application/json", "X-SP-CSRF": "1" },
        credentials: "same-origin",
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = (await response.json()) as { reference?: unknown };
        setStatus({
          kind: "success",
          reference: typeof data.reference === "string" ? data.reference : "",
        });
        reset();
        return;
      }

      if (response.status === 422) {
        const data = (await response.json()) as { errors?: Record<string, string> };
        for (const [name, message] of Object.entries(data.errors ?? {})) {
          if (isFieldName(name)) setError(name, { type: "server", message });
        }
        setStatus({ kind: "error", message: "Please check the highlighted fields and try again." });
        return;
      }

      if (response.status === 429) {
        const seconds = Number(response.headers.get("retry-after") ?? "");
        const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : 10;
        setStatus({
          kind: "error",
          message: `You have sent several enquiries recently. Please try again in about ${wait} minute${wait === 1 ? "" : "s"}, or call the school office.`,
        });
        return;
      }

      setStatus({
        kind: "error",
        message: "We could not send your enquiry. Please try again, or call the school office.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "We could not reach the server. Check your connection and try again.",
      });
    }
  });

  if (status.kind === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl border border-success-200 bg-success-subtle p-8 text-center outline-none"
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-success" />
        <h3 className="mt-4 text-2xl font-semibold text-success-subtle-fg">
          Thank you. Your enquiry has been received.
        </h3>
        <p className="mt-2 text-fg-muted">
          Our admissions team will call you within two working days.
          {status.reference ? (
            <>
              {" "}
              Your reference is{" "}
              <strong className="font-semibold text-fg">{status.reference}</strong>.
            </>
          ) : null}
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setStatus({ kind: "idle" });
          }}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-label="Admissions enquiry"
      className="space-y-6"
    >
      {status.kind === "error" ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-danger-200 bg-danger-subtle p-4 text-danger-subtle-fg"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>{status.message}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Parent or guardian name" required error={errors.guardianName?.message}>
          <Input
            autoComplete="name"
            enterKeyHint="next"
            disabled={isSubmitting}
            {...register("guardianName")}
          />
        </FormField>
        <FormField label="Child's name" required error={errors.childName?.message}>
          <Input
            autoComplete="off"
            enterKeyHint="next"
            disabled={isSubmitting}
            {...register("childName")}
          />
        </FormField>
        <FormField label="Email address" required error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            spellCheck={false}
            disabled={isSubmitting}
            {...register("email")}
          />
        </FormField>
        <FormField label="Phone number" required error={errors.phone?.message}>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            disabled={isSubmitting}
            {...register("phone")}
          />
        </FormField>
      </div>

      <FormField label="Class applying for" required error={errors.grade?.message}>
        <Controller
          control={control}
          name="grade"
          render={({ field }) => (
            <Select
              name={field.name}
              options={GRADE_OPTIONS}
              placeholder="Choose a class"
              value={field.value ?? ""}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </FormField>

      <FormField
        label="Message"
        hint="Optional. Tell us anything that helps us prepare for your call."
        error={errors.message?.message}
      >
        <Textarea rows={4} maxLength={1000} disabled={isSubmitting} {...register("message")} />
      </FormField>

      {/* Honeypot: invisible and unreachable for people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div>
        <Controller
          control={control}
          name="consent"
          render={({ field }) => (
            <Checkbox
              id="enquiry-consent"
              name={field.name}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
              }}
              disabled={isSubmitting}
              aria-describedby={errors.consent ? "enquiry-consent-error" : undefined}
              aria-invalid={errors.consent ? true : undefined}
              label="I agree that the school may contact me about this enquiry."
            />
          )}
        />
        {errors.consent ? (
          <p
            id="enquiry-consent-error"
            role="alert"
            className="mt-1.5 text-xs font-medium text-danger-subtle-fg"
          >
            {errors.consent.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" loading={isSubmitting}>
        Send enquiry
      </Button>
    </form>
  );
}
