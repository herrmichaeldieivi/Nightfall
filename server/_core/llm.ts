import axios from "axios";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<any>;
};

export type LLMOptions = {
  model?: string;
  max_tokens?: number;
  max_completion_tokens?: number;
  messages: LLMMessage[];
  response_format?: {
    type: string;
    json_schema?: any;
  };
};

export async function invokeLLM(options: LLMOptions) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!apiKey) {
    // Fallback mock response for testing or development if API key is not set
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

  // If apiKey is present, call Gemini API via standard endpoint or axios
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
