import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WizardInput } from "../validation/wizard-schema";
import type { ProjectManifest, ManifestStage } from "./project-manifest";
import type { ProjectPaths } from "./project-paths";

async function writeJsonFile(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function createProjectWorkspace(projectPaths: ProjectPaths) {
  await mkdir(projectPaths.projectRoot, { recursive: true });
  await mkdir(projectPaths.versionRoot, { recursive: true });
  await mkdir(projectPaths.artifactsDir, { recursive: true });
  await mkdir(projectPaths.assetsDir, { recursive: true });
}

export async function writeRawInput(projectPaths: ProjectPaths, input: WizardInput) {
  await writeJsonFile(projectPaths.rawInputPath, input);
}

export async function writeManifest(projectPaths: ProjectPaths, manifest: ProjectManifest) {
  await writeJsonFile(projectPaths.manifestPath, manifest);
}

export async function copyProjectImages(
  projectPaths: ProjectPaths,
  images: WizardInput["images"]
): Promise<WizardInput["images"]> {
  if (!images || images.length === 0) {
    return [];
  }

  await mkdir(projectPaths.assetsDir, { recursive: true });

  const copiedImages = await Promise.all(
    images.map(async (image) => {
      const targetFileName = path.basename(image.fileName);
      const destinationPath = path.join(projectPaths.assetsDir, targetFileName);
      await copyFile(image.sourcePath, destinationPath);

      return {
        ...image,
        fileName: targetFileName,
        sourcePath: destinationPath
      };
    })
  );

  return copiedImages;
}

export async function writeStageArtifact(
  projectPaths: ProjectPaths,
  stage: ManifestStage,
  artifact: unknown,
  nowIso: string = new Date().toISOString()
) {
  await mkdir(projectPaths.artifactsDir, { recursive: true });
  const safeTimestamp = nowIso.replace(/[:.]/g, "-");
  const filePath = path.join(projectPaths.artifactsDir, `${stage}-${safeTimestamp}.json`);
  await writeJsonFile(filePath, artifact);
}

export async function writePageData(projectPaths: ProjectPaths, pageData: unknown) {
  await writeJsonFile(projectPaths.pageDataPath, pageData);
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}
