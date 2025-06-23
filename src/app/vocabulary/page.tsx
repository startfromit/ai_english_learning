'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface VocabularyItem {
  id: number;
  word: string;
  meaning_en: string;
  meaning_zh: string;
  example: string;
  created_at: string;
}

export default function VocabularyPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchVocabulary()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchVocabulary = async () => {
    setLoading(true)
    try {
      console.log('Fetching vocabulary...')
      const response = await fetch('/api/vocabulary/get')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(`Failed to fetch vocabulary: ${response.status} ${errorData.error || ''}`)
      }
      
      const data = await response.json()
      console.log('Vocabulary data:', data)
      setVocabulary(data)
    } catch (error) {
      console.error('Fetch vocabulary error:', error)
      // Show error toast
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/vocabulary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) {
        throw new Error('Failed to delete vocabulary item')
      }
      setVocabulary(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error(error)
      // You can add a toast notification here to inform the user of the error
    }
  }

  const handleExport = () => {
    const header = ['Word', 'English Meaning', 'Chinese Meaning', 'Example Sentence'].join(',')
    const rows = vocabulary.map(item =>
      [item.word, item.meaning_en, item.meaning_zh, `"${item.example.replace(/"/g, '""')}"`].join(',')
    )
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows.join('\n')}`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'my_vocabulary.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">{t('auth_required_title', 'Authentication Required')}</h1>
        <p className="mt-4">{t('auth_required_vocab', 'Please sign in to view your vocabulary book.')}</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('my_vocabulary', 'My Vocabulary')}</h1>
        <button
          onClick={handleExport}
          disabled={vocabulary.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          {t('export_csv', 'Export CSV')}
        </button>
      </div>

      {vocabulary.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('no_vocab_yet', 'Your vocabulary book is empty.')}</p>
          <p className="mt-2 text-sm text-gray-400">{t('no_vocab_tip', 'Start adding words from the articles and dialogues you read.')}</p>
        </div>
      ) : (
        <div className="shadow-lg rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {vocabulary.map((item) => (
              <li key={item.id} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{item.word}</h3>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{item.meaning_en}</p>
                    <p className="text-gray-500 dark:text-gray-400">{item.meaning_zh}</p>
                    <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">"{item.example}"</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
                    title={t('delete', 'Delete')}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 