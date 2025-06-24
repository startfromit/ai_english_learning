'use client'
import Link from 'next/link'
import AuthNav from '@/components/AuthNav'
import { useContext, useState, useEffect } from 'react'
import { ThemeContext } from './ThemeProvider'
import LocaleSwitcher from './LocaleSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

// 全局状态管理词汇总量
let globalVocabularyCount = 0
let listeners: ((count: number) => void)[] = []

export const updateVocabularyCount = (count: number) => {
  console.log('Updating vocabulary count:', count)
  globalVocabularyCount = count
  listeners.forEach(listener => listener(count))
}

export const subscribeToVocabularyCount = (listener: (count: number) => void) => {
  listeners.push(listener)
  // 立即返回当前值
  listener(globalVocabularyCount)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export const incrementVocabularyCount = () => {
  const newCount = globalVocabularyCount + 1
  console.log('Incrementing vocabulary count from', globalVocabularyCount, 'to', newCount)
  updateVocabularyCount(newCount)
}

function ThemeToggle() {
  const { themeMode, setThemeMode } = useContext(ThemeContext)
  return (
    <button
      onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors mr-2"
      title={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {themeMode === 'light' ? (
        // 太阳图标
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
        </svg>
      ) : (
        // 月亮图标
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
        </svg>
      )}
    </button>
  )
}

function VocabularyNav() {
  const { user } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const [vocabularyCount, setVocabularyCount] = useState(0)

  useEffect(() => {
    if (user) {
      // 获取初始词汇总量
      fetch('/api/vocabulary/get?limit=1')
        .then(response => response.json())
        .then(result => {
          const count = result.pagination?.total || 0
          setVocabularyCount(count)
          updateVocabularyCount(count)
        })
        .catch(console.error)

      // 订阅词汇总量更新
      const unsubscribe = subscribeToVocabularyCount(setVocabularyCount)
      return unsubscribe
    } else {
      // 用户未登录时，重置词汇数量
      setVocabularyCount(0)
      updateVocabularyCount(0)
    }
  }, [user])

  const handleVocabularyClick = () => {
    if (user) {
      router.push('/vocabulary')
    } else {
      router.push('/auth/signin')
    }
  }

  return (
    <button
      onClick={handleVocabularyClick}
      data-vocabulary-button
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors font-medium relative"
    >
      <BookOpenIcon className="w-5 h-5" />
      <span className="whitespace-nowrap">{t('vocabulary', '生词本')}</span>
      {user && vocabularyCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {vocabularyCount > 99 ? '99+' : vocabularyCount}
        </span>
      )}
    </button>
  )
}

export default function Header() {
  const { themeMode, setThemeMode } = useContext(ThemeContext) as { themeMode: 'light' | 'dark', setThemeMode: (mode: 'light' | 'dark') => void }
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Left section: Logo + Vocabulary */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-serif text-gray-800 dark:text-white">
              Daily English
            </Link>
            <VocabularyNav />
          </div>

          {/* Right section: ThemeToggle + LocaleSwitcher + AuthNav */}
          <div className="flex items-center">
            <ThemeToggle />
            <LocaleSwitcher />
            <AuthNav />
          </div>
        </nav>
      </div>
    </header>
  )
} 