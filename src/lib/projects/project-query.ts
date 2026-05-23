import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { GENERATED_PROJECTS_ROOT } from "../config";
import type { ProjectManifest } from "./project-manifest";
import { readJsonFile } from "./project-storage";
import { getProjectPaths } from "./project-paths";

export async function listProjects(projectsRoot: string = GENERATED_PROJECTS_ROOT): Promise<ProjectManifest[]> {
  let entries: Dirent[] = [];
  try {
    entries = await readdir(projectsRoot, {
      withFileTypes: true,
      encoding: "utf8"
    });
  } catch {
    return [];
  }

  const manifests = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const manifestPath = path.join(projectsRoot, entry.name, "manifest.json");
        try {
          return await readJsonFile<ProjectManifest>(manifestPath);
        } catch {
          return null;
        }
      })
  );

  return manifests
    .filter((manifest): manifest is ProjectManifest => manifest !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProjectManifest(
  projectSlug: string,
  projectsRoot: string = GENERATED_PROJECTS_ROOT
): Promise<ProjectManifest | null> {
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  try {
    return await readJsonFile<ProjectManifest>(projectPaths.manifestPath);
  } catch {
    return null;
  }
}

export async function getProjectPageData<T = unknown>(
  projectSlug: string,
  projectsRoot: string = GENERATED_PROJECTS_ROOT
): Promise<T | null> {
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  try {
    return await readJsonFile<T>(projectPaths.pageDataPath);
  } catch {
    return null;
  }
}
