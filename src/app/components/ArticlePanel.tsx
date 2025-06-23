'use client'

import React, { useState, useRef, useEffect, useContext } from 'react'
import { getTTSUrl, TTSEngine } from '../lib/tts'
import { motion, AnimatePresence } from 'framer-motion'
import { SpeakerWaveIcon, EyeIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { ThemeContext } from './ThemeProvider'
import TypeIt from "typeit-react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import LoginModal from './LoginModal';
import DialoguePanel from './DialoguePanel';
import { RANDOM_TOPICS, getRandomTopics } from '@/lib/topics';
import { useTranslation } from 'react-i18next'
import { getRandomArticle, getRandomDialogue } from '@/lib/content'

interface Sentence {
  english: string
  chinese: string
}

interface VocabularyItem {
  word: string;
  meaning_en: string;
  meaning_zh: string;
  example: string;
}

interface DialogueMessage {
  speaker: string
  english: string
  chinese: string
  timestamp: string
  gender: 'male' | 'female'
}

interface Dialogue {
  title: string
  title_chinese: string;
  topic: string
  participants: string[]
  messages: DialogueMessage[]
  vocabulary: VocabularyItem[];
}

interface Article {
  title: string
  title_chinese: string;
  theme: string
  sentences: Sentence[]
  vocabulary: VocabularyItem[];
}

// Supported voices
const VOICES = [
  { label: 'US English Female', value: 'en-US-CoraMultilingualNeural' },
  { label: 'US English Male', value: 'en-US-AndrewMultilingualNeural' },
]

const SPEEDS = [
  { label: 'Slow', value: 'slow' },
  { label: 'Normal', value: 'normal' },
  { label: 'Fast', value: 'fast' },
]

const ENGINES: { label: string; value: TTSEngine }[] = [
  { label: 'Microsoft Azure', value: 'azure' },
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
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showChinese, setShowChinese] = useState(false)
  const [engine, setEngine] = useState<TTSEngine>('azure')
  const [currentVoice, setCurrentVoice] = useState(VOICES[0].value)
  const [currentSpeed, setCurrentSpeed] = useState(SPEEDS[1].value)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const audioCache = useRef<Map<string, string | undefined>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customLength, setCustomLength] = useState(300);
  const [placeholder, setPlaceholder] = useState(RANDOM_TOPICS[0]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState(t('loginRequired'));
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  
  // Initialize customLength from localStorage after mount
  useEffect(() => {
    const cached = localStorage.getItem('customLength');
    if (cached) {
      const n = Number(cached);
      if (!isNaN(n) && n >= 100 && n <= 500) {
        setCustomLength(n);
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customLength', String(customLength));
    }
  }, [customLength]);
  const articleRef = useRef<HTMLDivElement | null>(null)
  const { themeMode, setThemeMode } = useContext(ThemeContext) as { themeMode: 'light' | 'dark', setThemeMode: (mode: 'light' | 'dark') => void }
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTitleChinese, setShowTitleChinese] = useState(false);
  const [showBubbleIndex, setShowBubbleIndex] = useState<number | null>(null)
  const [bubblePos, setBubblePos] = useState<{x: number, y: number, absLeft: number, absTop: number} | null>(null)
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null)
  const [showChineseGlobal, setShowChineseGlobal] = useState(false)
  const [showChineseIndex, setShowChineseIndex] = useState<number | null>(null)
  const [customTopic, setCustomTopic] = useState('');
  const [contentType, setContentType] = useState<'article' | 'dialogue'>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('contentType');
      return (cached === 'article' || cached === 'dialogue') ? cached : 'article';
    }
    return 'article';
  });
  const [dialogueStyle, setDialogueStyle] = useState<'casual' | 'business' | 'social'>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('dialogueStyle');
      return (cached === 'casual' || cached === 'business' || cached === 'social') ? cached : 'casual';
    }
    return 'casual';
  });

  // 使用预制内容初始化
  const [articleState, setArticle] = useState<Article>(() => {
    const defaultArticle = getRandomArticle();
    return defaultArticle;
  });
  const [dialogueState, setDialogue] = useState<Dialogue>(() => {
    const defaultDialogue = getRandomDialogue();
    return defaultDialogue;
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('lastArticle');
      if (cached) {
        try {
          setArticle(JSON.parse(cached));
        } catch {}
      }
      
      // 加载保存的对话数据
      const cachedDialogue = localStorage.getItem('lastDialogue');
      if (cachedDialogue) {
        try {
          setDialogue(JSON.parse(cachedDialogue));
        } catch {}
      }
    }
  }, []);

  // 保存内容类型选择到本地存储
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contentType', contentType);
    }
  }, [contentType]);

  // 保存对话风格选择到本地存储
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dialogueStyle', dialogueStyle);
    }
  }, [dialogueStyle]);

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
    if (loading) {
      setLoginModalMessage(t('userLoading'));
      setShowLoginModal(true);
      return;
    }
    if (!user) {
      setLoginModalMessage(t('loginRequired'));
      setShowLoginModal(true);
      return;
    }
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
  const [topicSuggests, setTopicSuggests] = useState<string[]>([]);
  useEffect(() => {
    setTopicSuggests(getRandomTopics(RANDOM_TOPICS, 6));
  }, []);

  // 只保留一块英文段落展示，采用流式p标签+span方案，悬浮时句子加若有若无的虚线下划线，点击即可朗读，气泡跟随鼠标，消失有延迟
  const handleMouseEnter = (idx: number) => {
    setHoverIndex(idx);
    setShowBubbleIndex(idx);
  };
  const handleMouseLeave = () => {
    // 延迟隐藏气泡，避免鼠标快速移动时气泡闪烁
    if (bubbleTimer.current) {
      clearTimeout(bubbleTimer.current);
    }
    bubbleTimer.current = setTimeout(() => {
      setShowBubbleIndex(null);
      setHoverIndex(null);
    }, 150); // 150ms延迟
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>, idx: number) => {
    if (hoverIndex === idx) {
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
    if (loading) {
      setLoginModalMessage(t('userLoading'));
      setShowLoginModal(true);
      return;
    }
    if (!user) {
      setLoginModalMessage(t('loginRequired'));
      setShowLoginModal(true);
      return;
    }
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

    if (contentType === 'dialogue') {
      // 对话播放逻辑
      const messages = dialogueState.messages;
      if (!messages || messages.length === 0) {
        setIsPlayingAll(false);
        setPlayingIndex(null);
        return;
      }

      // 1. 生成所有音频Promise
      const audioPromises = messages.map((msg, i) => {
        const voice = msg.gender === 'male' ? 'en-US-AndrewMultilingualNeural' : 'en-US-CoraMultilingualNeural';
        const cacheKey = msg.english + voice + 'azure' + 'normal';
        const cached = getAudioCache(cacheKey);
        if (cached) return Promise.resolve(cached);
        return getTTSUrl({ text: msg.english, voice, engine: 'azure' }).then(url => {
          if (url) setAudioCache(cacheKey, url);
          return url || '';
        });
      });

      // 2. 顺序播放
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
    } else {
      // 短文播放逻辑
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

      // 顺序播放
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
  }, [currentVoice, engine, currentSpeed, articleState, dialogueState, contentType]);

  const renderParagraph = () => (
    <div className="font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300 text-left hyphens-auto">
      {articleState.sentences.map((s: Sentence, idx: number) => (
        <span
          key={idx}
          className={`relative group inline align-baseline transition-all duration-150 p-1 rounded-md ${
            (isPlayingAll && playingIndex === idx) 
            ? 'bg-yellow-200/70 dark:bg-yellow-200/20' 
            : hoverIndex === idx
            ? 'border-b border-dashed border-gray-300 dark:border-gray-500 pb-0.5'
            : 'hover:border-b hover:border-dashed hover:border-gray-300 dark:hover:border-gray-500 hover:pb-0.5'
          }`}
          style={{
            fontWeight: 400,
            cursor: loadingIndex !== null ? 'not-allowed' : isPlayingAll ? 'not-allowed' : 'pointer',
            pointerEvents: (loadingIndex !== null && loadingIndex !== idx) || isPlayingAll ? 'none' : 'auto',
          }}
          onMouseEnter={() => handleMouseEnter(idx)}
          onMouseLeave={handleMouseLeave}
          onMouseMove={(e) => handleMouseMove(e, idx)}
          onClick={e => {
            e.stopPropagation();
            if (loadingIndex === null && !isPlayingAll) handleSpeak(s.english, idx);
          }}
        >
          <span className="relative">
            {s.english}
          </span>
          {/* loading 动画 */}
          {loadingIndex === idx && (
            <span className="absolute -top-5 right-0 z-50">
              <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          )}
          {/* {isPlayingAll && playingIndex === idx && (
            <span className="absolute -top-5 left-0 z-50">
              <svg className="animate-pulse h-4 w-4 text-indigo-500" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M10 8l6 4-6 4V8z" />
              </svg>
            </span>
          )} */}
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
    </div>
  );

  // Support custom topics and random generation
  const handleGenerate = async (mode: 'custom' | 'random') => {
    if (loading) {
      setLoginModalMessage(t('userLoading'));
      setShowLoginModal(true);
      return;
    }
    if (!user) {
      setLoginModalMessage(t('loginRequired'));
      setShowLoginModal(true);
      return;
    }
    setGenerating(true);
    try {
      const body: any = { 
        length: customLength,
        contentType: contentType
      };
      if (mode === 'custom') {
        body.topic = customTopic.trim();
      } else if (mode === 'random') {
        body.topic = '';
      }
      
      if (contentType === 'dialogue') {
        body.style = dialogueStyle;
      }
      
      const apiEndpoint = contentType === 'dialogue' ? '/api/generate-dialogue' : '/api/generate-article';
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (contentType === 'dialogue') {
        if (data.messages && Array.isArray(data.messages) && data.title) {
          const newDialogue = { ...data, title_chinese: data.title_chinese || '', vocabulary: data.vocabulary || [] };
          setDialogue(newDialogue);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastDialogue', JSON.stringify(newDialogue));
          }
          setIsSettingsCollapsed(true);
        } else {
          alert(data.error || t('dialogueGenerationFailed'));
        }
      } else {
        if (data.sentences && Array.isArray(data.sentences) && data.title) {
          const newArticle = { ...articleState, sentences: data.sentences, theme: '', title: data.title, title_chinese: data.title_chinese || '', vocabulary: data.vocabulary || [] };
          setArticle(newArticle);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastArticle', JSON.stringify(newArticle));
          }
          setIsSettingsCollapsed(true);
        } else {
          alert(data.error || t('generationFailed'));
        }
      }
      
      setTimeout(() => {
        articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e) {
      alert(t('generationFailed'));
    }
    setGenerating(false);
  }

  function handleShare() {
    if (navigator.share) {
      const shareData = {
        title: contentType === 'dialogue' ? dialogueState?.title || 'AI English Dialogue' : articleState?.title || 'AI English Article',
        text: contentType === 'dialogue' 
          ? dialogueState?.messages?.map(msg => `${msg.speaker}: ${msg.english}`).join('\n') || ''
          : articleState?.sentences.map(s => s.english).join(' '),
        url: window.location.href
      };
      navigator.share(shareData);
    } else {
      // 对于不支持原生分享的情况，也使用格式化的文本
      const shareText = contentType === 'dialogue' 
        ? dialogueState?.messages?.map(msg => `${msg.speaker}: ${msg.english}`).join('\n') || ''
        : articleState?.sentences.map(s => s.english).join(' ');
      
      const fullText = `${contentType === 'dialogue' ? dialogueState?.title || 'AI English Dialogue' : articleState?.title || 'AI English Article'}\n\n${shareText}\n\n${window.location.href}`;
      
      navigator.clipboard.writeText(fullText);
      alert(t('linkCopied'));
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * RANDOM_TOPICS.length);
      setPlaceholder(RANDOM_TOPICS[randomIndex]);
    }, 5000); // 每5秒切换一个话题

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={themeMode === 'light' ? 'bg-[#f8f4e9] text-gray-900' : 'bg-[#181c23] text-gray-100 transition-colors duration-300'}>
      <audio ref={audioRef} />
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message={loginModalMessage}
      />
      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center w-full max-w-7xl mx-auto">
        {/* 左侧主区 */}
        <div className="flex-1 flex flex-col items-center">
          {/* 操作区卡片 */}
          <div className="bg-white dark:bg-[#23272f] border border-gray-200 dark:border-gray-700 rounded-xl shadow w-full max-w-2xl overflow-hidden">
            <div
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
            >
              <h2 className="text-lg font-semibold">{t('generationSettings', 'Generation Settings')}</h2>
              <motion.div animate={{ rotate: isSettingsCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronUpIcon className="w-5 h-5" />
              </motion.div>
            </div>
            <AnimatePresence>
              {!isSettingsCollapsed && (
                <motion.div
                  key="settings-panel"
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto' },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <div className="w-full flex flex-col gap-4">
                      {/* 仅自定义话题输入区 */}
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm text-gray-700 dark:text-gray-200">{t('customTopic')}</label>
                        <div className="relative w-full">
                          {!customTopic && (
                            <TypeIt
                              key={placeholder}
                              options={{
                                strings: [placeholder],
                                speed: 50,
                                deleteSpeed: 30,
                                lifeLike: true,
                                cursor: false,
                                breakLines: false,
                                waitUntilVisible: true,
                              }}
                              as="div"
                              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                            />
                          )}
                          <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent dark:border-gray-600 dark:focus:ring-indigo-400"
                            placeholder="" // Keep this empty, TypeIt will be the placeholder
                          />
                        </div>
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
                        <span className="text-xs text-gray-400 mt-1">{t('topicPlaceholder_prefix')}"{t('topicPlaceholder_suggest')}"</span>
                      </div>
                      
                      {/* 内容类型选择器 */}
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm text-gray-700 dark:text-gray-200">{t('contentType')}</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="contentType"
                              value="article"
                              checked={contentType === 'article'}
                              onChange={(e) => setContentType(e.target.value as 'article' | 'dialogue')}
                              disabled={generating}
                              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">{t('article')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="contentType"
                              value="dialogue"
                              checked={contentType === 'dialogue'}
                              onChange={(e) => setContentType(e.target.value as 'article' | 'dialogue')}
                              disabled={generating}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">{t('dialogue')}</span>
                          </label>
                        </div>
                      </div>

                      {/* 对话风格选择器（仅在选择对话时显示） */}
                      {contentType === 'dialogue' && (
                        <div className="flex flex-col gap-2 w-full">
                          <label className="text-sm text-gray-700 dark:text-gray-200">{t('dialogueStyle')}</label>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries({
                              casual: { name: t('style_casual'), description: t('style_casual_desc')},
                              business: { name: t('style_business'), description: t('style_business_desc')},
                              social: { name: t('style_social'), description: t('style_social_desc')},
                            }).map(([key, style]) => (
                              <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input
                                  type="radio"
                                  name="dialogueStyle"
                                  value={key}
                                  checked={dialogueStyle === key}
                                  onChange={(e) => setDialogueStyle(e.target.value as 'casual' | 'business' | 'social')}
                                  disabled={generating}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{style.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{style.description}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Length + Buttons */}
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <div className="flex items-center whitespace-nowrap gap-2 w-full">
                          <label className="text-sm text-gray-700 dark:text-gray-200 mr-2 whitespace-nowrap">{t('length')}</label>
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
                            {generating ? t('generating') : contentType === 'dialogue' ? t('generateDialogue') : t('generateArticle')}
                          </button>
                          <button
                            className="btn btn-secondary shadow-md px-6 py-2 text-base rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-indigo-50 transition disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                            onClick={() => handleGenerate('random')}
                            disabled={generating}
                          >
                            {t('randomTopic')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* 内容区卡片：标题+短文 */}
          {contentType === 'article' && articleState.sentences.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto mt-8">
              <div className="mb-6 text-center">
                <div
                  onClick={() => handleSpeak(articleState.title, -1)}
                  onMouseEnter={() => setShowTitleChinese(true)}
                  onMouseLeave={() => setShowTitleChinese(false)}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setBubblePos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      absLeft: rect.left + window.scrollX,
                      absTop: rect.top + window.scrollY
                    });
                  }}
                  className="inline-block max-w-full cursor-pointer group"
                >
                  <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-white inline group-hover:underline decoration-dashed decoration-gray-400 underline-offset-4 dark:decoration-gray-500">
                    {articleState.title}
                  </h2>
                </div>
                <AnimatePresence>
                  {showTitleChinese && bubblePos && articleState.title_chinese && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.22 }}
                      className="fixed z-50 px-3 py-1 bg-gray-800 text-white text-sm rounded shadow-lg pointer-events-none select-none whitespace-pre-line max-w-xs text-left"
                      style={{
                        left: bubblePos.absLeft + bubblePos.x,
                        top: bubblePos.absTop + bubblePos.y + 24,
                        minWidth: 'max-content',
                        maxWidth: 320,
                        width: 'max-content',
                        transform: 'translate(-50%, 0)'
                      }}
                    >
                      {articleState.title_chinese}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {articleState.theme}
                </div>
              </div>
              {/* 播放和分享按钮，居中 */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={handlePlayAll}
                  disabled={loadingIndex !== null}
                  title={isPlayingAll ? "Pause" : "Play All"}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlayingAll ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H14M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    </svg>
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  title={t('share')}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zm6 8a3 3 0 11-6 0 3 3 0 016 0zm-6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              {renderParagraph()}
            </div>
          )}
          
          {/* 对话显示区域 */}
          {contentType === 'dialogue' && dialogueState.messages.length > 0 && (
            <div ref={articleRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto mt-8 overflow-hidden">
              <div className="p-8 pb-6">
                <div className="text-center">
                  <div
                    onClick={() => handleSpeak(dialogueState.title, -1)}
                    onMouseEnter={() => setShowTitleChinese(true)}
                    onMouseLeave={() => setShowTitleChinese(false)}
                    onMouseMove={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setBubblePos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        absLeft: rect.left + window.scrollX,
                        absTop: rect.top + window.scrollY
                      });
                    }}
                    className="inline-block max-w-full cursor-pointer group"
                  >
                    <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-white mb-1 inline group-hover:underline decoration-dashed decoration-gray-400 underline-offset-4 dark:decoration-gray-500">
                      {dialogueState.title}
                    </h2>
                  </div>
                  <AnimatePresence>
                    {showTitleChinese && bubblePos && dialogueState.title_chinese && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.22 }}
                        className="fixed z-50 px-3 py-1 bg-gray-800 text-white text-sm rounded shadow-lg pointer-events-none select-none whitespace-pre-line max-w-xs text-left"
                        style={{
                          left: bubblePos.absLeft + bubblePos.x,
                          top: bubblePos.absTop + bubblePos.y + 24,
                          minWidth: 'max-content',
                          maxWidth: 320,
                          width: 'max-content',
                          transform: 'translate(-50%, 0)'
                        }}
                      >
                        {dialogueState.title_chinese}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {dialogueState.topic}
                  </div>
                </div>
                {/* 播放和分享按钮，居中 */}
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={handlePlayAll}
                    disabled={loadingIndex !== null}
                    title={isPlayingAll ? "Pause" : "Play All"}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlayingAll ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H14M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      </svg>
                    ) : (
                      <SpeakerWaveIcon className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    title={t('share')}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zm6 8a3 3 0 11-6 0 3 3 0 016 0zm-6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <DialoguePanel 
                dialogue={dialogueState} 
                isPlayingAll={isPlayingAll}
                playingIndex={playingIndex}
              />
            </div>
          )}
        </div>
        {/* 词汇表区 */}
        <div className="w-full lg:w-80 bg-white dark:bg-[#23272f] border border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-sm min-h-[320px] flex flex-col">
          <h2 className="text-xl font-serif text-serif mb-4 text-gray-900 dark:text-white">{t('vocabulary')}</h2>
          {(contentType === 'article' && articleState.vocabulary && articleState.vocabulary.length > 0) || (contentType === 'dialogue' && dialogueState.vocabulary && dialogueState.vocabulary.length > 0) ? (
            <div className="space-y-4">
              {(contentType === 'article' ? articleState.vocabulary : dialogueState.vocabulary).map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.word}</h3>
                  <p className="text-gray-600 dark:text-gray-100">{item.meaning_en}</p>
                  <p className="text-sm text-gray-400">{item.meaning_zh}</p>
                  <p className="text-sm italic mt-2 text-gray-400">{item.example}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 dark:text-gray-400 text-sm text-center mt-8">{t('noVocabulary')}</div>
          )}
        </div>
      </div>
    </div>
  )
} 