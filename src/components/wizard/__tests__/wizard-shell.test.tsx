import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WizardShell } from "../wizard-shell";

const styles = [
  {
    styleId: "apple",
    name: "Apple Style",
    description: "Minimal modern style.",
    path: "/tmp/apple/DESIGN.md"
  }
];

describe("WizardShell", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks next-step navigation when required business fields are missing", async () => {
    render(<WizardShell styles={styles} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 2 of 7: Business")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Business name is required.")).toBeInTheDocument();
    expect(screen.getByText("Business category is required.")).toBeInTheDocument();
    expect(screen.getByText("Business description is required.")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 7: Business")).toBeInTheDocument();
  });

  it("completes the wizard with minimum required fields and submits to project API", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ projectSlug: "blue-peak-dental" }), { status: 201 }));

    render(<WizardShell styles={styles} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByLabelText("Business Name"), { target: { value: "Blue Peak Dental" } });
    fireEvent.change(screen.getByLabelText("Business Category"), { target: { value: "Dental Clinic" } });
    fireEvent.change(screen.getByLabelText("Business Description"), {
      target: { value: "Family dentistry and preventive care." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByLabelText("Service 1"), { target: { value: "Teeth cleaning" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "555-123-4567" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "hello@bluepeakdental.com" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Austin" } });
    fireEvent.change(screen.getByLabelText("State"), { target: { value: "TX" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects",
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    expect(await screen.findByText(/Project created successfully as "blue-peak-dental"/)).toBeInTheDocument();
  });
});
