import path from "node:path";
import { describe, expect, it } from "vitest";
import { GENERATED_PROJECTS_ROOT } from "../../config";
import {
  createProjectManifest,
  markManifestFailed,
  markManifestGenerated,
  markManifestStageRunning,
  resolveProjectName
} from "../project-manifest";
import { createProjectSlug, getProjectPaths } from "../project-paths";

describe("project paths and manifest", () => {
  it("creates a stable slug from a project name", () => {
    expect(createProjectSlug("Blue Peak Dental 2026!!")).toBe("blue-peak-dental-2026");
  });

  it("defaults project name from business name when override is missing", () => {
    expect(resolveProjectName(undefined, "Blue Peak Dental")).toBe("Blue Peak Dental");
    expect(resolveProjectName("  ", "Blue Peak Dental")).toBe("Blue Peak Dental");
    expect(resolveProjectName("Custom Project", "Blue Peak Dental")).toBe("Custom Project");
  });

  it("builds all expected project paths under v1", () => {
    const paths = getProjectPaths("blue-peak-dental");
    const expectedRoot = path.join(GENERATED_PROJECTS_ROOT, "blue-peak-dental");
    const expectedVersionRoot = path.join(expectedRoot, "v1");

    expect(paths.projectRoot).toBe(expectedRoot);
    expect(paths.versionRoot).toBe(expectedVersionRoot);
    expect(paths.rawInputPath).toBe(path.join(expectedVersionRoot, "raw-input.json"));
    expect(paths.manifestPath).toBe(path.join(expectedRoot, "manifest.json"));
    expect(paths.artifactsDir).toBe(path.join(expectedVersionRoot, "artifacts"));
    expect(paths.assetsDir).toBe(path.join(expectedVersionRoot, "assets"));
    expect(paths.pageDataPath).toBe(path.join(expectedVersionRoot, "page-data.json"));
    expect(paths.previewMetadataPath).toBe(path.join(expectedVersionRoot, "preview-metadata.json"));
  });

  it("creates and transitions manifest status values", () => {
    const createdAt = "2026-01-01T00:00:00.000Z";
    const runningAt = "2026-01-01T00:01:00.000Z";
    const failedAt = "2026-01-01T00:02:00.000Z";
    const generatedAt = "2026-01-01T00:03:00.000Z";

    const initial = createProjectManifest(
      {
        projectName: "Blue Peak Dental",
        projectSlug: "blue-peak-dental",
        businessName: "Blue Peak Dental",
        selectedStyleId: "apple"
      },
      createdAt
    );

    expect(initial.status).toBe("created");
    expect(initial.currentStage).toBeNull();
    expect(initial.failedStage).toBeNull();
    expect(initial.previewPath).toBe("/projects/blue-peak-dental");
    expect(initial.createdAt).toBe(createdAt);
    expect(initial.updatedAt).toBe(createdAt);

    const running = markManifestStageRunning(initial, "brief", runningAt);
    expect(running.status).toBe("generating");
    expect(running.currentStage).toBe("brief");
    expect(running.failedStage).toBeNull();
    expect(running.updatedAt).toBe(runningAt);

    const failed = markManifestFailed(running, "page-plan", failedAt);
    expect(failed.status).toBe("failed");
    expect(failed.currentStage).toBe("page-plan");
    expect(failed.failedStage).toBe("page-plan");
    expect(failed.updatedAt).toBe(failedAt);

    const generated = markManifestGenerated(failed, generatedAt);
    expect(generated.status).toBe("generated");
    expect(generated.currentStage).toBeNull();
    expect(generated.failedStage).toBeNull();
    expect(generated.updatedAt).toBe(generatedAt);
  });
});
