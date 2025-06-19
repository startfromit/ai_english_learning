import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const { theme = '科技', length = 200 } = req.body;
  // 防攻击：强制限制长度
  const safeLength = Math.max(100, Math.min(500, Number(length) || 200));

  // 结构化输出schema（包含title和sentences）
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      title: z.string(),
      sentences: z.array(
        z.object({
          english: z.string(),
          chinese: z.string(),
        })
      ),
    })
  );
  const formatInstructions = parser.getFormatInstructions();

  let llm: any;
  if (provider === 'openai') {
    llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-3.5-turbo",
      temperature: 0.9,
    });
  } else if (provider === 'ollama') {
    llm = new Ollama({
      model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
      baseUrl: process.env.OLLAMA_API_BASE || 'http://localhost:11434',
      temperature: 0.9,
      maxRetries: 2,
    });
  } else if (provider === 'deepseek') {
    llm = new ChatOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: "deepseek-chat",
      temperature: 0.9,
      // @ts-expect-error
      baseURL: "https://api.deepseek.com/v1",
    });
  } else {
    return res.status(400).json({ error: '不支持的 LLM_PROVIDER' });
  }

  const prompt = [
    {
      role: "user",
      content: `请用英文写一篇英文部分不少于${safeLength}词的短文，主题为${theme}。请将英文内容拆分为句子，每句后面加上精准的中文翻译，并给短文拟一个简洁、准确的英文标题。输出如下结构的JSON对象：\n{\n  \"title\": \"...\",\n  \"sentences\": [\n    {\"english\": \"...\", \"chinese\": \"...\"},\n    ...\n  ]\n}\n请严格按照上述JSON结构输出，不要加任何多余内容。${formatInstructions}`,
    },
  ];

  try {
    console.log('即将请求 LLM，provider:', provider, 'model:', llm.model, 'baseURL:', llm.baseUrl || llm.baseURL);
    const result = await Promise.race([
      llm.invoke(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('LLM请求超时')), 60_000))
    ]);
    console.log('LLM返回结果:', result);
    let parsed;
    try {
      // @ts-ignore
      parsed = await parser.parse(result);
    } catch (err) {
      // @ts-ignore
      return res.status(500).json({ error: "结构化解析失败", raw: result, details: err?.message });
    }
    res.status(200).json(parsed);
  } catch (e: any) {
    console.error('LLM调用异常:', e);
    res.status(500).json({ error: e.message || e.toString() });
  }
} 