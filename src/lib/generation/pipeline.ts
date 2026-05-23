import { readJsonFile } from "../projects/project-storage";
import { type ManifestStage, type ProjectManifest } from "../projects/project-manifest";
import { getProjectPaths } from "../projects/project-paths";
import type { LLMConnector } from "../llm/connector";
import { OllamaConnector } from "../llm/ollama-connector";
import { createBriefStage } from "./stages/create-brief";
import { createPageDataStage } from "./stages/create-page-data";
import { createPagePlanStage } from "./stages/create-page-plan";
import { createStoryRequirementsStage } from "./stages/create-story-requirements";

export type GenerationPipelineResult =
  | {
      ok: true;
      status: "generated";
      projectSlug: string;
      previewPath: string;
    }
  | {
      ok: false;
      projectSlug: string;
      failedStage: ManifestStage;
      message: string;
    };

type RunGenerationPipelineInput = {
  projectSlug: string;
  projectsRoot?: string;
  connector?: LLMConnector;
};

export async function runGenerationPipeline({
  projectSlug,
  projectsRoot,
  connector
}: RunGenerationPipelineInput): Promise<GenerationPipelineResult> {
  const activeConnector = connector ?? new OllamaConnector();

  const briefResult = await createBriefStage({
    projectSlug,
    projectsRoot,
    connector: activeConnector
  });
  if (!briefResult.ok) {
    return {
      ok: false,
      projectSlug,
      failedStage: "brief",
      message: briefResult.error.message
    };
  }

  const pagePlanResult = await createPagePlanStage({
    projectSlug,
    projectsRoot,
    connector: activeConnector
  });
  if (!pagePlanResult.ok) {
    return {
      ok: false,
      projectSlug,
      failedStage: "page-plan",
      message: pagePlanResult.error.message
    };
  }

  const storyResult = await createStoryRequirementsStage({
    projectSlug,
    projectsRoot,
    connector: activeConnector
  });
  if (!storyResult.ok) {
    return {
      ok: false,
      projectSlug,
      failedStage: "story-requirements",
      message: storyResult.error.message
    };
  }

  const pageDataResult = await createPageDataStage({
    projectSlug,
    projectsRoot,
    connector: activeConnector
  });
  if (!pageDataResult.ok) {
    return {
      ok: false,
      projectSlug,
      failedStage: "page-data",
      message: pageDataResult.error.message
    };
  }

  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
  return {
    ok: true,
    status: "generated",
    projectSlug,
    previewPath: manifest.previewPath
  };
}
