import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LLMConnector } from "../../../llm/connector";
import {
  createProjectManifest,
  type ProjectManifest
} from "../../../projects/project-manifest";
import { getProjectPaths } from "../../../projects/project-paths";
import {
  createProjectWorkspace,
  readJsonFile,
  writeManifest,
  writeNamedArtifact
} from "../../../projects/project-storage";
import { createPagePlanStage } from "../create-page-plan";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "create-page-plan-stage-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function setupProjectWithBrief(root: string, slug: string, briefOverrides: Record<string, unknown> = {}) {
  const projectPaths = getProjectPaths(slug, root);
  await createProjectWorkspace(projectPaths);
  const manifest = createProjectManifest({
    projectName: "Blue Peak Dental",
    projectSlug: slug,
    businessName: "Blue Peak Dental",
    selectedStyleId: "apple"
  });
  await writeManifest(projectPaths, manifest);

  await writeNamedArtifact(projectPaths, "brief.json", {
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
    selectedStyleId: "apple",
    ...briefOverrides
  });

  return projectPaths;
}

describe("createPagePlanStage", () => {
  it("omits pricing and gallery sections when brief has no pricing or images", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProjectWithBrief(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        return {
          ok: true,
          rawText: "{}",
          value: {
            selectedStyleId: "apple",
            sections: [
              { type: "hero", objective: "Hero", factualRequirements: [] },
              { type: "services", objective: "Services", factualRequirements: [] },
              { type: "about", objective: "About", factualRequirements: [] },
              { type: "pricing", objective: "Pricing", factualRequirements: [] },
              { type: "gallery", objective: "Gallery", factualRequirements: [] },
              { type: "contact", objective: "Contact", factualRequirements: [] },
              { type: "footer", objective: "Footer", factualRequirements: [] }
            ]
          }
        };
      }
    };

    const result = await createPagePlanStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(true);

    const pagePlan = JSON.parse(await readFile(path.join(projectPaths.artifactsDir, "page-plan.json"), "utf8"));
    const sectionTypes = pagePlan.sections.map((section: { type: string }) => section.type);
    expect(sectionTypes).toEqual(["hero", "services", "about", "contact", "footer"]);
  });

  it("fails stage when section ordering is invalid", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProjectWithBrief(root, slug, {
      pricing: "Call for pricing",
      imageAssetPaths: ["/tmp/hero.jpg"]
    });

    const connector: LLMConnector = {
      async generateJson() {
        return {
          ok: true,
          rawText: "{}",
          value: {
            selectedStyleId: "apple",
            sections: [
              { type: "services", objective: "Services", factualRequirements: [] },
              { type: "hero", objective: "Hero", factualRequirements: [] },
              { type: "contact", objective: "Contact", factualRequirements: [] },
              { type: "footer", objective: "Footer", factualRequirements: [] }
            ]
          }
        };
      }
    };

    const result = await createPagePlanStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(false);

    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    expect(manifest.failedStage).toBe("page-plan");
  });
});
