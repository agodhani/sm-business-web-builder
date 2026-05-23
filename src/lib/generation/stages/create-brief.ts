import { z } from "zod";
import type { LLMConnector } from "../../llm/connector";
import {
  markManifestFailed,
  markManifestStageRunning,
  type ProjectManifest
} from "../../projects/project-manifest";
import { getProjectPaths } from "../../projects/project-paths";
import {
  readJsonFile,
  writeManifest,
  writeNamedArtifact,
  writeStageArtifact
} from "../../projects/project-storage";
import { wizardSchema } from "../../validation/wizard-schema";
import { buildBriefPrompt } from "../prompts/brief-prompt";
import type { SiteBrief, StageResult } from "../types";
import type { WizardInput } from "../../validation/wizard-schema";

const siteBriefSchema = z.object({
  projectName: z.string().trim().min(1),
  businessName: z.string().trim().min(1),
  businessCategory: z.string().trim().min(1),
  businessDescription: z.string().trim().min(1),
  services: z.array(z.string().trim().min(1)).min(1),
  contact: z.object({
    phone: z.string().trim().min(1),
    email: z.string().trim().email(),
    website: z.string().trim().url().optional(),
    socialLinks: z.array(z.string().trim().url()).optional()
  }),
  location: z.object({
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    fullAddress: z.string().trim().min(1).optional()
  }),
  selectedStyleId: z.string().trim().min(1),
  pricing: z.string().trim().min(1).optional(),
  preferences: z.string().trim().min(1).optional(),
  imageAssetPaths: z.array(z.string().trim().min(1)).optional()
});

type CreateBriefStageInput = {
  projectSlug: string;
  connector: LLMConnector;
  projectsRoot?: string;
  nowIso?: string;
};

function buildFallbackBrief(input: WizardInput): SiteBrief {
  const socialLinks = input.contact.socialLinks?.filter((item) => item.trim().length > 0);
  const imageAssetPaths = input.images?.map((image) => image.sourcePath).filter((item) => item.trim().length > 0);

  return {
    projectName: input.projectName?.trim() || input.businessName.trim(),
    businessName: input.businessName.trim(),
    businessCategory: input.businessCategory.trim(),
    businessDescription: input.businessDescription.trim(),
    services: input.services.map((service) => service.trim()).filter((service) => service.length > 0),
    contact: {
      phone: input.contact.phone.trim(),
      email: input.contact.email.trim(),
      website: input.contact.website?.trim() || undefined,
      socialLinks: socialLinks && socialLinks.length > 0 ? socialLinks : undefined
    },
    location: {
      city: input.location.city.trim(),
      state: input.location.state.trim(),
      fullAddress: input.location.fullAddress?.trim() || undefined
    },
    selectedStyleId: input.styleId.trim(),
    pricing: input.pricing?.trim() || undefined,
    preferences: input.preferences?.trim() || undefined,
    imageAssetPaths: imageAssetPaths && imageAssetPaths.length > 0 ? imageAssetPaths : undefined
  };
}

async function persistStageFailure(
  manifest: ProjectManifest,
  context: {
    projectSlug: string;
    projectsRoot?: string;
    nowIso: string;
    failurePayload: unknown;
  }
) {
  const projectPaths = getProjectPaths(context.projectSlug, context.projectsRoot);
  const failedManifest = markManifestFailed(manifest, "brief", context.nowIso);
  await writeManifest(projectPaths, failedManifest);
  await writeStageArtifact(projectPaths, "brief", context.failurePayload, context.nowIso);
}

export async function createBriefStage({
  projectSlug,
  connector,
  projectsRoot,
  nowIso = new Date().toISOString()
}: CreateBriefStageInput): Promise<StageResult<SiteBrief>> {
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
  const runningManifest = markManifestStageRunning(manifest, "brief", nowIso);
  await writeManifest(projectPaths, runningManifest);

  try {
    const rawInput = await readJsonFile(projectPaths.rawInputPath);
    const parsedInput = wizardSchema.safeParse(rawInput);

    if (!parsedInput.success) {
      await persistStageFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "brief",
          reason: "raw_input_validation_failed",
          issues: parsedInput.error.issues
        }
      });
      return {
        ok: false,
        error: {
          stage: "brief",
          message: "Raw input validation failed before brief generation.",
          details: parsedInput.error.issues
        }
      };
    }

    const result = await connector.generateJson<SiteBrief>({
      prompt: buildBriefPrompt({
        wizardInput: parsedInput.data
      })
    });

    if (!result.ok) {
      await persistStageFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "brief",
          reason: "connector_generation_failed",
          error: result.error
        }
      });
      return {
        ok: false,
        error: {
          stage: "brief",
          message: result.error.message,
          details: result.error
        }
      };
    }

    const validatedBrief = siteBriefSchema.safeParse(result.value);
    if (!validatedBrief.success) {
      const fallbackBrief = buildFallbackBrief(parsedInput.data);
      await writeNamedArtifact(projectPaths, "brief.json", fallbackBrief);
      await writeManifest(projectPaths, runningManifest);
      return {
        ok: true,
        data: fallbackBrief
      };
    }

    await writeNamedArtifact(projectPaths, "brief.json", validatedBrief.data);
    await writeManifest(projectPaths, runningManifest);

    return {
      ok: true,
      data: validatedBrief.data
    };
  } catch (error) {
    await persistStageFailure(runningManifest, {
      projectSlug,
      projectsRoot,
      nowIso,
      failurePayload: {
        stage: "brief",
        reason: "unexpected_exception",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
    return {
      ok: false,
      error: {
        stage: "brief",
        message: error instanceof Error ? error.message : "Unexpected brief stage failure.",
        details: error
      }
    };
  }
}
