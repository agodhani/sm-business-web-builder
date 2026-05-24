import { GENERATED_PROJECTS_ROOT } from "../../../../../lib/config";
import { getProjectManifest, getProjectPageData } from "../../../../../lib/projects/project-query";
import { buildPageHtml } from "../../../../../lib/preview/build-page-html";
import { loadStyleById } from "../../../../../lib/styles/load-style";
import type { GeneratedPageData } from "../../../../../lib/types/page-data";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
};

function resolveProjectsRoot() {
  return process.env.GENERATED_PROJECTS_ROOT?.trim() || GENERATED_PROJECTS_ROOT;
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { projectSlug } = await context.params;
  const projectsRoot = resolveProjectsRoot();

  const manifest = await getProjectManifest(projectSlug, projectsRoot);
  if (!manifest) {
    return htmlResponse(
      `<!DOCTYPE html><html><body><h1>Project not found: ${projectSlug}</h1></body></html>`,
      404
    );
  }

  const pageData = await getProjectPageData<GeneratedPageData>(projectSlug, projectsRoot);
  if (!pageData) {
    return htmlResponse(
      `<!DOCTYPE html><html><body><h1>No page data yet</h1><p>Status: ${manifest.status}</p></body></html>`,
      404
    );
  }

  const loadedStyle = await loadStyleById(manifest.selectedStyleId);
  const assetBasePath = `/api/projects/${projectSlug}/preview?asset=`;
  const html = buildPageHtml(pageData, loadedStyle.style, assetBasePath);

  return htmlResponse(html);
}
