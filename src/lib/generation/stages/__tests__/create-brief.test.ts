import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
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
  writeRawInput
} from "../../../projects/project-storage";
import { createBriefStage } from "../create-brief";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "create-brief-stage-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function buildRawInput() {
  return {
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
  };
}

async function setupProject(root: string, slug: string) {
  const projectPaths = getProjectPaths(slug, root);
  await createProjectWorkspace(projectPaths);
  await writeRawInput(projectPaths, buildRawInput());
  const manifest = createProjectManifest({
    projectName: "Blue Peak Dental",
    projectSlug: slug,
    businessName: "Blue Peak Dental",
    selectedStyleId: "apple"
  });
  await writeManifest(projectPaths, manifest);
  return projectPaths;
}

describe("createBriefStage", () => {
  it("creates brief.json and keeps manifest in generating state", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProject(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
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
    };

    const result = await createBriefStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(true);

    const briefPath = path.join(projectPaths.artifactsDir, "brief.json");
    const brief = JSON.parse(await readFile(briefPath, "utf8"));
    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);

    expect(brief.businessName).toBe("Blue Peak Dental");
    expect(manifest.status).toBe("generating");
    expect(manifest.currentStage).toBe("brief");
    expect(manifest.failedStage).toBeNull();
  });

  it('marks manifest failedStage as "brief" and persists error metadata on connector failure', async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProject(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        return {
          ok: false,
          error: {
            type: "network",
            message: "Connection refused"
          }
        };
      }
    };

    const result = await createBriefStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(false);

    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    const artifactFiles = await readdir(projectPaths.artifactsDir);

    expect(manifest.status).toBe("failed");
    expect(manifest.failedStage).toBe("brief");
    expect(artifactFiles.some((fileName) => fileName.startsWith("brief-"))).toBe(true);
  });

  it("falls back to normalized raw input when generated brief shape is invalid", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProject(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        return {
          ok: true,
          rawText: "{}",
          value: {
            businessName: "Blue Peak Dental"
          }
        };
      }
    };

    const result = await createBriefStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(true);

    const brief = JSON.parse(await readFile(path.join(projectPaths.artifactsDir, "brief.json"), "utf8"));
    expect(brief.businessName).toBe("Blue Peak Dental");
    expect(brief.services).toEqual(["Teeth cleaning"]);
  });
});
