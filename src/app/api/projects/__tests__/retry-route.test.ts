import { beforeEach, describe, expect, it, vi } from "vitest";

const { runGenerationPipelineMock } = vi.hoisted(() => ({
  runGenerationPipelineMock: vi.fn()
}));

vi.mock("../../../../lib/generation/pipeline", () => ({
  runGenerationPipeline: runGenerationPipelineMock
}));

import { POST } from "../[projectSlug]/retry/route";

describe("POST /api/projects/[projectSlug]/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reruns full pipeline and returns success payload", async () => {
    runGenerationPipelineMock.mockResolvedValue({
      ok: true,
      status: "generated",
      projectSlug: "blue-peak-dental",
      previewPath: "/projects/blue-peak-dental"
    });

    const request = new Request("http://localhost/api/projects/blue-peak-dental/retry", {
      method: "POST"
    });
    const response = await POST(request, {
      params: Promise.resolve({ projectSlug: "blue-peak-dental" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("generated");
    expect(runGenerationPipelineMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectSlug: "blue-peak-dental" })
    );
  });

  it("returns failed stage when retry run fails", async () => {
    runGenerationPipelineMock.mockResolvedValue({
      ok: false,
      projectSlug: "blue-peak-dental",
      failedStage: "page-data",
      message: "Page-data stage failed."
    });

    const request = new Request("http://localhost/api/projects/blue-peak-dental/retry", {
      method: "POST"
    });
    const response = await POST(request, {
      params: Promise.resolve({ projectSlug: "blue-peak-dental" })
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.failedStage).toBe("page-data");
  });
});
