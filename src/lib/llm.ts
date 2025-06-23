import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";

export type LlmProvider = 'openai' | 'ollama' | 'deepseek' | 'zhipu';

export function getLlm(provider: LlmProvider) {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-3.5-turbo",
        temperature: 1,
      });
    case 'ollama':
      return new Ollama({
        model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
        baseUrl: process.env.OLLAMA_API_BASE || 'http://localhost:11434',
        temperature: 1,
        maxRetries: 2,
      });
    case 'deepseek':
      return new ChatOpenAI({
        model: "deepseek-chat",
        temperature: 1,
        configuration: {
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: "https://api.deepseek.com/v1",
        }
      });
    case 'zhipu':
      return new ChatOpenAI({
          model: process.env.ZHIPU_MODEL_NAME || "glm-4-flash",
          temperature: 1,
          configuration: {
            apiKey: process.env.ZHIPU_API_KEY,
            baseURL: "https://open.bigmodel.cn/api/paas/v4/",
          }
      });
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }
} 