import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "../test/a11y.ts";
import { Checkbox } from "./Checkbox.tsx";
import { FormField } from "./FormField.tsx";
import { Input } from "./Input.tsx";
import { Select } from "./Select.tsx";
import { Switch } from "./Switch.tsx";
import { Textarea } from "./Textarea.tsx";

describe("FormField + Input", () => {
  it("associates label, hint and error with the control", async () => {
    render(
      <FormField label="Mobile number" hint="10-digit number" error="Enter a valid number" required>
        <Input name="mobile" />
      </FormField>,
    );
    const input = screen.getByLabelText(/mobile number/i);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-required")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const descriptions = describedBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(descriptions).toEqual(["10-digit number", "Enter a valid number"]);
    expect(screen.getByText("(required)")).toBeTruthy();
    await expectNoA11yViolations();
  });

  it("valid fields are not marked invalid and accept typing", async () => {
    render(
      <FormField label="Name">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Name");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    await userEvent.type(input, "Priya");
    expect((input as HTMLInputElement).value).toBe("Priya");
  });

  it("disabled field disables the control", () => {
    render(
      <FormField label="Admission number" disabled>
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText("Admission number")).toHaveProperty("disabled", true);
  });

  it("outside FormField, keeps its own id and description (pairs with a plain <label>)", async () => {
    render(
      <>
        <label htmlFor="q">Search</label>
        <Input id="q" aria-describedby="q-hint" />
        <span id="q-hint">At least 2 characters</span>
        <label htmlFor="status">Status</label>
        <Select id="status" options={[{ value: "all", label: "All" }]} value="all" />
      </>,
    );
    expect(screen.getByLabelText("Search").getAttribute("aria-describedby")).toBe("q-hint");
    expect(screen.getByRole("combobox", { name: "Status" })).toBeTruthy();
    await expectNoA11yViolations();
  });

  it("supports leading and trailing adornments", async () => {
    render(<Input aria-label="Search" leading={<svg />} trailing="₹" />);
    expect(screen.getByLabelText("Search")).toBeTruthy();
    await expectNoA11yViolations();
  });
});

describe("Textarea", () => {
  it("shows a live character count", async () => {
    render(
      <FormField label="Remarks">
        <Textarea maxLength={50} showCount />
      </FormField>,
    );
    await userEvent.type(screen.getByLabelText("Remarks"), "Good");
    expect(screen.getByText("4 / 50")).toBeTruthy();
    await expectNoA11yViolations();
  });
});

describe("Select", () => {
  const options = [
    { value: "vi", label: "Class VI" },
    { value: "vii", label: "Class VII" },
    { value: "viii", label: "Class VIII", disabled: true },
  ];

  it("is labelled by its FormField and opens with the keyboard", async () => {
    const onValueChange = vi.fn();
    render(
      <FormField label="Class" hint="Current academic year">
        <Select options={options} onValueChange={onValueChange} placeholder="Choose a class" />
      </FormField>,
    );
    const trigger = screen.getByRole("combobox", { name: "Class" });
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    await expectNoA11yViolations();

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeTruthy();
    await userEvent.click(screen.getByRole("option", { name: "Class VII" }));
    expect(onValueChange).toHaveBeenCalledWith("vii");
  });

  it("can be disabled and marked invalid", () => {
    render(<Select aria-label="Section" options={options} disabled invalid />);
    const trigger = screen.getByRole("combobox", { name: "Section" });
    expect(trigger).toHaveProperty("disabled", true);
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("Checkbox", () => {
  it("toggles with Space and exposes checked state", async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        label="Send absence alerts"
        description="By SMS and WhatsApp"
        onCheckedChange={onCheckedChange}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Send absence alerts" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    checkbox.focus();
    await userEvent.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await expectNoA11yViolations();
  });

  it("supports the indeterminate state", () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);
    expect(screen.getByRole("checkbox", { name: "Select all" }).getAttribute("aria-checked")).toBe(
      "mixed",
    );
  });

  it("disabled checkbox ignores interaction", async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Locked" disabled onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Locked" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("Switch", () => {
  it("is a labelled switch toggled by keyboard", async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        label="Dark mode"
        description="Follows your device by default"
        onCheckedChange={onCheckedChange}
      />,
    );
    const control = screen.getByRole("switch", { name: "Dark mode" });
    control.focus();
    await userEvent.keyboard("{Enter}");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await expectNoA11yViolations();
  });

  it("can be disabled", () => {
    render(<Switch aria-label="Notifications" disabled />);
    expect(screen.getByRole("switch", { name: "Notifications" })).toHaveProperty("disabled", true);
  });
});
