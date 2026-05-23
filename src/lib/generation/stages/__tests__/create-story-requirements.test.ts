import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LLMConnector } from "../../../llm/connector";
import { createProjectManifest } from "../../../projects/project-manifest";
import { getProjectPaths } from "../../../projects/project-paths";
import {
  createProjectWorkspace,
  writeManifest,
  writeNamedArtifact
} from "../../../projects/project-storage";
import { createStoryRequirementsStage } from "../create-story-requirements";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "create-story-stage-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function setupProjectWithPagePlan(root: string, slug: string) {
  const projectPaths = getProjectPaths(slug, root);
  await createProjectWorkspace(projectPaths);
  await writeManifest(
    projectPaths,
    createProjectManifest({
      projectName: "Blue Peak Dental",
      projectSlug: slug,
      businessName: "Blue Peak Dental",
      selectedStyleId: "apple"
    })
  );
  await writeNamedArtifact(projectPaths, "page-plan.json", {
    selectedStyleId: "apple",
    sections: [
      { type: "hero", objective: "Hero", factualRequirements: ["Business name"] },
      { type: "services", objective: "Services", factualRequirements: ["Services list"] },
      { type: "about", objective: "About", factualRequirements: ["Description"] },
      { type: "contact", objective: "Contact", factualRequirements: ["Phone and email"] },
      { type: "footer", objective: "Footer", factualRequirements: ["Business name"] }
    ]
  });
  return projectPaths;
}

describe("createStoryRequirementsStage", () => {
  it("persists story requirements and includes every planned section", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProjectWithPagePlan(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        return {
          ok: true,
          rawText: "{}",
          value: {
            sections: [
              {
                sectionType: "hero",
                copyIntent: "Introduce the business clearly.",
                factualConstraints: ["Use business name exactly."],
                bannedClaims: []
              },
              {
                sectionType: "services",
                copyIntent: "Present services in a scannable list.",
                factualConstraints: ["Use only provided services."],
                bannedClaims: []
              },
              {
                sectionType: "about",
                copyIntent: "Explain tone and trust markers.",
                factualConstraints: ["Use provided business description."],
                bannedClaims: []
              },
              {
                sectionType: "contact",
                copyIntent: "Prompt direct contact.",
                factualConstraints: ["Use exact phone and email."],
                bannedClaims: []
              },
              {
                sectionType: "footer",
                copyIntent: "Close with concise business identity.",
                factualConstraints: ["Use business name."],
                bannedClaims: []
              }
            ]
          }
        };
      }
    };

    const result = await createStoryRequirementsStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(true);

    const storyRequirements = JSON.parse(
      await readFile(path.join(projectPaths.artifactsDir, "story-requirements.json"), "utf8")
    );
    const sectionTypes = storyRequirements.sections.map((section: { sectionType: string }) => section.sectionType);
    expect(sectionTypes).toEqual(["hero", "services", "about", "contact", "footer"]);
  });
});
