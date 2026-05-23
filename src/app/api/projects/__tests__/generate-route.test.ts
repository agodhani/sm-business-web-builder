import { beforeEach, describe, expect, it, vi } from "vitest";

const { runGenerationPipelineMock } = vi.hoisted(() => ({
  runGenerationPipelineMock: vi.fn()
}));

vi.mock("../../../../lib/generation/pipeline", () => ({
  runGenerationPipeline: runGenerationPipelineMock
}));

import { POST } from "../[projectSlug]/generate/route";

describe("POST /api/projects/[projectSlug]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success payload when pipeline succeeds", async () => {
    runGenerationPipelineMock.mockResolvedValue({
      ok: true,
      status: "generated",
      projectSlug: "blue-peak-dental",
      previewPath: "/projects/blue-peak-dental"
    });

    const request = new Request("http://localhost/api/projects/blue-peak-dental/generate", {
      method: "POST"
    });
    const response = await POST(request, {
      params: Promise.resolve({ projectSlug: "blue-peak-dental" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("generated");
    expect(body.previewPath).toBe("/projects/blue-peak-dental");
  });

  it("returns failedStage payload when pipeline fails", async () => {
    runGenerationPipelineMock.mockResolvedValue({
      ok: false,
      projectSlug: "blue-peak-dental",
      failedStage: "story-requirements",
      message: "Story stage failed."
    });

    const request = new Request("http://localhost/api/projects/blue-peak-dental/generate", {
      method: "POST"
    });
    const response = await POST(request, {
      params: Promise.resolve({ projectSlug: "blue-peak-dental" })
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.failedStage).toBe("story-requirements");
  });
});
