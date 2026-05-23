import Link from "next/link";
import {
  getManifestStatusLabel,
  type ProjectManifest
} from "../../lib/projects/project-manifest";
import { RetryGenerationButton } from "./retry-generation-button";

type ProjectListProps = {
  projects: ProjectManifest[];
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function ProjectList({ projects }: ProjectListProps) {
  const hasProjects = projects.length > 0;
  const failedProjects = projects.filter((project) => project.status === "failed");

  return (
    <section className="panel project-panel">
      <span className="badge">Project List</span>
      <h2>Generated Projects</h2>

      {!hasProjects ? <p>No projects yet. Create one with the wizard to initialize a workspace.</p> : null}

      {hasProjects ? (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.projectSlug} className="project-item">
              <div>
                <p className="project-title">{project.projectName}</p>
                <p className="project-meta">
                  Style: {project.selectedStyleId} · Updated: {formatTimestamp(project.updatedAt)}
                </p>
                <p className="project-meta">
                  Status: {getManifestStatusLabel(project)}
                </p>
              </div>

              <div className="project-actions">
                <Link href={`/projects/${project.projectSlug}`} className="secondary-link">
                  Open Preview
                </Link>
                {project.status === "failed" ? <RetryGenerationButton projectSlug={project.projectSlug} /> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {failedProjects.length > 0 ? (
        <p className="step-copy">Failed projects can be retried from this list.</p>
      ) : null}
    </section>
  );
}
