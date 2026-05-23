import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LLMConnector, LLMResult } from "../../llm/connector";
import { createProjectManifest, type ProjectManifest } from "../../projects/project-manifest";
import { getProjectPaths } from "../../projects/project-paths";
import {
  createProjectWorkspace,
  readJsonFile,
  writeManifest,
  writeRawInput
} from "../../projects/project-storage";
import { runGenerationPipeline } from "../pipeline";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "generation-pipeline-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function setupProject(root: string, slug: string) {
  const projectPaths = getProjectPaths(slug, root);
  await createProjectWorkspace(projectPaths);
  await writeRawInput(projectPaths, {
    projectName: "Blue Peak Dental",
    businessName: "Blue Peak Dental",
    businessCategory: "Dental Clinic",
    businessDescription: "Family dentistry and preventive care.",
    services: ["Teeth cleaning"],
    contact: {
      phone: "555-123-4567",
      email: "hello@bluepeakdental.com"
    },
    location: {
      city: "Austin",
      state: "TX"
    },
    styleId: "apple"
  });
  await writeManifest(
    projectPaths,
    createProjectManifest({
      projectName: "Blue Peak Dental",
      projectSlug: slug,
      businessName: "Blue Peak Dental",
      selectedStyleId: "apple"
    })
  );

  return projectPaths;
}

class QueueConnector implements LLMConnector {
  constructor(private readonly responses: Array<LLMResult<unknown>>) {}

  async generateJson<T>(): Promise<LLMResult<T>> {
    const next = this.responses.shift();
    if (!next) {
      return {
        ok: false,
        error: {
          type: "provider",
          message: "No mock response available."
        }
      };
    }
    return next as LLMResult<T>;
  }
}

function briefSuccess(): LLMResult<unknown> {
  return {
    ok: true,
    rawText: "{}",
    value: {
      projectName: "Blue Peak Dental",
      businessName: "Blue Peak Dental",
      businessCategory: "Dental Clinic",
      businessDescription: "Family dentistry and preventive care.",
      services: ["Teeth cleaning"],
      contact: {
        phone: "555-123-4567",
        email: "hello@bluepeakdental.com"
      },
      location: {
        city: "Austin",
        state: "TX"
      },
      selectedStyleId: "apple"
    }
  };
}

function pagePlanSuccess(): LLMResult<unknown> {
  return {
    ok: true,
    rawText: "{}",
    value: {
      selectedStyleId: "apple",
      sections: [
        { type: "hero", objective: "Hero", factualRequirements: [] },
        { type: "services", objective: "Services", factualRequirements: [] },
        { type: "about", objective: "About", factualRequirements: [] },
        { type: "contact", objective: "Contact", factualRequirements: [] },
        { type: "footer", objective: "Footer", factualRequirements: [] }
      ]
    }
  };
}

function storySuccess(): LLMResult<unknown> {
  return {
    ok: true,
    rawText: "{}",
    value: {
      sections: [
        { sectionType: "hero", copyIntent: "Hero", factualConstraints: ["Name"], bannedClaims: [] },
        {
          sectionType: "services",
          copyIntent: "Services",
          factualConstraints: ["Services"],
          bannedClaims: []
        },
        { sectionType: "about", copyIntent: "About", factualConstraints: ["About"], bannedClaims: [] },
        {
          sectionType: "contact",
          copyIntent: "Contact",
          factualConstraints: ["Contact"],
          bannedClaims: []
        },
        { sectionType: "footer", copyIntent: "Footer", factualConstraints: ["Name"], bannedClaims: [] }
      ]
    }
  };
}

function pageDataSuccess(): LLMResult<unknown> {
  return {
    ok: true,
    rawText: "{}",
    value: {
      site: {
        projectName: "Blue Peak Dental",
        businessName: "Blue Peak Dental",
        category: "Dental Clinic",
        styleId: "apple"
      },
      theme: {
        styleId: "apple"
      },
      sections: [
        { type: "hero", headline: "Modern family dental care" },
        { type: "services", title: "Services", items: [{ name: "Teeth cleaning" }] },
        { type: "about", title: "About", body: "Care focused, modern dentistry." },
        {
          type: "contact",
          title: "Contact",
          phone: "555-123-4567",
          email: "hello@bluepeakdental.com",
          city: "Austin",
          state: "TX"
        },
        { type: "footer", text: "Blue Peak Dental" }
      ]
    }
  };
}

