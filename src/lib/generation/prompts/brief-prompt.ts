import type { WizardInput } from "../../validation/wizard-schema";

type BriefPromptInput = {
  wizardInput: WizardInput;
};

export function buildBriefPrompt({ wizardInput }: BriefPromptInput): string {
  return [
    "You are generating a normalized site brief for a small-business website builder.",
    "Return JSON only. Do not include markdown, commentary, or code fences.",
    "Use only factual details from the input. Do not invent contact data, services, location details, pricing, or credentials.",
    "If a field is missing, keep it omitted or null. Do not infer unknown facts.",
    "",
    "Required JSON shape:",
    "{",
    '  "projectName": string,',
    '  "businessName": string,',
    '  "businessCategory": string,',
    '  "businessDescription": string,',
    '  "services": string[],',
    '  "contact": { "phone": string, "email": string, "website"?: string, "socialLinks"?: string[] },',
    '  "location": { "city": string, "state": string, "fullAddress"?: string },',
    '  "selectedStyleId": string,',
    '  "pricing"?: string,',
    '  "preferences"?: string,',
    '  "imageAssetPaths"?: string[]',
    "}",
    "",
    "Input:",
    JSON.stringify(wizardInput, null, 2)
  ].join("\n");
}
