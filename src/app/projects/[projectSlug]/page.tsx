import { RetryGenerationButton } from "../../../components/projects/retry-generation-button";
import { GENERATED_PROJECTS_ROOT } from "../../../lib/config";
import { getManifestStatusLabel } from "../../../lib/projects/project-manifest";
import { getProjectManifest, getProjectPageData } from "../../../lib/projects/project-query";
import type { GeneratedPageData } from "../../../lib/types/page-data";

type ProjectPreviewPageProps = {
  params: Promise<{ projectSlug: string }>;
};

function resolveProjectsRoot() {
  return process.env.GENERATED_PROJECTS_ROOT?.trim() || GENERATED_PROJECTS_ROOT;
}

export default async function ProjectPreviewPage({ params }: ProjectPreviewPageProps) {
  const { projectSlug } = await params;
  const projectsRoot = resolveProjectsRoot();
  const manifest = await getProjectManifest(projectSlug, projectsRoot);

  if (!manifest) {
    return (
      <main>
        <h1>Project Not Found</h1>
        <p>Could not locate a saved manifest for project "{projectSlug}".</p>
      </main>
    );
  }

  const pageData = await getProjectPageData<GeneratedPageData>(projectSlug, projectsRoot);
  const statusLabel = getManifestStatusLabel(manifest);

  if (!pageData) {
    return (
      <main>
        <h1>Preview Not Available</h1>
        <p>Project "{manifest.projectName}" has no generated page data yet.</p>
        <p>Status: {statusLabel}</p>
        {manifest.status === "failed" ? <RetryGenerationButton projectSlug={projectSlug} /> : null}
        <p>
          <a href="/">Back to projects</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <p className="step-copy">
        Project: <strong>{manifest.projectName}</strong> · Status: <strong>{statusLabel}</strong>
      </p>
      <iframe
        src={`/api/projects/${projectSlug}/page-html`}
        style={{ width: "100%", height: "80vh", border: "none", display: "block" }}
        title={manifest.projectName}
      />
    </main>
  );
}
