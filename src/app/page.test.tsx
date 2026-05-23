import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Home from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

describe("Home", () => {
  it("renders the wizard title", async () => {
    render(await Home());
    expect(screen.getByText("New Website Project")).toBeInTheDocument();
  });
});
