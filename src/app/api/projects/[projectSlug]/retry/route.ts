import { GENERATED_PROJECTS_ROOT } from "../../../../../lib/config";
import { runGenerationPipeline } from "../../../../../lib/generation/pipeline";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
};

async function resolveProjectSlug(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.projectSlug;
}

function resolveProjectsRoot() {
  return process.env.GENERATED_PROJECTS_ROOT?.trim() || GENERATED_PROJECTS_ROOT;
}

export async function POST(_request: Request, context: RouteContext) {
  const projectSlug = await resolveProjectSlug(context);
  if (!projectSlug) {
    return Response.json({ error: "projectSlug is required." }, { status: 400 });
  }

  const result = await runGenerationPipeline({
    projectSlug,
    projectsRoot: resolveProjectsRoot()
  });

  if (!result.ok) {
    return Response.json(
      {
        status: "failed",
        projectSlug,
        failedStage: result.failedStage,
        message: result.message
      },
      { status: 500 }
    );
  }

  return Response.json(
    {
      status: result.status,
      projectSlug,
      previewPath: result.previewPath
    },
    { status: 200 }
  );
}
