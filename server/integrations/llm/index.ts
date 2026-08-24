import { GeminiLlmProvider } from "./gemini";
import type { LLMOptions, LLMResponse, LlmProvider } from "./types";

export type { LLMMessage, LLMOptions, LLMResponse, LlmProvider } from "./types";

let cachedProvider: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (cachedProvider) return cachedProvider;
  const selected = (process.env.NIGHTFALL_LLM_PROVIDER || "gemini").trim().toLowerCase();
  switch (selected) {
    case "gemini":
      cachedProvider = new GeminiLlmProvider();
      break;
    default:
      throw new Error(`Unknown NIGHTFALL_LLM_PROVIDER "${selected}"`);
  }
  return cachedProvider;
}

export async function invokeLLM(options: LLMOptions): Promise<LLMResponse> {
  return getLlmProvider().complete(options);
}
