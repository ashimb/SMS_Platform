import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp, signInAs } from "@/test/utils.tsx";

import { parseListParams, studentCreateSchema, toSearchParams } from "./schemas.ts";

const valid = {
  admission_no: "SPS/2026/9001",
  first_name: "  Ritika  ",
  middle_name: "",
  last_name: "চট্টোপাধ্যায়",
  date_of_birth: "2015-06-01",
  gender: "female",
  admission_date: "2021-04-01",
  current_grade: "5",
  section: "",
};

describe("student schemas (mirror the API rules)", () => {
  it("normalises names, turns empty optionals into null, and accepts Indic scripts", () => {
    const parsed = studentCreateSchema.parse(valid);
    expect(parsed.first_name).toBe("Ritika");
    expect(parsed.middle_name).toBeNull();
    expect(parsed.last_name).toBe("চট্টোপাধ্যায়");
    expect(parsed.section).toBeNull();
  });

  it.each([
    [{ admission_no: "bad no!" }, "admission_no", "validation.admissionNoInvalid"],
    [{ first_name: "R2D2" }, "first_name", "validation.nameInvalid"],
    [{ gender: "" }, "gender", "validation.genderRequired"],
    [{ date_of_birth: "2099-01-01" }, "date_of_birth", "validation.dateInFuture"],
    [{ date_of_birth: "2020-06-01" }, "date_of_birth", "validation.ageRange"],
  ])("rejects %o", (patch, path, message) => {
    const result = studentCreateSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === path)?.message).toBe(message);
  });

  it("parses list state from the URL defensively", () => {
    expect(parseListParams(new URLSearchParams("page=-4&status=hacked&q=ab"))).toEqual({
      page: 1,
      status: null,
      q: "ab",
    });
    expect(toSearchParams({ page: 1, q: "", status: "enrolled" }).toString()).toBe(
      "status=enrolled",
    );
  });
});

describe("student create, detail and edit", () => {
  it("creates a student and opens the profile", async () => {
    await signInAs("admin@school.test");
    const { user, router } = renderApp("/students/new");
    await screen.findByRole("heading", { name: "Add student", level: 1 });

    await user.type(screen.getByLabelText(/^Admission no\./), "SPS/2026/9001");
    await user.type(screen.getByLabelText(/^Admission date/), "2021-04-01");
    await user.type(screen.getByLabelText(/^First name/), "Ritika");
    await user.type(screen.getByLabelText(/^Last name/), "Ghosh");
    await user.type(screen.getByLabelText(/^Date of birth/), "2015-06-01");
    await user.click(screen.getByRole("combobox", { name: /^Gender/ }));
    await user.click(await screen.findByRole("option", { name: "Female" }));
    await user.click(screen.getByRole("button", { name: "Add student" }));

    expect(
      await screen.findByRole("heading", { name: "Ritika Ghosh", level: 1 }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/students\/[0-9a-f-]{36}$/);
    expect(screen.getByText("Provisional")).toBeInTheDocument();
  });

  it("shows a duplicate admission number on the field (409)", async () => {
    await signInAs("admin@school.test");
    const { user } = renderApp("/students/new");
    await screen.findByRole("heading", { name: "Add student", level: 1 });

    await user.type(screen.getByLabelText(/^Admission no\./), "SPS/2026/0001");
    await user.type(screen.getByLabelText(/^Admission date/), "2021-04-01");
    await user.type(screen.getByLabelText(/^First name/), "Sourav");
    await user.type(screen.getByLabelText(/^Date of birth/), "2015-06-01");
    await user.click(screen.getByRole("combobox", { name: /^Gender/ }));
    await user.click(await screen.findByRole("option", { name: "Male" }));
    await user.click(screen.getByRole("button", { name: "Add student" }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Admission no\./)).toHaveAccessibleDescription(
        expect.stringContaining("already in use") as string,
      );
    });
  });

  it("edits only the editable fields", async () => {
    await signInAs("admin@school.test");
    const { user } = renderApp("/students/10000000-0000-4000-8000-000000000001/edit");
    const first = await screen.findByLabelText(/^First name/);
    expect(screen.getByLabelText(/^Admission no\./)).toHaveAttribute("readonly");

    await user.clear(first);
    await user.type(first, "Aaravi");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("heading", { name: /^Aaravi/, level: 1 })).toBeInTheDocument();
  });

  it("shows 'not found' for unknown records without revealing more", async () => {
    await signInAs("admin@school.test");
    renderApp("/students/10000000-0000-4000-8000-999999999999");
    expect(
      await screen.findByRole("heading", { name: "Student not found", level: 1 }),
    ).toBeInTheDocument();
  });
});
