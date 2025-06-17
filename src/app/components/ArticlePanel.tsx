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

// 只保留美音温柔女声
const VOICE = { label: '美音温柔女声', value: 'en-US-CoraMultilingualNeural' }

const ENGINES: { label: string; value: TTSEngine }[] = [
  { label: '微软Azure', value: 'azure' },
  { label: 'TTSMaker', value: 'ttsmaker' },
]

export default function ArticlePanel() {
  const [showChinese, setShowChinese] = useState(false)
  const [engine, setEngine] = useState<TTSEngine>('azure')
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
    let url = audioCache.current.get(text + VOICE.value + engine)
    if (!url) {
      url = await getTTSUrl({ text, voice: VOICE.value, engine })
      if (url) audioCache.current.set(text + VOICE.value + engine, url)
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

        <div className="flex items-center justify-between mt-8">
          <button
            className="btn btn-primary"
            onClick={() => setShowChinese(!showChinese)}
          >
            {showChinese ? 'Hide Chinese' : 'Show Chinese'}
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-sm">发音风格: {VOICE.label}</span>
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