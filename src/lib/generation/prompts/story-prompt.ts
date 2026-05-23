import type { PagePlan } from "../types";

type StoryPromptInput = {
  pagePlan: PagePlan;
};

export function buildStoryPrompt({ pagePlan }: StoryPromptInput): string {
  return [
    "You are generating story requirements for each planned website section.",
    "Return JSON only.",
    "Every planned section must have exactly one matching story requirement.",
    "Use factual grounding only; do not invent contact details, service claims, pricing specifics, or certifications.",
    "",
    "Required JSON shape:",
    "{",
    '  "sections": [',
    '    {',
    '      "sectionType": "hero"|"services"|"about"|"pricing"|"gallery"|"contact"|"footer",',
    '      "copyIntent": string,',
    '      "factualConstraints": string[],',
    '      "bannedClaims": string[]',
    "    }",
    "  ]",
    "}",
    "",
    "Page plan:",
    JSON.stringify(pagePlan, null, 2)
  ].join("\n");
}
