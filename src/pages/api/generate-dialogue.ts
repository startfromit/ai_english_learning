import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { RANDOM_THEMES, RANDOM_PERSPECTIVES, RANDOM_AUDIENCES, getRandomElement } from '../../lib/topics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const { topic = '', length = 200 } = req.body;
  // 防攻击：强制限制长度
  const safeLength = Math.max(100, Math.min(500, Number(length) || 200));

  // 结构化输出schema（包含对话信息）
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      title: z.string(),
      topic: z.string(),
      participants: z.array(z.string()),
      messages: z.array(
        z.object({
          speaker: z.string(),
          english: z.string(),
          chinese: z.string(),
          timestamp: z.string(),
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
    
    const topicPrompt = `Generate a unique, engaging topic for English conversation practice. 

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
      console.log('Generated random dialogue topic:', finalTopic);
    } catch (error) {
      console.error('Failed to generate random dialogue topic, using default:', error);
      finalTopic = "Planning a weekend trip";
    }
  }

  // 生成两个参与者的名字
  const participantNames = ['Alex', 'Sarah'];

  const prompt = [
    {
      role: "user",
      content: `Create a natural English conversation between two people about "${finalTopic}". 

Requirements:
- Create a dialogue with ${Math.ceil(safeLength / 50)} exchanges (approximately ${safeLength} words total)
- Two participants: ${participantNames.join(' and ')}
- Each message should be natural, conversational English
- Include both English and Chinese translation for each message
- Add realistic timestamps (e.g., "10:30 AM", "2:15 PM")
- Make the conversation engaging and educational for English learners
- Cover different aspects of the topic naturally
- Include common expressions and idioms where appropriate

Output the following JSON structure:
{
  "title": "A conversation about [topic]",
  "topic": "${finalTopic}",
  "participants": ["${participantNames[0]}", "${participantNames[1]}"],
  "messages": [
    {
      "speaker": "${participantNames[0]}",
      "english": "Hello! How are you doing today?",
      "chinese": "你好！你今天怎么样？",
      "timestamp": "10:30 AM"
    },
    ...
  ]
}

${formatInstructions}`,
    },
  ];

  try {
    console.log('即将请求 LLM 生成对话，provider:', provider, 'model:', llm.model, 'baseURL:', llm.baseUrl || llm.baseURL);
    const result = await Promise.race([
      llm.invoke(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('LLM请求超时')), 60_000))
    ]);
    console.log('LLM返回对话结果:', result);
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