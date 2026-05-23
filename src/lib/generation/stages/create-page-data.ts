import type { LLMConnector } from "../../llm/connector";
import {
  markManifestFailed,
  markManifestGenerated,
  markManifestStageRunning,
  type ProjectManifest
} from "../../projects/project-manifest";
import { getProjectPaths } from "../../projects/project-paths";
import {
  readJsonFile,
  readNamedArtifact,
  writeManifest,
  writePageData,
  writePreviewMetadata,
  writeStageArtifact
} from "../../projects/project-storage";
import { loadStyleById } from "../../styles/load-style";
import type { GeneratedPageData } from "../../types/page-data";
import { pageDataSchema } from "../../validation/page-data-schema";
import { buildPageDataPrompt } from "../prompts/page-data-prompt";
import type { PagePlan, SiteBrief, StageResult, StoryRequirements } from "../types";
import type { ZodIssue } from "zod";

type CreatePageDataStageInput = {
  projectSlug: string;
  connector: LLMConnector;
  projectsRoot?: string;
  nowIso?: string;
};

function buildFallbackPageData(brief: SiteBrief, pagePlan: PagePlan): GeneratedPageData {
  const sections: GeneratedPageData["sections"] = [];

  for (const section of pagePlan.sections) {
    if (section.type === "hero") {
      sections.push({
        type: "hero",
        headline: `${brief.businessName} for trusted local service`,
        subheadline: brief.businessDescription
      });
      continue;
    }

    if (section.type === "services") {
      sections.push({
        type: "services",
        title: "Services",
        items: brief.services.map((service) => ({ name: service }))
      });
      continue;
    }

    if (section.type === "about") {
      sections.push({
        type: "about",
        title: "About",
        body: brief.businessDescription
      });
      continue;
    }

    if (section.type === "pricing") {
      sections.push({
        type: "pricing",
        title: "Pricing",
        text: brief.pricing ?? "Contact us for pricing."
      });
      continue;
    }

    if (section.type === "gallery") {
      sections.push({
        type: "gallery",
        title: "Gallery",
        images:
          brief.imageAssetPaths?.map((assetPath, index) => ({
            alt: `${brief.businessName} photo ${index + 1}`,
            path: assetPath
          })) ?? []
      });
      continue;
    }

    if (section.type === "contact") {
      sections.push({
        type: "contact",
        title: "Contact",
        phone: brief.contact.phone,
        email: brief.contact.email,
        city: brief.location.city,
        state: brief.location.state,
        fullAddress: brief.location.fullAddress
      });
      continue;
    }

    if (section.type === "footer") {
      sections.push({
        type: "footer",
        text: brief.businessName
      });
    }
  }

  return {
    site: {
      projectName: brief.projectName,
      businessName: brief.businessName,
      category: brief.businessCategory,
      styleId: brief.selectedStyleId
    },
    theme: {
      styleId: brief.selectedStyleId
    },
    sections
  };
}

function hasHardValidationFailure(issues: ZodIssue[]): boolean {
  return issues.some((issue) => {
    const message = issue.message.toLowerCase();
    const isOrderingError =
      message.includes("hero must be the first section") ||
      message.includes("footer must be the last section") ||
      message.includes("contact must appear before footer");
    const isSectionTypeError =
      issue.code === "invalid_union_discriminator" ||
      (issue.path.length >= 3 &&
        issue.path[0] === "sections" &&
        issue.path[2] === "type");
    return isOrderingError || isSectionTypeError;
  });
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
  const failedManifest = markManifestFailed(manifest, "page-data", context.nowIso);
  await writeManifest(projectPaths, failedManifest);
  await writeStageArtifact(projectPaths, "page-data", context.failurePayload, context.nowIso);
}

export async function createPageDataStage({
  projectSlug,
  connector,
  projectsRoot,
  nowIso = new Date().toISOString()
}: CreatePageDataStageInput): Promise<StageResult<GeneratedPageData>> {
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
  const runningManifest = markManifestStageRunning(manifest, "page-data", nowIso);
  await writeManifest(projectPaths, runningManifest);

  try {
    const brief = await readNamedArtifact<SiteBrief>(projectPaths, "brief.json");
    const pagePlan = await readNamedArtifact<PagePlan>(projectPaths, "page-plan.json");
    const storyRequirements = await readNamedArtifact<StoryRequirements>(
      projectPaths,
      "story-requirements.json"
    );
    const loadedStyle = await loadStyleById(brief.selectedStyleId);

    const result = await connector.generateJson<GeneratedPageData>({
      prompt: buildPageDataPrompt({
        brief,
        pagePlan,
        storyRequirements,
        style: loadedStyle.style
      })
    });

    if (!result.ok) {
      await persistFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "page-data",
          reason: "connector_generation_failed",
          error: result.error
        }
      });
      return {
        ok: false,
        error: {
          stage: "page-data",
          message: result.error.message,
          details: result.error
        }
      };
    }

    const parsedPageData = pageDataSchema.safeParse(result.value);
    if (!parsedPageData.success) {
      if (hasHardValidationFailure(parsedPageData.error.issues)) {
        await persistFailure(runningManifest, {
          projectSlug,
          projectsRoot,
          nowIso,
          failurePayload: {
            stage: "page-data",
            reason: "page_data_validation_failed",
            issues: parsedPageData.error.issues
          }
        });
        return {
          ok: false,
          error: {
            stage: "page-data",
            message: "Generated page-data failed schema validation.",
            details: parsedPageData.error.issues
          }
        };
      }

      const fallback = buildFallbackPageData(brief, pagePlan);
      const fallbackValidation = pageDataSchema.safeParse(fallback);
      if (!fallbackValidation.success) {
        await persistFailure(runningManifest, {
          projectSlug,
          projectsRoot,
          nowIso,
          failurePayload: {
            stage: "page-data",
            reason: "fallback_page_data_validation_failed",
            issues: fallbackValidation.error.issues
          }
        });
        return {
          ok: false,
          error: {
            stage: "page-data",
            message: "Fallback page-data generation failed validation.",
            details: fallbackValidation.error.issues
          }
        };
      }

      await writePageData(projectPaths, fallbackValidation.data);
      await writePreviewMetadata(projectPaths, {
        projectSlug,
        status: "ready",
        pageDataPath: projectPaths.pageDataPath,
        generatedAt: nowIso
      });
      const generatedManifest = markManifestGenerated(runningManifest, nowIso);
      await writeManifest(projectPaths, generatedManifest);
      return {
        ok: true,
        data: fallbackValidation.data
      };
    }

    await writePageData(projectPaths, parsedPageData.data);
    await writePreviewMetadata(projectPaths, {
      projectSlug,
      status: "ready",
      pageDataPath: projectPaths.pageDataPath,
      generatedAt: nowIso
    });
    const generatedManifest = markManifestGenerated(runningManifest, nowIso);
    await writeManifest(projectPaths, generatedManifest);

    return {
      ok: true,
      data: parsedPageData.data
    };
  } catch (error) {
    await persistFailure(runningManifest, {
      projectSlug,
      projectsRoot,
      nowIso,
      failurePayload: {
        stage: "page-data",
        reason: "unexpected_exception",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
    return {
      ok: false,
      error: {
        stage: "page-data",
        message: error instanceof Error ? error.message : "Unexpected page-data stage failure.",
        details: error
      }
    };
  }
}
