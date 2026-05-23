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
import { buildStoryPrompt } from "../prompts/story-prompt";
import type { PagePlan, StageResult, StoryRequirements } from "../types";

const sectionTypeSchema = z.enum([
  "hero",
  "services",
  "about",
  "pricing",
  "gallery",
  "contact",
  "footer"
]);

const storyRequirementsSchema = z.object({
  sections: z.array(
    z.object({
      sectionType: sectionTypeSchema,
      copyIntent: z.string().trim().min(1),
      factualConstraints: z.array(z.string().trim().min(1)),
      bannedClaims: z.array(z.string().trim()).default([])
    })
  )
});

type CreateStoryRequirementsStageInput = {
  projectSlug: string;
  connector: LLMConnector;
  projectsRoot?: string;
  nowIso?: string;
};

function verifySectionCoverage(pagePlan: PagePlan, requirements: StoryRequirements): string | null {
  const planned = pagePlan.sections.map((section) => section.type);
  const received = requirements.sections.map((section) => section.sectionType);
  if (planned.length !== received.length) {
    return "Story requirements must include one entry per planned section.";
  }
  for (let index = 0; index < planned.length; index += 1) {
    if (planned[index] !== received[index]) {
      return `Section mismatch at index ${index}: expected ${planned[index]}, got ${received[index]}.`;
    }
  }
  return null;
}

function buildFallbackStoryRequirements(pagePlan: PagePlan): StoryRequirements {
  return {
    sections: pagePlan.sections.map((section) => ({
      sectionType: section.type,
      copyIntent: section.objective,
      factualConstraints: section.factualRequirements,
      bannedClaims: []
    }))
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
  const failedManifest = markManifestFailed(manifest, "story-requirements", context.nowIso);
  await writeManifest(projectPaths, failedManifest);
  await writeStageArtifact(projectPaths, "story-requirements", context.failurePayload, context.nowIso);
}

export async function createStoryRequirementsStage({
  projectSlug,
  connector,
  projectsRoot,
  nowIso = new Date().toISOString()
}: CreateStoryRequirementsStageInput): Promise<StageResult<StoryRequirements>> {
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
  const runningManifest = markManifestStageRunning(manifest, "story-requirements", nowIso);
  await writeManifest(projectPaths, runningManifest);

  try {
    const pagePlan = await readNamedArtifact<PagePlan>(projectPaths, "page-plan.json");

    const result = await connector.generateJson<StoryRequirements>({
      prompt: buildStoryPrompt({ pagePlan })
    });

    if (!result.ok) {
      await persistFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "story-requirements",
          reason: "connector_generation_failed",
          error: result.error
        }
      });
      return {
        ok: false,
        error: {
          stage: "story-requirements",
          message: result.error.message,
          details: result.error
        }
      };
    }

    const parsedRequirements = storyRequirementsSchema.safeParse(result.value);
    if (!parsedRequirements.success) {
      await persistFailure(runningManifest, {
        projectSlug,
        projectsRoot,
        nowIso,
        failurePayload: {
          stage: "story-requirements",
          reason: "schema_validation_failed",
          issues: parsedRequirements.error.issues
        }
      });
      return {
        ok: false,
        error: {
          stage: "story-requirements",
          message: "Generated story requirements failed schema validation.",
          details: parsedRequirements.error.issues
        }
      };
    }

    const coverageError = verifySectionCoverage(pagePlan, parsedRequirements.data);
    if (coverageError) {
      const fallback = buildFallbackStoryRequirements(pagePlan);
      await writeNamedArtifact(projectPaths, "story-requirements.json", fallback);
      await writeManifest(projectPaths, runningManifest);
      return {
        ok: true,
        data: fallback
      };
    }

    await writeNamedArtifact(projectPaths, "story-requirements.json", parsedRequirements.data);
    await writeManifest(projectPaths, runningManifest);

    return {
      ok: true,
      data: parsedRequirements.data
    };
  } catch (error) {
    await persistFailure(runningManifest, {
      projectSlug,
      projectsRoot,
      nowIso,
      failurePayload: {
        stage: "story-requirements",
        reason: "unexpected_exception",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
    return {
      ok: false,
      error: {
        stage: "story-requirements",
        message: error instanceof Error ? error.message : "Unexpected story-requirements stage failure.",
        details: error
      }
    };
  }
}
