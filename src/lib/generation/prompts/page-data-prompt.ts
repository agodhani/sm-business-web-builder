import type { StyleDefinition } from "../../types/style";
import type { PagePlan, SiteBrief, StoryRequirements } from "../types";

type PageDataPromptInput = {
  brief: SiteBrief;
  pagePlan: PagePlan;
  storyRequirements: StoryRequirements;
  style: StyleDefinition;
};

export function buildPageDataPrompt({
  brief,
  pagePlan,
  storyRequirements,
  style
}: PageDataPromptInput): string {
  return [
    "You are generating final structured page data for rendering.",
    "Return JSON only, with no markdown.",
    "Do not invent facts. Use only provided business, contact, location, service, pricing, and image facts.",
    "Contact facts must exactly match provided source values.",
    "",
    "Section rules:",
    "- Allowed section types only: hero, services, about, pricing, gallery, contact, footer.",
    "- hero must be first.",
    "- footer must be last.",
    "- contact must be before footer when present.",
    "- pricing and gallery are optional only when absent from plan.",
    "- For gallery sections, use each path from brief.imageAssetPaths verbatim as the image path value. Do not invent or modify image paths.",
    "- Omit the gallery section entirely when brief.imageAssetPaths is empty or absent.",
    "",
    "Required JSON shape:",
    "{",
    '  "site": { "projectName": string, "businessName": string, "category": string, "styleId": string },',
    '  "theme": { "styleId": string },',
    '  "sections": [',
    '    { "type": "hero", "headline": string, "subheadline"?: string, "primaryCta"?: string, "secondaryCta"?: string },',
    '    { "type": "services", "title": string, "items": [{ "name": string, "description"?: string }] },',
    '    { "type": "about", "title": string, "body": string },',
    '    { "type": "pricing", "title": string, "text": string },',
    '    { "type": "gallery", "title": string, "images": [{ "alt": string, "path": string }] },',
    '    { "type": "contact", "title": string, "phone": string, "email": string, "city": string, "state": string, "fullAddress"?: string },',
    '    { "type": "footer", "text": string }',
    "  ]",
    "}",
    "",
    "Brief:",
    JSON.stringify(brief, null, 2),
    "",
    "Page plan:",
    JSON.stringify(pagePlan, null, 2),
    "",
    "Story requirements:",
    JSON.stringify(storyRequirements, null, 2),
    "",
    "Style summary:",
    JSON.stringify(
      {
        styleId: brief.selectedStyleId,
        name: style.name,
        description: style.description,
        colors: style.colors,
        typography: style.typography,
        spacing: style.spacing
      },
      null,
      2
    )
  ].join("\n");
}
