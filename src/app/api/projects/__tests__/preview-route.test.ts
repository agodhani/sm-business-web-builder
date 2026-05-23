import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createProjectManifest } from "../../../../lib/projects/project-manifest";
import { getProjectPaths } from "../../../../lib/projects/project-paths";
import {
  createProjectWorkspace,
  writeManifest,
  writePageData
} from "../../../../lib/projects/project-storage";
import { GET } from "../[projectSlug]/preview/route";

const tempRoots: string[] = [];

afterEach(async () => {
  delete process.env.GENERATED_PROJECTS_ROOT;
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "preview-route-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

describe("GET /api/projects/[projectSlug]/preview", () => {
  it("returns ready state payload when page data exists", async () => {
    const root = await createTempRoot();
    process.env.GENERATED_PROJECTS_ROOT = root;
    const slug = "blue-peak-dental";
    const paths = getProjectPaths(slug, root);
    await createProjectWorkspace(paths);
    await writeManifest(
      paths,
      createProjectManifest({
        projectName: "Blue Peak Dental",
        projectSlug: slug,
        businessName: "Blue Peak Dental",
        selectedStyleId: "apple"
      })
    );
    await writePageData(paths, {
      site: { projectName: "Blue Peak Dental", businessName: "Blue Peak Dental", category: "Dental", styleId: "apple" },
      theme: { styleId: "apple" },
      sections: [
        { type: "hero", headline: "Hero" },
        { type: "footer", text: "Footer" }
      ]
    });

    const response = await GET(new Request(`http://localhost/api/projects/${slug}/preview`), {
      params: Promise.resolve({ projectSlug: slug })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.projectSlug).toBe(slug);
  });

  it("serves project asset files through the preview asset endpoint", async () => {
    const root = await createTempRoot();
    process.env.GENERATED_PROJECTS_ROOT = root;
    const slug = "blue-peak-dental";
    const paths = getProjectPaths(slug, root);
    await createProjectWorkspace(paths);
    await writeManifest(
      paths,
      createProjectManifest({
        projectName: "Blue Peak Dental",
        projectSlug: slug,
        businessName: "Blue Peak Dental",
        selectedStyleId: "apple"
      })
    );
    await writeFile(path.join(paths.assetsDir, "office.jpg"), "image-bytes", "utf8");

    const response = await GET(
      new Request(`http://localhost/api/projects/${slug}/preview?asset=office.jpg`),
      {
        params: Promise.resolve({ projectSlug: slug })
      }
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(body).toBe("image-bytes");
  });
});
