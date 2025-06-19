'use client'

import { useState, useRef, useEffect } from 'react'
import { getTTSUrl, TTSEngine } from '../lib/tts'
import { motion, AnimatePresence } from 'framer-motion'
import { SpeakerWaveIcon, EyeIcon } from '@heroicons/react/24/outline'

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

export default function ArticlePanel() {
  const [showChinese, setShowChinese] = useState(false)
  const [engine, setEngine] = useState<TTSEngine>('azure')
  const [currentVoice, setCurrentVoice] = useState(VOICES[0].value)
  const [currentSpeed, setCurrentSpeed] = useState(SPEEDS[1].value)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const audioCache = useRef<Map<string, string>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customTheme, setCustomTheme] = useState(article.theme)
  const [customLength, setCustomLength] = useState(200)
  const articleRef = useRef<HTMLDivElement | null>(null)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showBubbleIndex, setShowBubbleIndex] = useState<number | null>(null)
  const [bubblePos, setBubblePos] = useState<{x: number, y: number, absLeft: number, absTop: number} | null>(null)
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null)
  const [showChineseGlobal, setShowChineseGlobal] = useState(false)
  const [showChineseIndex, setShowChineseIndex] = useState<number | null>(null)

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
    if (mem) return mem;
    const local = localStorage.getItem('audioCache_' + key);
    if (local) {
      audioCache.current.set(key, local);
      return local;
    }
    return undefined;
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
    let url = getAudioCache(cacheKey);
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
    if (url && audioRef.current) {
      audioRef.current.src = url || '';
      audioRef.current.play();
    }
  };

  // 主题和长度预设
  const THEME_PRESETS = [
    { zh: '科技', en: 'Technology' },
    { zh: '文学', en: 'Literature' },
    { zh: '历史', en: 'History' },
    { zh: '生活', en: 'Life' },
    { zh: '教育', en: 'Education' },
    { zh: '健康', en: 'Health' },
    { zh: '艺术', en: 'Art' },
    { zh: '环境', en: 'Environment' },
    { zh: '经济', en: 'Economy' },
    { zh: '心理', en: 'Psychology' },
  ];
  const TOPIC_SUGGESTS = [
    '人工智能的未来',
    '量子计算的应用',
    '可持续能源',
    '数字健康',
    '虚拟现实',
    '太空探索',
    '智能家居',
    '区块链技术',
    '脑机接口',
    '自动驾驶'
  ];
  const LENGTH_PRESETS = [100, 150, 200, 250, 300];
  const [customTopic, setCustomTopic] = useState('');

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
            cursor: loadingIndex !== null ? 'not-allowed' : 'pointer',
            borderBottomWidth: activeIndex === idx ? 1 : 0,
            pointerEvents: loadingIndex !== null && loadingIndex !== idx ? 'none' : 'auto'
          }}
          onMouseEnter={() => handleMouseEnter(idx)}
          onMouseLeave={handleMouseLeave}
          onMouseMove={e => handleMouseMove(e, idx)}
          onClick={e => {
            e.stopPropagation();
            if (loadingIndex === null) handleSpeak(s.english, idx);
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: customTheme, topic: customTopic, length: customLength })
      });
      const data = await res.json();
      if (data.sentences && Array.isArray(data.sentences) && data.title) {
        const newArticle = { ...articleState, sentences: data.sentences, theme: customTheme, title: data.title };
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
    <div className={themeMode === 'light' ? '' : 'bg-[#2c3e50] text-[#f8f4e9] transition-colors duration-300'}>
      <audio ref={audioRef} />
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto">
        {/* 左侧主区 */}
        <div className="flex-1 flex flex-col items-center">
          {/* 操作区卡片 */}
          <div className="bg-white/90 dark:bg-[#2c3e50]/90 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700 w-full max-w-2xl mb-6 flex flex-col items-center">
            <div className="w-full flex flex-col gap-4">
              {/* 主题+话题 */}
              <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                <div className="flex gap-2 items-center w-full md:w-1/2">
                  <label className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">主题：</label>
                  <select
                    className="border rounded px-2 py-1 w-full bg-gray-50 dark:bg-[#2c3e50] dark:text-[#f8f4e9] focus:ring-2 focus:ring-indigo-300"
                    value={customTheme}
                    onChange={e => setCustomTheme(e.target.value)}
                    disabled={generating}
                  >
                    {THEME_PRESETS.map(t => (
                      <option key={t.en} value={t.en}>{t.zh}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col w-full md:w-1/2">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full dark:bg-[#2c3e50] dark:text-[#f8f4e9] focus:ring-2 focus:ring-indigo-300"
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    placeholder="如：人工智能的未来 | 量子计算的应用 ..."
                    disabled={generating}
                    style={{ fontStyle: customTopic ? 'normal' : 'italic', color: customTopic ? undefined : '#aaa' }}
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {TOPIC_SUGGESTS.slice(0, 4).map(sug => (
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
                  <span className="text-xs text-gray-400 mt-1">可以输入具体话题，如"{TOPIC_SUGGESTS[0]}"</span>
                </div>
              </div>
              {/* 长度+按钮 */}
              <div className="flex flex-col md:flex-row gap-3 items-center w-full justify-between mt-2">
                <div className="flex gap-2 items-center">
                  <label className="text-sm text-gray-700 dark:text-gray-200">长度：</label>
                  <select
                    className="border rounded px-2 py-1 w-24 bg-gray-50 dark:bg-[#2c3e50] dark:text-[#f8f4e9] focus:ring-2 focus:ring-indigo-300"
                    value={customLength}
                    onChange={e => setCustomLength(Number(e.target.value))}
                    disabled={generating}
                  >
                    {LENGTH_PRESETS.map(l => (
                      <option key={l} value={l}>{l}词</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20 dark:bg-[#2c3e50] dark:text-[#f8f4e9] focus:ring-2 focus:ring-indigo-300"
                    value={customLength}
                    onChange={e => setCustomLength(Number(e.target.value))}
                    min={50}
                    max={500}
                    step={10}
                    placeholder="自定义长度"
                    disabled={generating}
                  />
                </div>
                <button
                  className="btn btn-primary shadow-md px-6 py-2 text-base rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成短文'}
                </button>
              </div>
            </div>
          </div>
          {/* 内容区卡片：标题+短文 */}
          <div className="bg-white/90 dark:bg-[#2c3e50]/90 rounded-xl p-8 shadow border border-gray-100 dark:border-gray-700 mb-4 transition-all duration-300 w-full max-w-2xl flex flex-col items-center">
            <h1 className="text-3xl font-serif text-center mb-2">{articleState.title}</h1>
            <p className="text-gray-500 text-center mb-6 text-base">Theme: {articleState.theme}</p>
            <div className="w-full mt-2">{renderParagraph()}</div>
          </div>
        </div>
        {/* 词汇表区 */}
        <div className="w-full lg:w-80 bg-white p-6 rounded-lg shadow-sm min-h-[320px] flex flex-col">
          <h2 className="text-xl font-serif mb-4">Vocabulary</h2>
          {articleState.vocabulary && articleState.vocabulary.length > 0 ? (
            <div className="space-y-4">
              {articleState.vocabulary.map((item, index) => (
                <div key={index} className="border-b pb-4">
                  <h3 className="font-bold">{item.word}</h3>
                  <p className="text-gray-600">{item.meaning}</p>
                  <p className="text-sm italic mt-2">{item.example}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm text-center mt-8">暂无重点词汇</div>
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
        <button
          className={`ml-2 px-3 py-1 text-xs rounded shadow border ${showChineseGlobal ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}
          onClick={() => setShowChineseGlobal(v => !v)}
        >
          {showChineseGlobal ? '隐藏全部中文' : '显示全部中文'}
        </button>
      </div>
    </div>
  )
} 