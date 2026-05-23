import { DEFAULT_OLLAMA_MODEL, OLLAMA_BASE_URL } from "../config";
import type { GenerateJsonInput, LLMConnector, LLMResult } from "./connector";

type OllamaConnectorOptions = {
  baseUrl?: string;
  model?: string;
};

type OllamaGenerateResponse = {
  response?: string;
  thinking?: string;
  error?: string;
};

function extractJsonCandidate(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("```")) {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      return fenceMatch[1].trim();
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export class OllamaConnector implements LLMConnector {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: OllamaConnectorOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? OLLAMA_BASE_URL);
    this.model = options.model ?? DEFAULT_OLLAMA_MODEL;
  }

  async generateJson<T>(input: GenerateJsonInput): Promise<LLMResult<T>> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          prompt: input.prompt,
          stream: false,
          format: "json"
        })
      });
    } catch (error) {
      return {
        ok: false,
        error: {
          type: "network",
          message: error instanceof Error ? error.message : "Network error calling Ollama.",
          details: error
        }
      };
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as OllamaGenerateResponse | null;
      return {
        ok: false,
        error: {
          type: "http",
          message: errorBody?.error ?? `Ollama request failed with status ${response.status}.`,
          statusCode: response.status,
          details: errorBody
        }
      };
    }

    const body = (await response.json()) as OllamaGenerateResponse;
    const rawText = typeof body.response === "string" && body.response.trim().length > 0
      ? body.response.trim()
      : typeof body.thinking === "string"
        ? body.thinking.trim()
        : "";
    if (!rawText) {
      return {
        ok: false,
        error: {
          type: "provider",
          message: "Ollama returned an empty response payload.",
          details: body
        }
      };
    }

    try {
      const jsonCandidate = extractJsonCandidate(rawText);
      const value = JSON.parse(jsonCandidate) as T;
      return {
        ok: true,
        value,
        rawText
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: "invalid_json",
          message: "Ollama returned non-JSON content.",
          details: error
        },
        rawText
      };
    }
  }
}
