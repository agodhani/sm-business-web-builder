import type { StyleDefinition } from "../../types/style";
import type { SiteBrief } from "../types";

type PagePlanPromptInput = {
  brief: SiteBrief;
  style: StyleDefinition;
};

export function buildPagePlanPrompt({ brief, style }: PagePlanPromptInput): string {
  return [
    "You are generating a section plan for a single-page small-business website.",
    "Return JSON only. Do not include markdown.",
    "Use only facts from the brief and style metadata. Do not invent business facts or contact details.",
    "Allowed section types only: hero, services, about, pricing, gallery, contact, footer.",
    "Ordering rules: hero must be first; footer must be last; contact must appear before footer.",
    "Omit pricing when brief.pricing is missing. Omit gallery when brief.imageAssetPaths is empty or missing.",
    "",
    "Required JSON shape:",
    "{",
    '  "selectedStyleId": string,',
    '  "sections": [',
    '    { "type": "hero"|"services"|"about"|"pricing"|"gallery"|"contact"|"footer", "objective": string, "factualRequirements": string[] }',
    "  ]",
    "}",
    "",
    "Brief:",
    JSON.stringify(brief, null, 2),
    "",
    "Style summary:",
    JSON.stringify(
      {
        name: style.name,
        description: style.description,
        colors: style.colors,
        typography: style.typography
      },
      null,
      2
    )
  ].join("\n");
}
