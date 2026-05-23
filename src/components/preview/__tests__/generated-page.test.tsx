import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GeneratedPageData } from "../../../lib/types/page-data";
import type { StyleDefinition } from "../../../lib/types/style";
import { GeneratedPage } from "../generated-page";

const style: StyleDefinition = {
  version: "alpha",
  name: "Test Style",
  description: "Minimal fixture style",
  colors: {
    primary: "#0066cc",
    ink: "#111111",
    body: "#222222",
    canvas: "#ffffff",
    "divider-soft": "#dddddd"
  },
  typography: {
    body: {
      fontFamily: "Inter, sans-serif",
      fontSize: "16px"
    }
  },
  rounded: {
    md: "12px"
  },
  spacing: {
    section: "64px"
  },
  components: {}
};

function createPageData(withPricing: boolean, withGallery: boolean): GeneratedPageData {
  const sections: GeneratedPageData["sections"] = [
    {
      type: "hero",
      headline: "Modern family dental care"
    },
    {
      type: "services",
      title: "Services",
      items: [{ name: "Teeth cleaning" }]
    },
    {
      type: "about",
      title: "About",
      body: "Care focused, modern dentistry."
    }
  ];

  if (withPricing) {
    sections.push({
      type: "pricing",
      title: "Pricing",
      text: "Call for a custom quote."
    });
  }

  if (withGallery) {
    sections.push({
      type: "gallery",
      title: "Gallery",
      images: [{ alt: "Office", path: "/assets/office.jpg" }]
    });
  }

  sections.push(
    {
      type: "contact",
      title: "Contact",
      phone: "555-123-4567",
      email: "hello@bluepeakdental.com",
      city: "Austin",
      state: "TX"
    },
    {
      type: "footer",
      text: "Blue Peak Dental"
    }
  );

  return {
    site: {
      projectName: "Blue Peak Dental",
      businessName: "Blue Peak Dental",
      category: "Dental Clinic",
      styleId: "apple"
    },
    theme: {
      styleId: "apple"
    },
    sections
  };
}

describe("GeneratedPage", () => {
  it("renders a full page including pricing and gallery sections", () => {
    const { container } = render(
      <GeneratedPage pageData={createPageData(true, true)} style={style} assetBasePath="/assets" />
    );

    expect(screen.getByText("Modern family dental care")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Gallery")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Blue Peak Dental")).toBeInTheDocument();
    expect(container.querySelector("img[alt='Office']")).not.toBeNull();
  });

  it("renders without pricing section when pricing data is omitted", () => {
    render(<GeneratedPage pageData={createPageData(false, true)} style={style} assetBasePath="/assets" />);
    expect(screen.queryByText("Pricing")).not.toBeInTheDocument();
  });

  it("renders without gallery section when gallery data is omitted", () => {
    render(<GeneratedPage pageData={createPageData(true, false)} style={style} assetBasePath="/assets" />);
    expect(screen.queryByText("Gallery")).not.toBeInTheDocument();
  });
});
