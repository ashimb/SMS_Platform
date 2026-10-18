// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnquiryForm } from "@/components/enquiry/EnquiryForm.tsx";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EnquiryForm", () => {
  it("shows accessible validation errors and does not submit an empty form", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<EnquiryForm />);

    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findAllByText("Enter at least 2 characters.")).toHaveLength(2);
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid phone number.")).toBeInTheDocument();
    expect(screen.getByText("Choose the class you are enquiring about.")).toBeInTheDocument();
    expect(screen.getByText("Please agree so we can contact you.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("labels every visible field", () => {
    render(<EnquiryForm />);
    for (const label of [
      /Parent or guardian name/,
      /Child's name/,
      /Email address/,
      /Phone number/,
      /Message/,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole("combobox", { name: /Class applying for/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("hides the honeypot from assistive tech and the tab order", () => {
    const { container } = render(<EnquiryForm />);
    const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot).toHaveValue("");
  });
});
