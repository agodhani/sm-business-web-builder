import { WizardShell } from "../components/wizard/wizard-shell";
import { ProjectList } from "../components/projects/project-list";
import { GENERATED_PROJECTS_ROOT } from "../lib/config";
import { listProjects } from "../lib/projects/project-query";
import { discoverStyleSummaries } from "../lib/styles/discover-styles";

export const dynamic = "force-dynamic";

function resolveProjectsRoot() {
  return process.env.GENERATED_PROJECTS_ROOT?.trim() || GENERATED_PROJECTS_ROOT;
}

export default async function Home() {
  const [styles, projects] = await Promise.all([
    discoverStyleSummaries(),
    listProjects(resolveProjectsRoot())
  ]);

  return (
    <main>
      <section className="grid">
        <WizardShell styles={styles} />

        <ProjectList projects={projects} />
      </section>
    </main>
  );
}
