import { access } from "node:fs/promises";
import path from "node:path";
import { GENERATED_PROJECTS_ROOT } from "../../../lib/config";
import {
  createProjectManifest,
  resolveProjectName,
  type ProjectManifest
} from "../../../lib/projects/project-manifest";
import { createProjectSlug, getProjectPaths } from "../../../lib/projects/project-paths";
import { listProjects } from "../../../lib/projects/project-query";
import {
  copyProjectImages,
  createProjectWorkspace,
  writeManifest,
  writeRawInput
} from "../../../lib/projects/project-storage";
import { wizardSchema } from "../../../lib/validation/wizard-schema";

function resolveProjectsRoot(): string {
  return process.env.GENERATED_PROJECTS_ROOT?.trim() || GENERATED_PROJECTS_ROOT;
}

async function ensureUniqueProjectSlug(baseSlug: string, projectsRoot: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const manifestPath = path.join(projectsRoot, candidate, "manifest.json");
    try {
      await access(manifestPath);
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    } catch {
      return candidate;
    }
  }
}

function createProjectResponse(manifest: ProjectManifest) {
  return {
    projectSlug: manifest.projectSlug,
    manifest
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = wizardSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid project payload.",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const projectName = resolveProjectName(input.projectName, input.businessName);
  const projectsRoot = resolveProjectsRoot();
  const baseSlug = createProjectSlug(projectName);
  const projectSlug = await ensureUniqueProjectSlug(baseSlug, projectsRoot);
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);

  await createProjectWorkspace(projectPaths);
  const copiedImages = await copyProjectImages(projectPaths, input.images);
  const persistedInput = {
    ...input,
    projectName,
    images: copiedImages
  };

  const manifest = createProjectManifest({
    projectName,
    projectSlug,
    businessName: input.businessName,
    selectedStyleId: input.styleId
  });

  await writeRawInput(projectPaths, persistedInput);
  await writeManifest(projectPaths, manifest);

  return Response.json(createProjectResponse(manifest), { status: 201 });
}

export async function GET() {
  const projects = await listProjects(resolveProjectsRoot());
  return Response.json({ projects });
}
