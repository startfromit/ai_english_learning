'use client'

import { useState, useRef } from 'react'
import { getTTSUrl, TTSEngine } from '../lib/tts'

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

export default function ArticlePanel() {
  const [showChinese, setShowChinese] = useState(false)
  const [engine, setEngine] = useState<TTSEngine>('azure')
  const [currentVoice, setCurrentVoice] = useState(VOICES[0].value)
  const [currentSpeed, setCurrentSpeed] = useState(SPEEDS[1].value)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const audioCache = useRef<Map<string, string>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  const handleSpeak = async (text: string, idx: number) => {
    setLoadingIndex(idx)
    const cacheKey = text + currentVoice + engine + currentSpeed
    let url = audioCache.current.get(cacheKey)
    if (!url) {
      let ttsText = text
      let voice = currentVoice
      let extra: any = {}
      if (engine === 'azure') {
        ttsText = getAzureSsml(text, currentVoice, currentSpeed)
        extra.ssml = true
      }
      url = await getTTSUrl({ text: ttsText, voice, engine, ...extra })
      if (url) audioCache.current.set(cacheKey, url)
    }
    setLoadingIndex(null)
    if (url && audioRef.current) {
      audioRef.current.src = url || ''
      audioRef.current.play()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 文章主体 */}
      <div className="lg:col-span-2 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-2">{article.title}</h1>
          <p className="text-gray-600">Theme: {article.theme}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          {article.sentences.map((sentence, index) => (
            <div key={index} className="mb-6 group">
              <button
                className="cursor-pointer hover:bg-gray-50 p-2 rounded flex items-center"
                onClick={() => handleSpeak(sentence.english, index)}
                disabled={loadingIndex === index}
              >
                {sentence.english}
                {loadingIndex === index && (
                  <span className="ml-2 text-xs text-blue-500">加载中...</span>
                )}
              </button>
              {showChinese && (
                <p className="text-gray-600 mt-2">{sentence.chinese}</p>
              )}
            </div>
          ))}
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
        <audio ref={audioRef} />
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
  )
} 