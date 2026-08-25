import axios from "axios";
import { getStudentGeminiApiKey } from "../../db";
import type { LLMOptions, LLMResponse, LlmProvider } from "./types";

async function resolveApiKey(userId?: number): Promise<string> {
  if (userId) {
    const ownKey = await getStudentGeminiApiKey(userId).catch(() => null);
    if (ownKey) return ownKey;
  }
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

export class GeminiLlmProvider implements LlmProvider {
  async complete(options: LLMOptions): Promise<LLMResponse> {
    const apiKey = await resolveApiKey(options.userId);
    if (!apiKey) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Mock Statement",
                body: "This is a mock AI response generated because GEMINI_API_KEY is not configured.",
                wordCount: 14,
                category: "motivation_letter",
                reviewNote: "This is a starting draft only. Personalize it with your own real details before submitting anything.",
              }),
            },
          },
        ],
      };
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: options.messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
          })),
          generationConfig: {
            maxOutputTokens: options.max_tokens || 1000,
            responseMimeType: options.response_format?.type === "json_schema" ? "application/json" : "text/plain",
          },
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return {
        choices: [
          {
            message: {
              content: text,
            },
          },
        ],
      };
    } catch (error) {
      console.error("LLM invocation error:", error);
      throw new Error("Failed to invoke LLM");
    }
  }
}
