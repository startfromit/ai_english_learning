import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const { topic = '', theme = '科技', length = 200 } = req.body;
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

  // 丰富多元的高质量随机话题池（涵盖科技、社会、成长、情感、生活、流行、体育、艺术等，贴近年轻人兴趣）
  const RANDOM_TOPICS = [
    // 科技与社会
    '人工智能如何改变我们的生活',
    '气候变化与可持续发展',
    '数字时代的隐私与安全',
    '未来教育的创新模式',
    '太空探索与人类未来',
    '虚拟现实与增强现实的应用',
    '基因编辑的伦理与前景',
    '全球化与文化多样性',
    '机器人与自动化的未来',
    '数字货币与金融创新',
    '城市化与智慧城市',
    '可再生能源的挑战与机遇',
    '无人驾驶汽车的社会影响',
    '大数据与人工智能伦理',
    '生态保护与生物多样性',
    '数字艺术与创意表达',
    '数字娱乐与青少年成长',
    '未来农业与食品安全',
    '数字经济与就业变革',
    '科技与环境保护',
    // 青年成长与情感
    '如何建立自信心',
    '友谊在成长中的作用',
    '如何应对学业压力',
    '青春期的自我认同',
    '梦想与现实的平衡',
    '如何管理时间和拖延',
    '失败的意义与成长',
    '如何与父母有效沟通',
    '大学生活的挑战与机遇',
    '如何面对孤独与焦虑',
    '自我提升的有效方法',
    '如何制定人生目标',
    '情感表达与情绪管理',
    '如何建立健康的恋爱关系',
    '社交恐惧与自我突破',
    // 生活方式与流行文化
    '极简主义生活的利与弊',
    '数字时代的社交方式',
    '网络热点对青年的影响',
    '宠物对生活的积极作用',
    '旅行如何开阔视野',
    '志愿服务的意义',
    '环保生活小妙招',
    '如何理性消费',
    '时尚潮流与自我表达',
    '美食与健康饮食习惯',
    '如何平衡学习与娱乐',
    '追星文化的利与弊',
    '短视频平台对青少年的影响',
    '如何选择合适的运动方式',
    '音乐在生活中的作用',
    '影视作品对价值观的影响',
    '如何培养阅读习惯',
    '网络游戏与青少年成长',
    '校园生活的趣事',
    '如何应对网络暴力',
    // 体育与健康
    '团队运动的乐趣',
    '如何保持身心健康',
    '运动习惯的养成',
    '体育精神与人生',
    '户外运动的魅力',
    '健康饮食与健身',
    // 艺术与创造力
    '如何培养创造力',
    '绘画与自我表达',
    '摄影记录生活',
    '舞蹈与自信心提升',
    '写作的乐趣',
    '手工艺与减压',
    // 其它多元话题
    '多语言学习的挑战与收获',
    '志愿服务的经历分享',
    '环保行动从我做起',
    '如何面对失败与挫折',
    '理想职业的探索',
    '未来世界的想象',
    '人与自然的和谐共处',
    '网络时代的诚信问题',
    '如何成为更好的自己',
    '校园社团的意义',
    '如何管理个人财务',
    '独立生活的第一步',
    '如何高效学习外语',
    '数字时代的隐私保护',
    '如何应对信息过载',
    '自媒体时代的表达与责任',
    '如何建立良好的人际关系',
    '梦想清单与人生规划',
    '如何面对毕业与就业压力',
    '公益活动的社会价值',
    '如何培养批判性思维',
    '网络购物的利与弊',
    '如何应对生活中的不确定性',
    '家庭与个人成长',
    '如何规划一次难忘的旅行',
    '宠物与心理健康',
    '如何在团队中发挥作用',
    '校园恋爱的甜与苦',
    '如何应对考试焦虑',
    '网络流行语的社会影响',
    '如何成为时间管理达人',
    '自我激励的方法',
    '如何在逆境中成长',
    '数字时代的友情',
    '如何选择未来的职业方向',
    '环保时尚的兴起',
    '如何在社交媒体上保护自己',
    '校园欺凌的应对策略',
    '如何培养领导力',
    '数字时代的学习工具',
    '如何应对生活压力',
    '网络直播的兴起与影响',
    '如何成为更有创造力的人',
    '校园活动的组织与参与',
    '如何建立积极的生活态度',
    '数字时代的自我管理',
    '如何在多元文化中成长',
    '网络社交的利与弊',
    '如何培养独立思考能力',
    '校园生活的美好回忆',
    '如何面对成长中的困惑',
    '数字时代的表达自由',
    '如何成为更好的倾听者',
    '校园志愿服务的意义',
    '如何在压力中保持乐观',
    '数字时代的个人品牌',
    '如何规划大学生活',
    '校园文化节的趣事',
    '如何在团队中合作共赢',
    '数字时代的创新创业',
    '如何应对网络谣言',
    '校园生活的多彩瞬间',
    '如何培养自律习惯',
    '数字时代的学习挑战',
    '如何在失败中找到机会',
    '校园友谊的珍贵',
    '如何成为更有影响力的人',
    '数字时代的生活智慧',
    '如何在变化中保持自我',
    '校园生活的成长故事',
    '如何面对未来的不确定性',
    '数字时代的幸福感',
    '如何在生活中发现美好',
    '校园生活的点滴收获',
    '如何成为更有责任感的人',
    '数字时代的自我提升',
    '如何在团队中发挥特长',
    '校园生活的温馨瞬间',
    '如何在数字时代保持真实',
    '数字时代的友情与信任',
    '如何在生活中保持好奇心',
    '校园生活的感动时刻',
    '如何成为更有爱心的人',
    '数字时代的成长与挑战',
    '如何在生活中实现自我价值',
    '校园生活的美好回忆',
    '如何在数字时代保持独立思考',
    '数字时代的梦想与追求',
    '如何在生活中保持积极心态',
    '校园生活的点滴成长',
    '如何成为更有创造力的青年',
    '数字时代的自我管理与成长',
    '如何在生活中实现梦想',
    '校园生活的美好瞬间',
    '如何在数字时代保持自信',
    '数字时代的青春与成长',
    '如何在生活中发现自我',
    '校园生活的成长点滴',
    '如何成为更有担当的人',
    '数字时代的自我成长',
    '如何在生活中保持热情',
    '校园生活的美好故事',
    '如何在数字时代实现自我价值',
  ];
  let finalTopic = topic;
  if (!finalTopic) {
    // 让LLM生成一个真正随机的话题，而不是从固定列表中选择
    const randomThemes = [
      'technology and innovation', 'environmental issues', 'social media and communication', 
      'education and learning', 'health and wellness', 'travel and culture', 'food and cooking',
      'sports and fitness', 'arts and creativity', 'business and entrepreneurship', 
      'science and discovery', 'relationships and psychology', 'fashion and lifestyle',
      'music and entertainment', 'politics and society', 'nature and wildlife',
      'space and astronomy', 'history and heritage', 'language and communication',
      'work and career', 'family and parenting', 'friendship and social life',
      'personal development', 'global issues', 'local community', 'hobbies and interests',
      'transportation and mobility', 'architecture and design', 'literature and writing',
      'philosophy and ethics', 'economics and finance', 'medicine and healthcare',
      'agriculture and farming', 'energy and sustainability', 'crime and justice',
      'religion and spirituality', 'gender and equality', 'aging and retirement',
      'youth and adolescence', 'disability and inclusion', 'immigration and diversity'
    ];
    
    const randomTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];
    const randomPerspective = ['positive', 'negative', 'neutral', 'controversial', 'innovative', 'traditional'][Math.floor(Math.random() * 6)];
    const randomAudience = ['teenagers', 'young adults', 'students', 'professionals', 'parents', 'seniors'][Math.floor(Math.random() * 6)];
    
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
      content: `请用英文写一篇英文部分不少于${safeLength}词的短文，话题为"${finalTopic}"。请将英文内容拆分为句子，每句后面加上精准的中文翻译，并给短文拟一个简洁、准确的英文标题。输出如下结构的JSON对象：\n{\n  \"title\": \"...\",\n  \"sentences\": [\n    {\"english\": \"...\", \"chinese\": \"...\"},\n    ...\n  ]\n}\n请严格按照上述JSON结构输出，不要加任何多余内容。${formatInstructions}`,
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