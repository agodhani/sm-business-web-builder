import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

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
    pushMock.mockReset();
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

  it("completes the wizard and navigates to preview when generation succeeds", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ projectSlug: "blue-peak-dental" }), { status: 201 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "generated",
            previewPath: "/projects/blue-peak-dental"
          }),
          { status: 200 }
        )
      );

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

    fireEvent.click(screen.getByRole("button", { name: "Create And Generate" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "/api/projects",
        expect.objectContaining({
          method: "POST"
        })
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/projects/blue-peak-dental/generate",
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/projects/blue-peak-dental");
    });
  });

  it("shows failed stage and allows retry generation", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ projectSlug: "blue-peak-dental" }), { status: 201 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ failedStage: "page-data", message: "Generation failed." }), {
          status: 500
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "generated" }), {
          status: 200
        })
      );

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

    fireEvent.click(screen.getByRole("button", { name: "Create And Generate" }));

    expect(await screen.findByText("Generation failed at stage: page-data")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry Generation" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "/api/projects/blue-peak-dental/retry",
        expect.objectContaining({
          method: "POST"
        })
      );
      expect(pushMock).toHaveBeenCalledWith("/projects/blue-peak-dental");
    });
  });
});
