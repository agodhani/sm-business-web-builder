import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createProjectManifest } from "../project-manifest";
import { getProjectPaths } from "../project-paths";
import {
  copyProjectImages,
  createProjectWorkspace,
  readJsonFile,
  writeManifest,
  writePageData,
  writeRawInput,
  writeStageArtifact
} from "../project-storage";
import { listProjects } from "../project-query";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "project-storage-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function buildWizardInput() {
  return {
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
    styleId: "apple",
    images: [] as Array<{ fileName: string; sourcePath: string; mimeType?: string }>
  };
}

describe("project storage and query", () => {
  it("creates project directories and writes core project files", async () => {
    const root = await createTempRoot();
    const paths = getProjectPaths("blue-peak-dental", root);
    await createProjectWorkspace(paths);

    const input = buildWizardInput();
    const manifest = createProjectManifest({
      projectName: "Blue Peak Dental",
      projectSlug: "blue-peak-dental",
      businessName: "Blue Peak Dental",
      selectedStyleId: "apple"
    });

    await writeRawInput(paths, input);
    await writeManifest(paths, manifest);
    await writeStageArtifact(paths, "brief", { summary: "test brief" }, "2026-01-01T00:00:00.000Z");
    await writePageData(paths, { sections: [] });

    const savedInput = await readJsonFile(paths.rawInputPath);
    const savedManifest = await readJsonFile(paths.manifestPath);
    const savedPageData = await readJsonFile(paths.pageDataPath);
    const artifactFiles = await readdir(paths.artifactsDir);

    expect(savedInput.businessName).toBe("Blue Peak Dental");
    expect(savedManifest.projectSlug).toBe("blue-peak-dental");
    expect(savedPageData).toEqual({ sections: [] });
    expect(artifactFiles).toHaveLength(1);
  });

  it("copies uploaded images into project assets", async () => {
    const root = await createTempRoot();
    const paths = getProjectPaths("blue-peak-dental", root);
    await createProjectWorkspace(paths);

    const sourceImage = path.join(root, "hero.png");
    await writeFile(sourceImage, "image-bytes", "utf8");

    const copied = await copyProjectImages(paths, [
      {
        fileName: "hero.png",
        sourcePath: sourceImage,
        mimeType: "image/png"
      }
    ]);

    const copiedPath = path.join(paths.assetsDir, "hero.png");
    const copiedBytes = await readFile(copiedPath, "utf8");

    expect(copied).toEqual([
      {
        fileName: "hero.png",
        sourcePath: copiedPath,
        mimeType: "image/png"
      }
    ]);
    expect(copiedBytes).toBe("image-bytes");
  });

  it("preserves artifacts across multiple writes for the same stage", async () => {
    const root = await createTempRoot();
    const paths = getProjectPaths("blue-peak-dental", root);
    await createProjectWorkspace(paths);

    await writeStageArtifact(paths, "brief", { summary: "first" }, "2026-01-01T00:00:00.000Z");
    await writeStageArtifact(paths, "brief", { summary: "second" }, "2026-01-01T00:01:00.000Z");

    const artifactFiles = (await readdir(paths.artifactsDir)).filter((entry) => entry.startsWith("brief-"));
    expect(artifactFiles).toHaveLength(2);
  });

  it("lists projects sorted by updatedAt descending", async () => {
    const root = await createTempRoot();

    const olderPaths = getProjectPaths("older-project", root);
    await createProjectWorkspace(olderPaths);
    await writeManifest(
      olderPaths,
      createProjectManifest(
        {
          projectName: "Older Project",
          projectSlug: "older-project",
          businessName: "Older Project",
          selectedStyleId: "apple"
        },
        "2026-01-01T00:00:00.000Z"
      )
    );

    const newerPaths = getProjectPaths("newer-project", root);
    await createProjectWorkspace(newerPaths);
    await writeManifest(
      newerPaths,
      createProjectManifest(
        {
          projectName: "Newer Project",
          projectSlug: "newer-project",
          businessName: "Newer Project",
          selectedStyleId: "apple"
        },
        "2026-01-02T00:00:00.000Z"
      )
    );

    const projects = await listProjects(root);
    expect(projects.map((project) => project.projectSlug)).toEqual(["newer-project", "older-project"]);
  });
});
