import type { NextApiRequest, NextApiResponse } from 'next';
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { RANDOM_THEMES, RANDOM_PERSPECTIVES, RANDOM_AUDIENCES, getRandomElement } from '../../lib/topics';
import { getLlm, LlmProvider } from '@/lib/llm';

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
  const provider = (process.env.LLM_PROVIDER || 'openai') as LlmProvider;
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
  try {
    llm = getLlm(provider);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
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
    console.log('即将请求 LLM，provider:', provider, 'model:', llm.modelName || llm.model, 'baseURL:', llm.lc_kwargs?.baseURL || llm.baseUrl);
    
    const result = await Promise.race([
      llm.invoke(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('LLM请求超时')), 60_000))
    ]);
    
    console.log('LLM初次返回结果:', result.content);

    let parsed;
    try {
      // 首次尝试解析
      // @ts-ignore
      parsed = await parser.parse(result.content);
    } catch (err) {
      console.error("第一次解析失败，尝试发送修正请求...", err);
      
      const correctionPrompt = [
        ...prompt, // 原始prompt
        result,   // 模型第一次的错误回复
        {
            role: "user",
            content: `The JSON object you provided was invalid. Please fix it. The parsing error was: \n\n${(err as Error).message}\n\nPlease provide only the corrected JSON object, without any surrounding text, explanations, or code fences.`
        }
      ];

      // 发送修正请求
      const correctedResult = await llm.invoke(correctionPrompt);
      console.log("LLM修正后的返回结果:", correctedResult.content);

      try {
        // 再次尝试解析
        // @ts-ignore
        parsed = await parser.parse(correctedResult.content);
      } catch (finalErr) {
         console.error("修正后解析仍然失败", finalErr);
         // @ts-ignore
         return res.status(500).json({ error: "结构化解析失败", raw: correctedResult.content, details: (finalErr as Error)?.message });
      }
    }
    res.status(200).json(parsed);
  } catch (e: any) {
    console.error('LLM调用异常:', e);
    res.status(500).json({ error: e.message || e.toString() });
  }
} 