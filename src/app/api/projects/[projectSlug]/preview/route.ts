import { basename, extname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { GENERATED_PROJECTS_ROOT } from "../../../../../lib/config";
import { getProjectPaths } from "../../../../../lib/projects/project-paths";
import { getProjectManifest, getProjectPageData } from "../../../../../lib/projects/project-query";
import type { GeneratedPageData } from "../../../../../lib/types/page-data";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
};

function resolveProjectsRoot() {
  return process.env.GENERATED_PROJECTS_ROOT?.trim() || GENERATED_PROJECTS_ROOT;
}

function contentTypeForExtension(fileName: string): string {
  const extension = extname(fileName).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { projectSlug } = await context.params;
  const projectsRoot = resolveProjectsRoot();
  const projectPaths = getProjectPaths(projectSlug, projectsRoot);
  const url = new URL(request.url);
  const asset = url.searchParams.get("asset");

  if (asset) {
    const safeFileName = basename(asset);
    const filePath = join(projectPaths.assetsDir, safeFileName);
    try {
      const file = await readFile(filePath);
      return new Response(file, {
        status: 200,
        headers: {
          "content-type": contentTypeForExtension(safeFileName),
          "cache-control": "no-store"
        }
      });
    } catch {
      return Response.json(
        {
          error: "Asset not found.",
          projectSlug,
          asset: safeFileName
        },
        { status: 404 }
      );
    }
  }

  const manifest = await getProjectManifest(projectSlug, projectsRoot);
  if (!manifest) {
    return Response.json(
      {
        error: "Project manifest not found.",
        projectSlug
      },
      { status: 404 }
    );
  }

  const pageData = await getProjectPageData<GeneratedPageData>(projectSlug, projectsRoot);
  if (!pageData) {
    return Response.json(
      {
        projectSlug,
        status: "missing-page-data",
        manifest
      },
      { status: 200 }
    );
  }

  return Response.json(
    {
      projectSlug,
      status: "ready",
      manifest,
      pageData
    },
    { status: 200 }
  );
}
