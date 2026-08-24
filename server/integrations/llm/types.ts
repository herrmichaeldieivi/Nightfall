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

export type LLMResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export interface LlmProvider {
  complete(options: LLMOptions): Promise<LLMResponse>;
}
