import type { SectionType } from "../types/page-data";

export type SiteBrief = {
  projectName: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  services: string[];
  contact: {
    phone: string;
    email: string;
    website?: string;
    socialLinks?: string[];
  };
  location: {
    city: string;
    state: string;
    fullAddress?: string;
  };
  selectedStyleId: string;
  pricing?: string;
  preferences?: string;
  imageAssetPaths?: string[];
};

export type PagePlanSection = {
  type: SectionType;
  objective: string;
  factualRequirements: string[];
};

export type PagePlan = {
  selectedStyleId: string;
  sections: PagePlanSection[];
};

export type StoryRequirement = {
  sectionType: SectionType;
  copyIntent: string;
  factualConstraints: string[];
  bannedClaims: string[];
};

export type StoryRequirements = {
  sections: StoryRequirement[];
};

export type StageFailure = {
  stage: "brief" | "page-plan" | "story-requirements" | "page-data";
  message: string;
  details?: unknown;
};

export type StageResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: StageFailure;
    };
