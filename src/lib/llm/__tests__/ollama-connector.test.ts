import { beforeEach, describe, expect, it, vi } from "vitest";
import { OLLAMA_BASE_URL } from "../../config";
import { OllamaConnector } from "../ollama-connector";

describe("OllamaConnector", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns typed success when provider returns valid JSON text", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          response: "{\"headline\":\"Modern family dental care\"}"
        }),
        { status: 200 }
      )
    );

    const connector = new OllamaConnector();
    const result = await connector.generateJson<{ headline: string }>({
      prompt: "Generate JSON."
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.headline).toBe("Modern family dental care");
    }
  });

  it("uses thinking field when response field is empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          response: "",
          thinking: "{\"headline\":\"Modern family dental care\"}"
        }),
        { status: 200 }
      )
    );

    const connector = new OllamaConnector();
    const result = await connector.generateJson<{ headline: string }>({
      prompt: "Generate JSON."
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.headline).toBe("Modern family dental care");
    }
  });

  it("returns invalid_json error when JSON parsing fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          response: "not-json"
        }),
        { status: 200 }
      )
    );

    const connector = new OllamaConnector();
    const result = await connector.generateJson<{ headline: string }>({
      prompt: "Generate JSON."
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("invalid_json");
    }
  });

  it("returns http error for non-200 responses", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "model not found" }), { status: 404 })
    );

    const connector = new OllamaConnector();
    const result = await connector.generateJson<{ headline: string }>({
      prompt: "Generate JSON."
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("http");
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("returns network error when fetch fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("connect ECONNREFUSED"));

    const connector = new OllamaConnector();
    const result = await connector.generateJson<{ headline: string }>({
      prompt: "Generate JSON."
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("network");
    }
  });

  it("sends request to configured ollama endpoint and model", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ response: "{}" }), { status: 200 })
    );

    const connector = new OllamaConnector({
      baseUrl: OLLAMA_BASE_URL,
      model: "qwen3.6:35b"
    });
    await connector.generateJson<Record<string, unknown>>({
      prompt: "Generate JSON."
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      `${OLLAMA_BASE_URL}/api/generate`,
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
