import { describe, expect, it } from "vitest";
import { wizardSchema } from "../wizard-schema";

function validMinimumInput() {
  return {
    businessName: "Blue Peak Dental",
    businessCategory: "Dental Clinic",
    businessDescription: "Family dentistry and preventive care.",
    services: ["Teeth cleaning"],
    contact: {
      phone: "555-123-4567",
      email: "hello@bluepeakdental.com"
    },
    location: {
      city: "Austin",
      state: "TX"
    },
    styleId: "apple"
  };
}

describe("wizardSchema", () => {
  it("accepts valid minimum input", () => {
    const result = wizardSchema.safeParse(validMinimumInput());
    expect(result.success).toBe(true);
  });

  it("rejects missing business name", () => {
    const input = { ...validMinimumInput(), businessName: "" };
    const result = wizardSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing services", () => {
    const input = { ...validMinimumInput(), services: [] };
    const result = wizardSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing city", () => {
    const input = { ...validMinimumInput(), location: { city: "", state: "TX" } };
    const result = wizardSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing state", () => {
    const input = { ...validMinimumInput(), location: { city: "Austin", state: "" } };
    const result = wizardSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing style id", () => {
    const input = { ...validMinimumInput(), styleId: "" };
    const result = wizardSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
