'use client'

import React, { useState, useRef, useEffect, useContext } from 'react'
import { getTTSUrl, TTSEngine } from '../lib/tts'
import { motion, AnimatePresence } from 'framer-motion'
import { SpeakerWaveIcon, EyeIcon } from '@heroicons/react/24/outline'
import { ThemeContext } from './ThemeProvider'

interface Sentence {
  english: string
  chinese: string
}

interface Article {
  title: string
  theme: string
  sentences: Sentence[]
  vocabulary: {
    word: string
    meaning: string
    example: string
  }[]
}

// 支持两个声音
const VOICES = [
  { label: '美音温柔女声', value: 'en-US-CoraMultilingualNeural' },
  { label: '美音温柔男声', value: 'en-US-AndrewMultilingualNeural' },
]

const SPEEDS = [
  { label: '慢', value: 'slow' },
  { label: '正常', value: 'normal' },
  { label: '快', value: 'fast' },
]

const ENGINES: { label: string; value: TTSEngine }[] = [
  { label: '微软Azure', value: 'azure' },
  { label: 'TTSMaker', value: 'ttsmaker' },
]

function getAzureSsml(text: string, voice: string, speed: string) {
  let rate = '0%';
  if (speed === 'slow') rate = '-25%';
  else if (speed === 'fast') rate = '+25%';
  // Azure SSML 语速
  return `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'><prosody rate='${rate}'>${text}</prosody></voice></speak>`;
}

// 模拟数据
const article: Article = {
  title: "The Quantum Revolution",
  theme: "Technology",
  sentences: [
    {
      english: "Quantum computing represents a paradigm shift in computational power.",
      chinese: "量子计算代表了计算能力的范式转变。"
    },
    {
      english: "Unlike classical computers that use bits, quantum computers use qubits.",
      chinese: "与使用比特的经典计算机不同，量子计算机使用量子比特。"
    }
  ],
  vocabulary: [
    {
      word: "paradigm",
      meaning: "a typical example or pattern of something",
      example: "This discovery represents a paradigm shift in our understanding of physics."
    }
  ]
}

// 随机话题池（与后端保持同步，建议后续可API获取）
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

