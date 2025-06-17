'use client'

import { useState } from 'react'
import { useSpeech } from '../hooks/useSpeech'

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

export default function ArticlePanel() {
  const [showChinese, setShowChinese] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1)
  const { speak, speaking, supported } = useSpeech()

  // 模拟数据，实际项目中应该从API获取
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

  const handleSpeak = (text: string) => {
    if (!supported) {
      alert('Your browser does not support speech synthesis.')
      return
    }
    speak({ text, rate: currentSpeed })
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
              <p 
                className={`cursor-pointer hover:bg-gray-50 p-2 rounded ${speaking ? 'bg-gray-50' : ''}`}
                onClick={() => handleSpeak(sentence.english)}
              >
                {sentence.english}
              </p>
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
            <label className="text-sm">Speed:</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={currentSpeed}
              onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm">{currentSpeed}x</span>
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
  )
} 