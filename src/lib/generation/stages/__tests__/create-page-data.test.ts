import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LLMConnector } from "../../../llm/connector";
import { createProjectManifest, type ProjectManifest } from "../../../projects/project-manifest";
import { getProjectPaths } from "../../../projects/project-paths";
import {
  createProjectWorkspace,
  readJsonFile,
  writeManifest,
  writeNamedArtifact
} from "../../../projects/project-storage";
import { createPageDataStage } from "../create-page-data";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "create-page-data-stage-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function setupProjectForPageData(root: string, slug: string) {
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
    selectedStyleId: "apple"
  });
  await writeNamedArtifact(projectPaths, "page-plan.json", {
    selectedStyleId: "apple",
    sections: [
      { type: "hero", objective: "Hero", factualRequirements: [] },
      { type: "services", objective: "Services", factualRequirements: [] },
      { type: "about", objective: "About", factualRequirements: [] },
      { type: "contact", objective: "Contact", factualRequirements: [] },
      { type: "footer", objective: "Footer", factualRequirements: [] }
    ]
  });
  await writeNamedArtifact(projectPaths, "story-requirements.json", {
    sections: [
      {
        sectionType: "hero",
        copyIntent: "Introduce the business.",
        factualConstraints: ["Use business name"],
        bannedClaims: []
      },
      {
        sectionType: "services",
        copyIntent: "List services.",
        factualConstraints: ["Use provided services"],
        bannedClaims: []
      },
      {
        sectionType: "about",
        copyIntent: "Explain approach.",
        factualConstraints: ["Use provided description"],
        bannedClaims: []
      },
      {
        sectionType: "contact",
        copyIntent: "Offer direct contact details.",
        factualConstraints: ["Use exact contact facts"],
        bannedClaims: []
      },
      {
        sectionType: "footer",
        copyIntent: "Close with identity.",
        factualConstraints: ["Use business name"],
        bannedClaims: []
      }
    ]
  });
  return projectPaths;
}

function buildValidPageData() {
  return {
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
      {
        type: "hero",
        headline: "Modern family dental care"
      },
      {
        type: "services",
        title: "Services",
        items: [{ name: "Teeth cleaning" }]
      },
      {
        type: "about",
        title: "About",
        body: "Care focused, modern dentistry."
      },
      {
        type: "contact",
        title: "Contact",
        phone: "555-123-4567",
        email: "hello@bluepeakdental.com",
        city: "Austin",
        state: "TX"
      },
      {
        type: "footer",
        text: "Blue Peak Dental"
      }
    ]
  };
}

describe("createPageDataStage", () => {
  it("persists valid page-data.json and marks manifest generated", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProjectForPageData(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        return { ok: true, rawText: "{}", value: buildValidPageData() };
      }
    };

    const result = await createPageDataStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(true);

    const savedPageData = JSON.parse(await readFile(projectPaths.pageDataPath, "utf8"));
    const previewMetadata = JSON.parse(await readFile(projectPaths.previewMetadataPath, "utf8"));
    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    expect(savedPageData.site.businessName).toBe("Blue Peak Dental");
    expect(previewMetadata.status).toBe("ready");
    expect(manifest.status).toBe("generated");
    expect(manifest.failedStage).toBeNull();
  });

  it("fails when connector returns unsupported section type", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProjectForPageData(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        const invalid = buildValidPageData();
        invalid.sections[1] = { type: "testimonials", title: "Testimonials" } as never;
        return { ok: true, rawText: "{}", value: invalid };
      }
    };

    const result = await createPageDataStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(false);

    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    expect(manifest.failedStage).toBe("page-data");
  });

  it("fails when connector returns invalid section ordering", async () => {
    const root = await createTempRoot();
    const slug = "blue-peak-dental";
    const projectPaths = await setupProjectForPageData(root, slug);

    const connector: LLMConnector = {
      async generateJson() {
        const invalid = buildValidPageData();
        invalid.sections = [invalid.sections[1], invalid.sections[0], ...invalid.sections.slice(2)];
        return { ok: true, rawText: "{}", value: invalid };
      }
    };

    const result = await createPageDataStage({ projectSlug: slug, projectsRoot: root, connector });
    expect(result.ok).toBe(false);

    const manifest = await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
    expect(manifest.failedStage).toBe("page-data");
  });
});
