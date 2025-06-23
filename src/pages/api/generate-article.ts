import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { RANDOM_TOPICS, RANDOM_THEMES, RANDOM_PERSPECTIVES, RANDOM_AUDIENCES, getRandomElement } from '../../lib/topics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const { topic = '', theme = '科技', length = 200 } = req.body;
  // 防攻击：强制限制长度
  const safeLength = Math.max(100, Math.min(500, Number(length) || 200));

  // 结构化输出schema（包含title和sentences）
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      title: z.string(),
      title_chinese: z.string(),
      sentences: z.array(
        z.object({
          english: z.string(),
          chinese: z.string(),
        })
      ),
      vocabulary: z.array(
        z.object({
          word: z.string(),
          meaning_en: z.string(),
          meaning_zh: z.string(),
          example: z.string(),
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
      temperature: 1,
    });
  } else if (provider === 'ollama') {
    llm = new Ollama({
      model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
      baseUrl: process.env.OLLAMA_API_BASE || 'http://localhost:11434',
      temperature: 1,
      maxRetries: 2,
    });
  } else if (provider === 'deepseek') {
    llm = new ChatOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: "deepseek-chat",
      temperature: 1,
      // @ts-expect-error
      baseURL: "https://api.deepseek.com/v1",
    });
  } else {
    return res.status(400).json({ error: '不支持的 LLM_PROVIDER' });
  }

  let finalTopic = topic;
  if (!finalTopic) {
    // 让LLM生成一个真正随机的话题，而不是从固定列表中选择
    const randomTheme = getRandomElement(RANDOM_THEMES);
    const randomPerspective = getRandomElement(RANDOM_PERSPECTIVES);
    const randomAudience = getRandomElement(RANDOM_AUDIENCES);
    
    const topicPrompt = `Generate a unique, engaging topic for English speaking practice and essay writing. 

Requirements:
- Theme: ${randomTheme}
- Perspective: ${randomPerspective}
- Target audience: ${randomAudience}
- Must be different from common topics like "social media effects" or "climate change"
- Should be specific and thought-provoking
- Suitable for English learners
- Return only the topic title in English, no quotes or extra text

Examples of what NOT to generate:
- "The impact of social media on mental health"
- "Climate change and sustainability" 
- "Artificial intelligence in daily life"

Generate something unique and unexpected:`;
    
    try {
      const topicResult = await llm.invoke([{ role: "user", content: topicPrompt }]);
      const topicText = typeof topicResult === 'string' ? topicResult : topicResult.content.toString();
      finalTopic = topicText.replace(/["'`]/g, '').trim();
      console.log('Generated random topic:', finalTopic);
    } catch (error) {
      console.error('Failed to generate random topic, falling back to fixed list:', error);
      // 如果LLM生成失败，回退到固定列表
      finalTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    }
  }

  const prompt = [
    {
      role: "user",
      content: `请用英文写一篇英文部分不少于${safeLength}词的短文，话题为"${finalTopic}"。请将英文内容拆分为句子，每句后面加上精准的中文翻译，并给短文拟一个简洁、准确的英文标题，同时提供标题的中文翻译。然后，从文章中挑选3-5个较难的单词或词组，提供该词的**英文定义(English definition)**和中文解释，并给出一个例句。输出如下结构的JSON对象：\n{\n  \"title\": \"...\",\n  \"title_chinese\": \"...\",\n  \"sentences\": [\n    {\"english\": \"...\", \"chinese\": \"...\"},\n    ...\n  ],\n  \"vocabulary\": [\n    {\"word\": \"...\", \"meaning_en\": \"...\", \"meaning_zh\": \"...\", \"example\": \"...\"},\n    ...\n  ]\n}\n请严格按照上述JSON结构输出，不要加任何多余内容。${formatInstructions}`,
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