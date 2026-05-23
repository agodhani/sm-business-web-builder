import path from "node:path";
import { GENERATED_PROJECTS_ROOT } from "../config";

export type ProjectPaths = {
  projectRoot: string;
  versionRoot: string;
  rawInputPath: string;
  manifestPath: string;
  artifactsDir: string;
  assetsDir: string;
  pageDataPath: string;
  previewMetadataPath: string;
};

export function createProjectSlug(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "project";
}

export function getProjectPaths(projectSlug: string, projectsRoot: string = GENERATED_PROJECTS_ROOT): ProjectPaths {
  const projectRoot = path.join(projectsRoot, projectSlug);
  const versionRoot = path.join(projectRoot, "v1");

  return {
    projectRoot,
    versionRoot,
    rawInputPath: path.join(versionRoot, "raw-input.json"),
    manifestPath: path.join(projectRoot, "manifest.json"),
    artifactsDir: path.join(versionRoot, "artifacts"),
    assetsDir: path.join(versionRoot, "assets"),
    pageDataPath: path.join(versionRoot, "page-data.json"),
    previewMetadataPath: path.join(versionRoot, "preview-metadata.json")
  };
}
