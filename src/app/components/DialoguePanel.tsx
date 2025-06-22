'use client'

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { getTTSUrl, TTSEngine } from '../lib/tts';

interface DialogueMessage {
  speaker: string;
  english: string;
  chinese: string;
  timestamp: string;
  gender: 'male' | 'female';
}

interface Dialogue {
  title: string;
  topic: string;
  participants: string[];
  messages: DialogueMessage[];
}

interface DialoguePanelProps {
  dialogue: Dialogue;
  isPlayingAll?: boolean;
  playingIndex?: number | null;
}

// Supported voices for different genders
const VOICES = {
  male: 'en-US-AndrewMultilingualNeural',
  female: 'en-US-CoraMultilingualNeural'
};

const DialoguePanel: React.FC<DialoguePanelProps> = ({ 
  dialogue, 
  isPlayingAll = false, 
  playingIndex = null 
}) => {
  const [showChinese, setShowChinese] = useState<{ [key: number]: boolean }>({});
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string | undefined>>(new Map());

  if (!dialogue.messages || dialogue.messages.length === 0) {
    return null;
  }

  // 读取缓存
  function getAudioCache(key: string): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const mem = audioCache.current.get(key);
    if (typeof mem === 'string') return mem;
    const local = localStorage.getItem('audioCache_' + key);
    if (local === null || local === undefined || local === '') return undefined;
    audioCache.current.set(key, local);
    return local;
  }

  // 写入缓存
  function setAudioCache(key: string, url: string) {
    audioCache.current.set(key, url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioCache_' + key, url);
    }
  }

  const handleSpeak = async (text: string, idx: number, gender: 'male' | 'female') => {
    if (loadingIndex !== null) return; // 禁止并发TTS
    setLoadingIndex(idx);
    
    const voice = VOICES[gender];
    const cacheKey = text + voice + 'azure' + 'normal';
    let url: string | null | undefined = getAudioCache(cacheKey);
    
    if (!url) {
      try {
        url = await getTTSUrl({ text, voice, engine: 'azure' });
        if (url) {
          setAudioCache(cacheKey, url);
        }
      } catch (error) {
        console.error('TTS failed:', error);
        setLoadingIndex(null);
        return;
      }
    }

    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onended = () => setLoadingIndex(null);
      audioRef.current.onerror = () => setLoadingIndex(null);
      await audioRef.current.play();
    } else {
      setLoadingIndex(null);
    }
  };

  const toggleChinese = (index: number) => {
    setShowChinese(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto mt-8 overflow-hidden">
      <audio ref={audioRef} />
      
      {/* 对话头部 */}
      <div className="bg-green-500 text-white p-4 text-center">
        <h3 className="text-lg font-semibold">{dialogue.title}</h3>
        <p className="text-sm opacity-90 mt-1">{dialogue.topic}</p>
      </div>
      
      {/* 对话内容区域 */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 h-96 overflow-y-auto">
        <div className="space-y-4">
          {dialogue.messages.map((message, index) => (
            <AnimatePresence key={index}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.speaker === dialogue.participants[0] ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.speaker === dialogue.participants[0] ? 'order-1' : 'order-2'}`}>
                  {/* 头像 */}
                  <div className={`flex items-center mb-1 ${message.speaker === dialogue.participants[0] ? 'justify-start' : 'justify-end'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      message.speaker === dialogue.participants[0] 
                        ? 'bg-blue-500' 
                        : 'bg-green-500'
                    }`}>
                      {message.speaker.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs text-gray-500 ml-2 ${message.speaker === dialogue.participants[0] ? 'order-1' : 'order-2'}`}>
                      {message.speaker}
                    </span>
                  </div>
                  
                  {/* 消息气泡 */}
                  <div className={`rounded-lg p-3 transition-all duration-200 ${
                    message.speaker === dialogue.participants[0]
                      ? isPlayingAll && playingIndex === index
                        ? 'bg-yellow-200 dark:bg-yellow-200/20 text-gray-800 dark:text-gray-200 shadow-lg'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : isPlayingAll && playingIndex === index
                        ? 'bg-yellow-300 dark:bg-yellow-300/20 text-gray-800 dark:text-gray-200 shadow-lg'
                        : 'bg-green-500 text-white'
                  } shadow-sm`}>
                    <div className="text-sm font-medium mb-1">{message.english}</div>
                    <AnimatePresence>
                      {showChinese[index] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`text-xs ${
                            message.speaker === dialogue.participants[0]
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-green-100'
                          }`}
                        >
                          {message.chinese}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className={`flex items-center gap-2 mt-1 ${message.speaker === dialogue.participants[0] ? 'justify-start' : 'justify-end'}`}>
                    <button
                      onClick={() => handleSpeak(message.english, index, message.gender)}
                      disabled={loadingIndex !== null || isPlayingAll}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                      title="播放发音"
                    >
                      {loadingIndex === index ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                      ) : (
                        <SpeakerWaveIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleChinese(index)}
                      disabled={isPlayingAll}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                      title={showChinese[index] ? "隐藏中文" : "显示中文"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-400">
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>
      
      {/* 对话底部 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>参与者: {dialogue.participants.join(' & ')}</span>
          <span>{dialogue.messages.length} 条消息</span>
        </div>
      </div>
    </div>
  );
};

export default DialoguePanel; 