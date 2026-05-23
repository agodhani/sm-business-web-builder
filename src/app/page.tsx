import { WizardShell } from "../components/wizard/wizard-shell";
import { listProjects } from "../lib/projects/project-query";
import { discoverStyleSummaries } from "../lib/styles/discover-styles";

export default async function Home() {
  const [styles, projects] = await Promise.all([discoverStyleSummaries(), listProjects()]);

  return (
    <main>
      <section className="grid">
        <WizardShell styles={styles} />

        <aside className="panel project-panel">
          <span className="badge">Project List</span>
          <h2>Generated Projects</h2>
          <p>
            {projects.length > 0
              ? `${projects.length} project(s) found on disk. Reopen controls are added in Packet 20.`
              : "No projects yet. Create one with the wizard to initialize a workspace."}
          </p>
        </aside>
      </section>
    </main>
  );
}
