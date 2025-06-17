'use client'

import { useState, useCallback, useEffect } from 'react'

interface SpeechOptions {
  text: string
  rate?: number
  pitch?: number
  voice?: SpeechSynthesisVoice
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)

  // 检查浏览器是否支持语音合成
  useEffect(() => {
    setSupported('speechSynthesis' in window)
  }, [])

  const speak = useCallback(({ text, rate = 1, pitch = 1, voice }: SpeechOptions) => {
    if (!supported) return

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    if (voice) utterance.voice = voice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [supported])

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return {
    speak,
    cancel,
    speaking,
    supported
  }
} 