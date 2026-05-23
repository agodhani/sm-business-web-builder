import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getProjectPaths } from "../../../../lib/projects/project-paths";
import { GET, POST } from "../route";

const tempRoots: string[] = [];

afterEach(async () => {
  delete process.env.GENERATED_PROJECTS_ROOT;
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "projects-route-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function createValidPayload(overrides: Record<string, unknown> = {}) {
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
    ...overrides
  };
}

describe("projects route", () => {
  it("creates a project workspace and persists raw input + manifest", async () => {
    const root = await createTempRoot();
    process.env.GENERATED_PROJECTS_ROOT = root;

    const sourceImage = path.join(root, "hero.png");
    await writeFile(sourceImage, "image-bytes", "utf8");

    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        createValidPayload({
          images: [{ fileName: "hero.png", sourcePath: sourceImage, mimeType: "image/png" }]
        })
      )
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.projectSlug).toBe("blue-peak-dental");

    const paths = getProjectPaths(body.projectSlug, root);
    const savedInput = JSON.parse(await readFile(paths.rawInputPath, "utf8"));
    const savedManifest = JSON.parse(await readFile(paths.manifestPath, "utf8"));
    const copiedImagePath = path.join(paths.assetsDir, "hero.png");
    const copiedImageBytes = await readFile(copiedImagePath, "utf8");

    expect(savedInput.projectName).toBe("Blue Peak Dental");
    expect(savedInput.images[0].sourcePath).toBe(copiedImagePath);
    expect(savedManifest.projectSlug).toBe("blue-peak-dental");
    expect(copiedImageBytes).toBe("image-bytes");
  });

  it("returns 400 for invalid payload", async () => {
    const root = await createTempRoot();
    process.env.GENERATED_PROJECTS_ROOT = root;

    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        createValidPayload({
          businessName: ""
        })
      )
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("lists existing projects from manifests", async () => {
    const root = await createTempRoot();
    process.env.GENERATED_PROJECTS_ROOT = root;

    const firstRequest = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidPayload({ businessName: "Alpha Plumbing" }))
    });
    const secondRequest = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidPayload({ businessName: "Bravo Roofing" }))
    });

    await POST(firstRequest);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await POST(secondRequest);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.projects).toHaveLength(2);
    expect(body.projects[0].projectSlug).toBe("bravo-roofing");
    expect(body.projects[1].projectSlug).toBe("alpha-plumbing");
  });
});
