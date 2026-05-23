import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the wizard title", async () => {
    render(await Home());
    expect(screen.getByText("New Website Project")).toBeInTheDocument();
  });
});
