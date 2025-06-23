import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { RANDOM_THEMES, RANDOM_PERSPECTIVES, RANDOM_AUDIENCES, getRandomElement } from '../../lib/topics';

// 对话风格定义
const DIALOGUE_STYLES = {
  casual: {
    name: '日常轻松',
    description: '朋友间的轻松聊天，话题简单有趣',
    examples: ['周末计划', '美食推荐', '电影讨论', '旅行见闻', '生活趣事']
  },
  business: {
    name: '商务职场',
    description: '工作场合的专业对话，话题正式实用',
    examples: ['项目讨论', '会议安排', '客户沟通', '团队协作', '职业发展']
  },
  social: {
    name: '社交聚会',
    description: '社交场合的友好交流，话题广泛有趣',
    examples: ['兴趣爱好', '文化分享', '节日庆祝', '朋友聚会', '学习交流']
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const { topic = '', length = 200, style = 'casual' } = req.body;
  // 防攻击：强制限制长度
  const safeLength = Math.max(100, Math.min(500, Number(length) || 200));

  // 结构化输出schema（包含对话信息）
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      title: z.string(),
      title_chinese: z.string(),
      topic: z.string(),
      participants: z.array(z.string()),
      messages: z.array(
        z.object({
          speaker: z.string(),
          english: z.string(),
          chinese: z.string(),
          timestamp: z.string(),
          gender: z.enum(['male', 'female']), // 添加性别信息
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
    // 根据选择的风格生成合适的话题
    const selectedStyle = DIALOGUE_STYLES[style as keyof typeof DIALOGUE_STYLES] || DIALOGUE_STYLES.casual;
    const styleExamples = selectedStyle.examples.join(', ');
    
    const topicPrompt = `Generate a casual, everyday topic for English conversation practice in ${selectedStyle.name} style.

Style: ${selectedStyle.name}
Description: ${selectedStyle.description}
Example topics: ${styleExamples}

Requirements:
- Must be casual and everyday, not academic or complex
- Should be something people naturally talk about
- Suitable for English learners
- Fun and engaging
- Return only the topic title in English, no quotes or extra text

Generate a simple, everyday topic:`;
    
    try {
      const topicResult = await llm.invoke([{ role: "user", content: topicPrompt }]);
      const topicText = typeof topicResult === 'string' ? topicResult : topicResult.content.toString();
      finalTopic = topicText.replace(/["'`]/g, '').trim();
      console.log('Generated random dialogue topic:', finalTopic);
    } catch (error) {
      console.error('Failed to generate random dialogue topic, using default:', error);
      finalTopic = selectedStyle.examples[0];
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
- Assign gender to each speaker: Alex (male), Sarah (female)
- Provide a Chinese translation for the dialogue title.
- The conversation should start naturally and get straight to the topic. Avoid generic greetings like "Hello, how are you?".
- The "title" should be a concise and appropriate English title for the given topic.
- After the dialogue, select 3-5 difficult words or phrases from the conversation, provide English and Chinese explanations, and an example sentence for each.

Output the following JSON structure:
{
  "title": "A conversation about [English translation of the topic]",
  "title_chinese": "关于[话题]的对话",
  "topic": "${finalTopic}",
  "participants": ["${participantNames[0]}", "${participantNames[1]}"],
  "messages": [
    {
      "speaker": "...",
      "english": "...",
      "chinese": "...",
      "timestamp": "...",
      "gender": "..."
    },
    ...
  ],
  "vocabulary": [
    {"word": "...", "meaning_en": "...", "meaning_zh": "...", "example": "..."},
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