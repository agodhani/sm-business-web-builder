export type LLMErrorType = "http" | "network" | "invalid_json" | "provider";

export type LLMError = {
  type: LLMErrorType;
  message: string;
  statusCode?: number;
  details?: unknown;
};

export type LLMResult<T> =
  | {
      ok: true;
      value: T;
      rawText: string;
    }
  | {
      ok: false;
      error: LLMError;
      rawText?: string;
    };

export type GenerateJsonInput = {
  prompt: string;
};

export interface LLMConnector {
  generateJson<T>(input: GenerateJsonInput): Promise<LLMResult<T>>;
}
