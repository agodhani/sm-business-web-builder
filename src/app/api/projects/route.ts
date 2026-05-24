import { access, writeFile } from "node:fs/promises";
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
  let imageFiles: File[] = [];

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Failed to parse form data." }, { status: 400 });
    }
    const dataStr = formData.get("data");
    if (typeof dataStr !== "string") {
      return Response.json({ error: "Missing data field in form." }, { status: 400 });
    }
    try {
      payload = JSON.parse(dataStr);
    } catch {
      return Response.json({ error: "data field must be valid JSON." }, { status: 400 });
    }
    imageFiles = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  } else {
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
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

  let images: typeof input.images;
  if (imageFiles.length > 0) {
    images = await Promise.all(
      imageFiles.map(async (file) => {
        const fileName = path.basename(file.name);
        const destPath = path.join(projectPaths.assetsDir, fileName);
        await writeFile(destPath, Buffer.from(await file.arrayBuffer()));
        return { fileName, sourcePath: destPath, mimeType: file.type || undefined };
      })
    );
  } else {
    images = await copyProjectImages(projectPaths, input.images);
  }

  const persistedInput = {
    ...input,
    projectName,
    images
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
