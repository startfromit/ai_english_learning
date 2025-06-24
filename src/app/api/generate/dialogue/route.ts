import { NextResponse } from 'next/server';
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { RANDOM_THEMES, RANDOM_PERSPECTIVES, RANDOM_AUDIENCES, getRandomElement } from '@/lib/topics';
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

export async function POST(request: Request) {
  const provider = (process.env.LLM_PROVIDER || 'openai') as LlmProvider;
  const { topic = '', length = 200, style = 'casual' } = await request.json();
  
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
          gender: z.enum(['male', 'female']),
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
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // 获取对话风格信息
  const dialogueStyle = DIALOGUE_STYLES[style as keyof typeof DIALOGUE_STYLES] || DIALOGUE_STYLES.casual;
  
  // 生成参与者
  const generateParticipants = () => {
    const firstNames = ['Alex', 'Taylor', 'Jordan', 'Casey', 'Riley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
    
    const getRandomName = () => {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      return `${firstName} ${lastName}`;
    };
    
    return [getRandomName(), getRandomName()];
  };
  
  const participants = generateParticipants();
  
  // 如果没有提供话题，则根据风格生成一个
  let finalTopic = topic;
  if (!finalTopic) {
    const topicExample = getRandomElement(dialogueStyle.examples);
    finalTopic = `${dialogueStyle.name} - ${topicExample}`;
  }

  const prompt = `Generate a natural dialogue in English with the following requirements:
  - Style: ${dialogueStyle.name} (${dialogueStyle.description})
  - Topic: ${finalTopic}
  - Participants: ${participants.join(' and ')}
  - Length: ${safeLength} words
  - Include a title in English and Chinese
  - Generate 8-12 message exchanges
  - Each message should have:
    - Speaker name
    - English text
    - Chinese translation
    - Timestamp (e.g., "10:05 AM")
    - Speaker gender (male/female)
  - Include 5-8 key vocabulary words with meanings and example sentences
  
  ${formatInstructions}
  `;

  try {
    const response = await llm.call(prompt);
    const result = await parser.parse(response);
    
    return NextResponse.json({
      style: {
        id: style,
        ...dialogueStyle
      },
      ...result
    });
  } catch (error) {
    console.error('Error generating dialogue:', error);
    return NextResponse.json(
      { error: 'Failed to generate dialogue' },
      { status: 500 }
    );
  }
}

// 获取对话风格列表
export async function GET() {
  return NextResponse.json({
    styles: Object.entries(DIALOGUE_STYLES).map(([id, style]) => ({
      id,
      ...style
    }))
  });
}

// Add OPTIONS method for CORS preflight
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
