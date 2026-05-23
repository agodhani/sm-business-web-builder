import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createProjectManifest } from "../../../lib/projects/project-manifest";
import { getProjectPaths } from "../../../lib/projects/project-paths";
import {
  createProjectWorkspace,
  writeManifest,
  writePageData
} from "../../../lib/projects/project-storage";
import ProjectPreviewPage from "./page";

const tempRoots: string[] = [];

afterEach(async () => {
  delete process.env.GENERATED_PROJECTS_ROOT;
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "project-preview-page-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

describe("ProjectPreviewPage", () => {
  it("shows clear status when page data is missing", async () => {
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

    render(await ProjectPreviewPage({ params: Promise.resolve({ projectSlug: slug }) }));
    expect(screen.getByText("Preview Not Available")).toBeInTheDocument();
  });

  it("renders generated page from disk when page-data exists", async () => {
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
      site: {
        projectName: "Blue Peak Dental",
        businessName: "Blue Peak Dental",
        category: "Dental Clinic",
        styleId: "apple"
      },
      theme: { styleId: "apple" },
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
    });

    render(await ProjectPreviewPage({ params: Promise.resolve({ projectSlug: slug }) }));
    expect(screen.getByText("Modern family dental care")).toBeInTheDocument();
  });
});
