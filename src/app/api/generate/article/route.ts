import { NextResponse } from 'next/server';
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { RANDOM_TOPICS, RANDOM_THEMES, RANDOM_PERSPECTIVES, RANDOM_AUDIENCES, getRandomElement } from '@/lib/topics';
import { getLlm, LlmProvider } from '@/lib/llm';

export async function POST(request: Request) {
  const provider = (process.env.LLM_PROVIDER || 'openai') as LlmProvider;
  const { topic = '', theme = '科技', length = 200 } = await request.json();

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
  try {
    llm = getLlm(provider);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  let finalTopic = topic;
  if (!finalTopic) {
    // 让LLM生成一个真正随机的话题，而不是从固定列表中选择
    const randomTheme = getRandomElement(RANDOM_THEMES);
    const randomPerspective = getRandomElement(RANDOM_PERSPECTIVES);
    const randomAudience = getRandomElement(RANDOM_AUDIENCES);
    
    const topicPrompt = `Generate a unique, engaging topic for English speaking practice and essay writing. 
Theme: ${randomTheme}
Perspective: ${randomPerspective}
Audience: ${randomAudience}

Generate a topic that is specific, debatable, and interesting for English learners.`;

    try {
      const topicResponse = await llm.call(topicPrompt);
      finalTopic = topicResponse.trim();
    } catch (error) {
      console.error('Error generating topic:', error);
      finalTopic = getRandomElement(RANDOM_TOPICS);
    }
  }

  const prompt = `
  Generate an English article with the following requirements:
  - Topic: ${finalTopic}
  - Theme: ${theme}
  - Length: ${safeLength} words
  - Include a title in English and Chinese
  - Split the article into 5-8 sentences
  - For each sentence, provide an accurate Chinese translation
  - Extract 5-8 key vocabulary words with meanings and example sentences
  
  ${formatInstructions}
  `;

  try {
    // 使用 invoke 方法并传递消息数组
    const response = await llm.invoke([
      { role: 'system', content: 'You are a helpful assistant that generates English learning materials.' },
      { role: 'user', content: prompt }
    ]);
    
    // 从响应中获取内容
    const content = response.content;
    const result = await parser.parse(content);
    
    return NextResponse.json({
      topic: finalTopic,
      ...result
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
