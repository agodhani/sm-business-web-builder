import { describe, expect, it } from "vitest";
import { pageDataSchema } from "../page-data-schema";

function validPageData() {
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
    sections: [
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
      },
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
    ]
  };
}

describe("pageDataSchema", () => {
  it("accepts valid page data", () => {
    const result = pageDataSchema.safeParse(validPageData());
    expect(result.success).toBe(true);
  });

  it("accepts page data without pricing and gallery sections", () => {
    const result = pageDataSchema.safeParse(validPageData());
    expect(result.success).toBe(true);
  });

  it("rejects unsupported section type", () => {
    const input = validPageData();
    input.sections[1] = {
      type: "testimonials",
      title: "Testimonials"
    } as unknown as (typeof input.sections)[number];

    const result = pageDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ordering when hero is not first", () => {
    const input = validPageData();
    input.sections = [input.sections[1], input.sections[0], ...input.sections.slice(2)];

    const result = pageDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid ordering when footer is not last", () => {
    const input = validPageData();
    const footer = input.sections.pop();
    if (!footer) {
      throw new Error("Expected footer section");
    }
    input.sections.splice(1, 0, footer);

    const result = pageDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
