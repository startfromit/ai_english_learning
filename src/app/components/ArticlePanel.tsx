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
  const [showChineseGlobal, setShowChineseGlobal] = useState(false)
  const [showChineseIndex, setShowChineseIndex] = useState<number | null>(null)

  // 用于支持动态更新短文
  const [articleState, setArticle] = useState(article);

  // 拼接英文段落
  const englishParagraph = articleState.sentences.map(s => s.english).join(' ');

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
    setLoadingIndex(idx)
    const cacheKey = text + currentVoice + engine + currentSpeed
    let url = getAudioCache(cacheKey)
    if (!url) {
      let ttsText = text
      let voice = currentVoice
      let extra: any = {}
      if (engine === 'azure') {
        ttsText = getAzureSsml(text, currentVoice, currentSpeed)
        extra.ssml = true
      }
      url = await getTTSUrl({ text: ttsText, voice, engine, ...extra })
      if (url) setAudioCache(cacheKey, url)
    }
    setLoadingIndex(null)
    if (url && audioRef.current) {
      audioRef.current.src = url || ''
      audioRef.current.play()
    }
  }

  // 新增：生成短文
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: customTheme, length: customLength })
      });
      const data = await res.json();
      if (data.sentences && Array.isArray(data.sentences)) {
        setArticle((prev) => ({ ...prev, sentences: data.sentences, theme: customTheme }));
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

  // 主题和长度预设
  const THEME_PRESETS = [
    '科技', '文学', '历史', '生活', '教育', '健康', '艺术', '环境', '经济', '心理'
  ];
  const LENGTH_PRESETS = [100, 150, 200, 250, 300];

  // 只保留一块英文段落展示，采用流式p标签+span方案
  const renderParagraph = () => (
    <p className="text-lg leading-8 font-normal">
      {articleState.sentences.map((s, idx) => (
        <span
          key={idx}
          className="relative group cursor-pointer inline align-baseline"
          style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '1rem' }}
          onMouseEnter={() => setActiveIndex(idx)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {s.english}
          {idx < articleState.sentences.length - 1 && ' '}
          <AnimatePresence>
            {activeIndex === idx && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: -28, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-gray-800 text-white text-sm rounded shadow-lg pointer-events-none select-none whitespace-pre-line max-w-xs text-center"
                style={{ minWidth: 'max-content', maxWidth: 240 }}
              >
                {s.chinese}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {activeIndex === idx && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="ml-1 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  handleSpeak(s.english, idx);
                }}
                title="朗读"
              >
                <SpeakerWaveIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </span>
      ))}
    </p>
  );

  return (
    <div className={themeMode === 'light' ? '' : 'bg-[#2c3e50] text-[#f8f4e9] transition-colors duration-300'}>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 文章主体 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-serif mb-2">{articleState.title}</h1>
              <p className="text-gray-600 dark:text-gray-300">Theme: {articleState.theme}</p>
            </div>
            <div className="flex flex-col gap-2 items-end bg-white/80 dark:bg-[#2c3e50]/80 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 items-center flex-wrap">
                <label className="text-sm text-gray-700 dark:text-gray-200">主题：</label>
                <select
                  className="border rounded px-2 py-1 w-28 bg-gray-50 dark:bg-[#2c3e50] dark:text-[#f8f4e9]"
                  value={customTheme}
                  onChange={e => setCustomTheme(e.target.value)}
                  disabled={generating}
                >
                  {THEME_PRESETS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value={customTheme} hidden>{customTheme}</option>
                </select>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-28 dark:bg-[#2c3e50] dark:text-[#f8f4e9]"
                  value={customTheme}
                  onChange={e => setCustomTheme(e.target.value)}
                  placeholder="自定义主题"
                  disabled={generating}
                />
                <label className="text-sm text-gray-700 dark:text-gray-200 ml-2">长度：</label>
                <select
                  className="border rounded px-2 py-1 w-20 bg-gray-50 dark:bg-[#2c3e50] dark:text-[#f8f4e9]"
                  value={customLength}
                  onChange={e => setCustomLength(Number(e.target.value))}
                  disabled={generating}
                >
                  {LENGTH_PRESETS.map(l => (
                    <option key={l} value={l}>{l}词</option>
                  ))}
                  <option value={customLength} hidden>{customLength}词</option>
                </select>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-20 dark:bg-[#2c3e50] dark:text-[#f8f4e9]"
                  value={customLength}
                  onChange={e => setCustomLength(Number(e.target.value))}
                  min={50}
                  max={500}
                  step={10}
                  placeholder="自定义长度"
                  disabled={generating}
                />
                <button
                  className="btn btn-primary shadow-md"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成短文'}
                </button>
              </div>
            </div>
          </div>

          {/* 英文段落展示区 */}
          <div className="bg-white/90 dark:bg-[#2c3e50]/90 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700 mb-4 transition-all duration-300">
            {renderParagraph()}
          </div>

          <div className="flex items-center justify-between mt-8 flex-wrap gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowChinese(!showChinese)}
            >
              {showChinese ? 'Hide Chinese' : 'Show Chinese'}
            </button>
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <label className="text-sm">声音:</label>
              <select
                value={currentVoice}
                onChange={e => setCurrentVoice(e.target.value)}
                className="border rounded px-2 py-1"
              >
                {VOICES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <label className="text-sm">语速:</label>
              <select
                value={currentSpeed}
                onChange={e => setCurrentSpeed(e.target.value)}
                className="border rounded px-2 py-1"
              >
                {SPEEDS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <label className="text-sm ml-4">TTS引擎:</label>
              <select
                value={engine}
                onChange={e => setEngine(e.target.value as TTSEngine)}
                className="border rounded px-2 py-1"
              >
                {ENGINES.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 词汇表 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-serif mb-4">Vocabulary</h2>
          <div className="space-y-4">
            {article.vocabulary.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="font-bold">{item.word}</h3>
                <p className="text-gray-600">{item.meaning}</p>
                <p className="text-sm italic mt-2">{item.example}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 