function stageFailure(message: string): LLMResult<unknown> {
  return {
    ok: false,
    error: {
      type: "provider",
      message
    }
  };
}

describe("runGenerationPipeline", () => {
  it("runs all stages and returns generated status + preview path", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProject(root, slug);
    const connector = new QueueConnector([
      briefSuccess(),
      pagePlanSuccess(),
      storySuccess(),
      pageDataSuccess()
    ]);

    const result = await runGenerationPipeline({ projectSlug: slug, projectsRoot: root, connector });
    expect(result).toEqual({
      ok: true,
      status: "generated",
      projectSlug: slug,
      previewPath: `/projects/${slug}`
    });

    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    expect(manifest.status).toBe("generated");
    const pageData = JSON.parse(await readFile(projectPaths.pageDataPath, "utf8"));
    expect(pageData.site.businessName).toBe("Blue Peak Dental");
  });

  it("returns failed stage when brief stage fails", async () => {
    const root = await createTempRoot();
    const slug = "brief-fail";
    await setupProject(root, slug);
    const connector = new QueueConnector([stageFailure("brief failed")]);

    const result = await runGenerationPipeline({ projectSlug: slug, projectsRoot: root, connector });
    expect(result).toEqual({
      ok: false,
      projectSlug: slug,
      failedStage: "brief",
      message: "brief failed"
    });
  });

  it("returns failed stage when page-plan stage fails", async () => {
    const root = await createTempRoot();
    const slug = "page-plan-fail";
    await setupProject(root, slug);
    const connector = new QueueConnector([briefSuccess(), stageFailure("plan failed")]);

    const result = await runGenerationPipeline({ projectSlug: slug, projectsRoot: root, connector });
    expect(result).toEqual({
      ok: false,
      projectSlug: slug,
      failedStage: "page-plan",
      message: "plan failed"
    });
  });

  it("returns failed stage when story-requirements stage fails", async () => {
    const root = await createTempRoot();
    const slug = "story-fail";
    await setupProject(root, slug);
    const connector = new QueueConnector([briefSuccess(), pagePlanSuccess(), stageFailure("story failed")]);

    const result = await runGenerationPipeline({ projectSlug: slug, projectsRoot: root, connector });
    expect(result).toEqual({
      ok: false,
      projectSlug: slug,
      failedStage: "story-requirements",
      message: "story failed"
    });
  });

  it("returns failed stage when page-data stage fails", async () => {
    const root = await createTempRoot();
    const slug = "page-data-fail";
    const projectPaths = await setupProject(root, slug);
    const connector = new QueueConnector([
      briefSuccess(),
      pagePlanSuccess(),
      storySuccess(),
      stageFailure("page data failed")
    ]);

    const result = await runGenerationPipeline({ projectSlug: slug, projectsRoot: root, connector });
    expect(result).toEqual({
      ok: false,
      projectSlug: slug,
      failedStage: "page-data",
      message: "page data failed"
    });

    const brief = JSON.parse(await readFile(path.join(projectPaths.artifactsDir, "brief.json"), "utf8"));
    const pagePlan = JSON.parse(await readFile(path.join(projectPaths.artifactsDir, "page-plan.json"), "utf8"));
    const story = JSON.parse(
      await readFile(path.join(projectPaths.artifactsDir, "story-requirements.json"), "utf8")
    );
    expect(brief.businessName).toBe("Blue Peak Dental");
    expect(pagePlan.sections).toHaveLength(5);
    expect(story.sections).toHaveLength(5);
  });

  it("supports full rerun after failure and updates manifest to generated", async () => {
    const root = await createTempRoot();
    const slug = "retry-project";
    const projectPaths = await setupProject(root, slug);

    const failedConnector = new QueueConnector([
      briefSuccess(),
      pagePlanSuccess(),
      storySuccess(),
      stageFailure("page data failed")
    ]);
    const failedResult = await runGenerationPipeline({
      projectSlug: slug,
      projectsRoot: root,
      connector: failedConnector
    });
    expect(failedResult.ok).toBe(false);

    const retryConnector = new QueueConnector([
      briefSuccess(),
      pagePlanSuccess(),
      storySuccess(),
      pageDataSuccess()
    ]);
    const retryResult = await runGenerationPipeline({
      projectSlug: slug,
      projectsRoot: root,
      connector: retryConnector
    });
    expect(retryResult).toEqual({
      ok: true,
      status: "generated",
      projectSlug: slug,
      previewPath: `/projects/${slug}`
    });

    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    expect(manifest.status).toBe("generated");
  });
});