export default function ArticlePanel() {
  const [showChinese, setShowChinese] = useState(false)
  const [engine, setEngine] = useState<TTSEngine>('azure')
  const [currentVoice, setCurrentVoice] = useState(VOICES[0].value)
  const [currentSpeed, setCurrentSpeed] = useState(SPEEDS[1].value)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const audioCache = useRef<Map<string, string | undefined>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customTheme, setCustomTheme] = useState(article.theme)
  const [customLength, setCustomLength] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('customLength');
      if (cached) {
        const n = Number(cached);
        if (!isNaN(n) && n >= 100 && n <= 500) return n;
      }
    }
    return 200;
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customLength', String(customLength));
    }
  }, [customLength]);
  const articleRef = useRef<HTMLDivElement | null>(null)
  const { themeMode, setThemeMode } = useContext(ThemeContext) as { themeMode: 'light' | 'dark', setThemeMode: (mode: 'light' | 'dark') => void }
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showBubbleIndex, setShowBubbleIndex] = useState<number | null>(null)
  const [bubblePos, setBubblePos] = useState<{x: number, y: number, absLeft: number, absTop: number} | null>(null)
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null)
  const [showChineseGlobal, setShowChineseGlobal] = useState(false)
  const [showChineseIndex, setShowChineseIndex] = useState<number | null>(null)
  const [customTopic, setCustomTopic] = useState('');

  const [articleState, setArticle] = useState<Article>(article)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('lastArticle');
      if (cached) {
        try {
          setArticle(JSON.parse(cached));
        } catch {}
      }
    }
  }, []);

  // 拼接英文段落
  const englishParagraph = articleState.sentences.map((s: Sentence) => s.english).join(' ');

  // 读取缓存（优先 localStorage）
  function getAudioCache(key: string): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const mem = audioCache.current.get(key);
    if (typeof mem === 'string') return mem;
    const local = localStorage.getItem('audioCache_' + key);
    if (local === null || local === undefined || local === '') return undefined;
    audioCache.current.set(key, local);
    return local;
  }

  // 写入缓存（内存+localStorage）
  function setAudioCache(key: string, url: string) {
    audioCache.current.set(key, url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioCache_' + key, url);
    }
  }

  const handleSpeak = async (text: string, idx: number) => {
    if (loadingIndex !== null) return; // 禁止并发TTS
    setLoadingIndex(idx);
    const cacheKey = text + currentVoice + engine + currentSpeed;
    let url: string | null | undefined = getAudioCache(cacheKey);
    if (!url) {
      let ttsText = text;
      let voice = currentVoice;
      let extra: any = {};
      if (engine === 'azure') {
        ttsText = getAzureSsml(text, currentVoice, currentSpeed);
        extra.ssml = true;
      }
      url = await getTTSUrl({ text: ttsText, voice, engine, ...extra });
      if (url) setAudioCache(cacheKey, url);
    }
    setLoadingIndex(null);
    if (audioRef.current) {
      audioRef.current.src = typeof url === 'string' && url ? url : '';
      audioRef.current.play();
    }
  };

  // 页面刷新时随机抽取6个推荐话题
  function getRandomTopics(arr: string[], n: number) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }
  const [topicSuggests, setTopicSuggests] = useState<string[]>([]);
  useEffect(() => {
    setTopicSuggests(getRandomTopics(RANDOM_TOPICS, 6));
  }, []);

  // 只保留一块英文段落展示，采用流式p标签+span方案，悬浮时句子加若有若无的虚线下划线，点击即可朗读，气泡跟随鼠标，消失有延迟
  const handleMouseEnter = (idx: number) => {
    setActiveIndex(idx);
    setShowBubbleIndex(idx);
  };
  const handleMouseLeave = () => {
    setShowBubbleIndex(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>, idx: number) => {
    if (activeIndex === idx) {
      if (bubbleTimer.current) {
        clearTimeout(bubbleTimer.current);
        bubbleTimer.current = null;
      }
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setBubblePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        absLeft: rect.left + window.scrollX,
        absTop: rect.top + window.scrollY
      });
    }
  };

  // 整体播放相关状态
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const playAllAbortRef = useRef<{aborted: boolean}>({aborted: false});

  // 顺序播放所有句子
  const handlePlayAll = async () => {
    if (isPlayingAll) {
      // 停止播放
      playAllAbortRef.current.aborted = true;
      setIsPlayingAll(false);
      setPlayingIndex(null);
      if (audioRef.current) audioRef.current.pause();
      return;
    }
    playAllAbortRef.current.aborted = false;
    setIsPlayingAll(true);
    setPlayingIndex(0);

    // 1. 生成所有音频Promise（有缓存的直接resolve，没有缓存的并发TTS）
    const audioPromises = articleState.sentences.map((s, i) => {
      const cacheKey = s.english + currentVoice + engine + currentSpeed;
      const cached = getAudioCache(cacheKey);
      if (cached) return Promise.resolve(cached);
      let ttsText = s.english;
      let voice = currentVoice;
      let extra: any = {};
      if (engine === 'azure') {
        ttsText = getAzureSsml(s.english, currentVoice, currentSpeed);
        extra.ssml = true;
      }
      return getTTSUrl({ text: ttsText, voice, engine, ...extra }).then(url => {
        if (url) setAudioCache(cacheKey, url);
        return url || '';
      });
    });

    // 2. 顺序播放（边播边等）
    for (let i = 0; i < audioPromises.length; i++) {
      if (playAllAbortRef.current.aborted) break;
      setPlayingIndex(i);
      const url = await audioPromises[i];
      if (audioRef.current) {
        audioRef.current.src = typeof url === 'string' ? url : '';
        audioRef.current.play();
        try {
          await new Promise<void>((resolve, reject) => {
            const onEnded = () => {
              audioRef.current?.removeEventListener('ended', onEnded);
              audioRef.current?.removeEventListener('pause', onPause);
              resolve();
            };
            const onPause = () => {
              audioRef.current?.removeEventListener('ended', onEnded);
              audioRef.current?.removeEventListener('pause', onPause);
              resolve();
            };
            audioRef.current?.addEventListener('ended', onEnded);
            audioRef.current?.addEventListener('pause', onPause);
            audioRef.current?.play();
          });
        } catch {}
      }
    }
    setIsPlayingAll(false);
    setPlayingIndex(null);
  };

  // 播放时切换语音/语速/内容时自动停止整体播放
  useEffect(() => {
    if (isPlayingAll) {
      playAllAbortRef.current.aborted = true;
      setIsPlayingAll(false);
      setPlayingIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVoice, engine, currentSpeed, articleState]);

  const renderParagraph = () => (
    <p className="text-lg leading-8 font-normal">
      {articleState.sentences.map((s: Sentence, idx: number) => (
        <span
          key={idx}
          className={`relative group cursor-pointer inline align-baseline transition-all duration-150 ${activeIndex === idx ? 'border-b border-dashed border-indigo-300/50' : ''}`}
          style={{
            fontFamily: 'inherit',
            fontWeight: 400,
            fontSize: '1rem',
            cursor: loadingIndex !== null ? 'not-allowed' : isPlayingAll ? 'not-allowed' : 'pointer',
            borderBottomWidth: activeIndex === idx ? 1 : 0,
            pointerEvents: (loadingIndex !== null && loadingIndex !== idx) || isPlayingAll ? 'none' : 'auto',
            background: isPlayingAll && playingIndex === idx ? 'rgba(129,140,248,0.12)' : undefined
          }}
          onMouseEnter={() => handleMouseEnter(idx)}
          onMouseLeave={handleMouseLeave}
          onMouseMove={e => handleMouseMove(e, idx)}
          onClick={e => {
            e.stopPropagation();
            if (loadingIndex === null && !isPlayingAll) handleSpeak(s.english, idx);
          }}
        >
          {s.english}
          {/* loading 动画 */}
          {loadingIndex === idx && (
            <span className="absolute -top-5 right-0 z-50">
              <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          )}
          {isPlayingAll && playingIndex === idx && (
            <span className="absolute -top-5 left-0 z-50">
              <svg className="animate-pulse h-4 w-4 text-indigo-500" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M10 8l6 4-6 4V8z" />
              </svg>
            </span>
          )}
          {idx < articleState.sentences.length - 1 && ' '}
          <AnimatePresence>
            {showBubbleIndex === idx && bubblePos && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                className="fixed z-50 px-3 py-1 bg-gray-800 text-white text-sm rounded shadow-lg pointer-events-none select-none whitespace-pre-line max-w-xs text-left"
                style={{
                  left: bubblePos.absLeft + bubblePos.x + 8,
                  top: bubblePos.absTop + bubblePos.y + 24,
                  minWidth: 'max-content',
                  maxWidth: 320,
                  width: 'max-content',
                  transform: 'translate(-50%, 0)'
                }}
              >
                {s.chinese}
              </motion.div>
            )}
          </AnimatePresence>
        </span>
      ))}
    </p>
  );

  // 支持自定义话题和随机生成
  const handleGenerate = async (mode: 'custom' | 'random') => {
    setGenerating(true);
    try {
      const body: any = { length: customLength };
      if (mode === 'custom') {
        body.topic = customTopic.trim();
      } else if (mode === 'random') {
        body.topic = '';
      }
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.sentences && Array.isArray(data.sentences) && data.title) {
        const newArticle = { ...articleState, sentences: data.sentences, theme: '', title: data.title };
        setArticle(newArticle);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastArticle', JSON.stringify(newArticle));
        }
        setTimeout(() => {
          articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        alert(data.error || '生成失败');
      }
    } catch (e) {
      alert('生成失败');
    }
    setGenerating(false);
  }

  return (
    <div className={themeMode === 'light' ? 'bg-[#f8f4e9] text-gray-900' : 'bg-[#181c23] text-gray-100 transition-colors duration-300'}>
      <audio ref={audioRef} />
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto">
        {/* 左侧主区 */}
        <div className="flex-1 flex flex-col items-center">
          {/* 操作区卡片 */}
          <div className="bg-white dark:bg-[#23272f] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow w-full max-w-2xl mb-6 flex flex-col items-center">
            <div className="w-full flex flex-col gap-4">
              {/* 仅自定义话题输入区 */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm text-gray-700 dark:text-gray-200">自定义话题：</label>
                <input
                  type="text"
                  className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 w-full bg-white dark:bg-[#23272f] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder="如：人工智能的未来 | 量子计算的应用 ..."
                  disabled={generating}
                  style={{ fontStyle: customTopic ? 'normal' : 'italic' }}
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {topicSuggests.map(sug => (
                    <button
                      key={sug}
                      type="button"
                      className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-800 border border-gray-200 dark:border-gray-600 transition"
                      onClick={() => setCustomTopic(sug)}
                      disabled={generating}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400 mt-1">可以输入具体话题，如"{topicSuggests[0]}"</span>
              </div>
              {/* 长度+按钮 */}
              <div className="flex flex-col gap-2 w-full mt-2">
                <div className="flex items-center whitespace-nowrap gap-2 w-full">
                  <label className="text-sm text-gray-700 dark:text-gray-200 mr-2 whitespace-nowrap">长度：</label>
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={10}
                    value={customLength}
                    onChange={e => setCustomLength(Number(e.target.value))}
                    disabled={generating}
                    className="accent-indigo-500 max-w-xs w-full bg-white dark:bg-[#23272f]"
                    style={{ minWidth: 120 }}
                  />
                  <span className="ml-2 text-base font-semibold w-12 text-center select-none bg-gray-100 dark:bg-[#23272f] text-gray-900 dark:text-gray-100 rounded px-2 py-0.5 border border-gray-200 dark:border-gray-700">{customLength}</span>
                </div>
                <div className="flex gap-2 justify-end min-w-fit w-full mt-2">
                  <button
                    className="btn btn-primary shadow-md px-6 py-2 text-base rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                    onClick={() => handleGenerate('custom')}
                    disabled={generating || !customTopic.trim()}
                  >
                    {generating ? '生成中...' : '生成短文'}
                  </button>
                  <button
                    className="btn btn-secondary shadow-md px-6 py-2 text-base rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-indigo-50 transition disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleGenerate('random')}
                    disabled={generating}
                  >
                    随机生成
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* 内容区卡片：标题+短文 */}
          <div className="bg-white dark:bg-[#23272f] border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow mb-4 transition-all duration-300 w-full max-w-2xl flex flex-col items-center">
            <h1 className="text-3xl font-serif text-serif text-center mb-2 text-gray-900 dark:text-white drop-shadow">{articleState.title}</h1>
            <div className="w-full mt-2 text-gray-900 dark:text-gray-100">{renderParagraph()}</div>
          </div>
          {/* 整体播放按钮 */}
          <div className="flex justify-end w-full max-w-2xl mb-2">
            <button
              className={`btn btn-primary px-4 py-1 rounded shadow flex items-center gap-2 ${isPlayingAll ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition disabled:opacity-60`}
              onClick={handlePlayAll}
              disabled={generating || articleState.sentences.length === 0}
            >
              {isPlayingAll ? (
                <>
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  停止播放
                </>
              ) : (
                <>
                  <SpeakerWaveIcon className="w-4 h-4" />
                  整体播放
                </>
              )}
            </button>
            {isPlayingAll && playingIndex !== null && (
              <span className="ml-4 text-sm text-gray-500">正在播放第 {playingIndex + 1} / {articleState.sentences.length} 句</span>
            )}
          </div>
        </div>
        {/* 词汇表区 */}
        <div className="w-full lg:w-80 bg-white dark:bg-[#23272f] border border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-sm min-h-[320px] flex flex-col">
          <h2 className="text-xl font-serif text-serif mb-4 text-gray-900 dark:text-white">Vocabulary</h2>
          {articleState.vocabulary && articleState.vocabulary.length > 0 ? (
            <div className="space-y-4">
              {articleState.vocabulary.map((item, index) => (
                <div key={index} className="border-b pb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.word}</h3>
                  <p className="text-gray-600 dark:text-gray-100">{item.meaning}</p>
                  <p className="text-sm italic mt-2 text-gray-400 dark:text-gray-400">{item.example}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 dark:text-gray-400 text-sm text-center mt-8">暂无重点词汇</div>
          )}
        </div>
      </div>
      <div className="flex justify-end mb-2">
        <button
          className="btn btn-primary px-3 py-1 text-xs rounded shadow"
          onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
        >
          {themeMode === 'light' ? '切换深色' : '切换浅色'}
        </button>
      </div>
    </div>
  )
} 