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
  readNamedArtifact,
  writeManifest,
  writeNamedArtifact,
  writeStageArtifact
} from "../../projects/project-storage";
import { loadStyleById } from "../../styles/load-style";
import { buildPagePlanPrompt } from "../prompts/page-plan-prompt";
import type { PagePlan, SiteBrief, StageResult } from "../types";

const sectionTypeSchema = z.enum([
  "hero",
  "services",
  "about",
  "pricing",
  "gallery",
  "contact",
  "footer"
]);

const pagePlanSchema = z.object({
  selectedStyleId: z.string().trim().min(1),
  sections: z
    .array(
      z.object({
        type: sectionTypeSchema,
        objective: z.string().trim().min(1),
        factualRequirements: z.array(z.string().trim())
      })
    )
    .min(2)
});

type CreatePagePlanStageInput = {
  projectSlug: string;
  connector: LLMConnector;
  projectsRoot?: string;
  nowIso?: string;
};

function validateOrdering(plan: PagePlan): string | null {
  const types = plan.sections.map((section) => section.type);
  const first = types[0];
  const last = types[types.length - 1];
  const footerIndex = types.lastIndexOf("footer");
  const contactIndex = types.indexOf("contact");

  if (first !== "hero") {
    return "hero must be first";
  }
  if (last !== "footer") {
    return "footer must be last";
  }
  if (contactIndex !== -1 && footerIndex !== -1 && contactIndex > footerIndex) {
    return "contact must appear before footer";
  }
  return null;
}

function applyOptionalSectionRules(plan: PagePlan, brief: SiteBrief): PagePlan {
  const shouldIncludePricing = Boolean(brief.pricing && brief.pricing.trim().length > 0);
  const shouldIncludeGallery = Boolean(brief.imageAssetPaths && brief.imageAssetPaths.length > 0);

  const sections = plan.sections.filter((section) => {
    if (section.type === "pricing" && !shouldIncludePricing) {
      return false;
    }
    if (section.type === "gallery" && !shouldIncludeGallery) {
      return false;
    }
    return true;
  });

  return {
    ...plan,
    sections
  };
}

async function persistFailure(
  manifest: ProjectManifest,
  context: {
    projectSlug: string;
    projectsRoot?: string;
    nowIso: string;
    failurePayload: unknown;
  }
) {
  const projectPaths = getProjectPaths(context.projectSlug, context.projectsRoot);
  const failedManifest = markManifestFailed(manifest, "page-plan", context.nowIso);
  await writeManifest(projectPaths, failedManifest);
  await writeStageArtifact(projectPaths, "page-plan", context.failurePayload, context.nowIso);
}

export async function createPagePlanStage({
  projectSlug,
  connector,
  projectsRoot,
  nowIso = new Date().toISOString()
}: CreatePagePlanStageInput): Promise<StageResult<PagePlan>> {
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
  const runningManifest = markManifestStageRunning(manifest, "page-plan", nowIso);
  await writeManifest(projectPaths, runningManifest);

  try {
    const brief = await readNamedArtifact<SiteBrief>(projectPaths, "brief.json");
    const loadedStyle = await loadStyleById(brief.selectedStyleId);

    const result = await connector.generateJson<PagePlan>({
      prompt: buildPagePlanPrompt({
        brief,
        style: loadedStyle.style
      })
    });

    if (!result.ok) {
      await persistFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "page-plan",
          reason: "connector_generation_failed",
          error: result.error
        }
      });
      return {
        ok: false,
        error: {
          stage: "page-plan",
          message: result.error.message,
          details: result.error
        }
      };
    }

    const parsedPlan = pagePlanSchema.safeParse(result.value);
    if (!parsedPlan.success) {
      await persistFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "page-plan",
          reason: "page_plan_schema_validation_failed",
          issues: parsedPlan.error.issues
        }
      });
      return {
        ok: false,
        error: {
          stage: "page-plan",
          message: "Generated page plan failed schema validation.",
          details: parsedPlan.error.issues
        }
      };
    }

    const normalizedPlan = applyOptionalSectionRules(parsedPlan.data, brief);
    const orderingError = validateOrdering(normalizedPlan);
    if (orderingError) {
      await persistFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "page-plan",
          reason: "invalid_section_ordering",
          message: orderingError
        }
      });
      return {
        ok: false,
        error: {
          stage: "page-plan",
          message: orderingError
        }
      };
    }

    await writeNamedArtifact(projectPaths, "page-plan.json", normalizedPlan);
    await writeManifest(projectPaths, runningManifest);

    return {
      ok: true,
      data: normalizedPlan
    };
  } catch (error) {
    await persistFailure(runningManifest, {
      projectSlug,
      projectsRoot,
      nowIso,
      failurePayload: {
        stage: "page-plan",
        reason: "unexpected_exception",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
    return {
      ok: false,
      error: {
        stage: "page-plan",
        message: error instanceof Error ? error.message : "Unexpected page-plan stage failure.",
        details: error
      }
    };
  }
}
