export type ManifestStage = "brief" | "page-plan" | "story-requirements" | "page-data";
export type ManifestStatus = "created" | "generating" | "failed" | "generated";

export type ProjectManifest = {
  projectName: string;
  projectSlug: string;
  businessName: string;
  selectedStyleId: string;
  version: "v1";
  status: ManifestStatus;
  currentStage: ManifestStage | null;
  failedStage: ManifestStage | null;
  createdAt: string;
  updatedAt: string;
  previewPath: string;
};

export function resolveProjectName(projectName: string | undefined, businessName: string): string {
  const trimmedName = projectName?.trim();
  return trimmedName && trimmedName.length > 0 ? trimmedName : businessName.trim();
}

export function createProjectManifest(
  input: {
    projectName: string;
    projectSlug: string;
    businessName: string;
    selectedStyleId: string;
  },
  nowIso: string = new Date().toISOString()
): ProjectManifest {
  return {
    projectName: input.projectName,
    projectSlug: input.projectSlug,
    businessName: input.businessName,
    selectedStyleId: input.selectedStyleId,
    version: "v1",
    status: "created",
    currentStage: null,
    failedStage: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    previewPath: `/projects/${input.projectSlug}`
  };
}

function withManifestUpdate(
  manifest: ProjectManifest,
  update: Partial<Omit<ProjectManifest, "createdAt" | "projectSlug">>,
  nowIso: string
): ProjectManifest {
  return {
    ...manifest,
    ...update,
    updatedAt: nowIso
  };
}

export function markManifestStageRunning(
  manifest: ProjectManifest,
  stage: ManifestStage,
  nowIso: string = new Date().toISOString()
): ProjectManifest {
  return withManifestUpdate(
    manifest,
    {
      status: "generating",
      currentStage: stage,
      failedStage: null
    },
    nowIso
  );
}

export function markManifestFailed(
  manifest: ProjectManifest,
  stage: ManifestStage,
  nowIso: string = new Date().toISOString()
): ProjectManifest {
  return withManifestUpdate(
    manifest,
    {
      status: "failed",
      currentStage: stage,
      failedStage: stage
    },
    nowIso
  );
}

export function markManifestGenerated(
  manifest: ProjectManifest,
  nowIso: string = new Date().toISOString()
): ProjectManifest {
  return withManifestUpdate(
    manifest,
    {
      status: "generated",
      currentStage: null,
      failedStage: null
    },
    nowIso
  );
}

export function getManifestStatusLabel(manifest: ProjectManifest): string {
  if (manifest.status === "failed") {
    return manifest.failedStage
      ? `Failed at ${manifest.failedStage}`
      : "Failed";
  }
  if (manifest.status === "generating") {
    return manifest.currentStage
      ? `Generating (${manifest.currentStage})`
      : "Generating";
  }
  if (manifest.status === "generated") {
    return "Generated";
  }
  return "Created";
}
