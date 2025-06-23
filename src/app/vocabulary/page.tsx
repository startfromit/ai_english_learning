'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { TrashIcon, DocumentArrowDownIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface VocabularyItem {
  id: number;
  word: string;
  meaning_en: string;
  meaning_zh: string;
  example: string;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function VocabularyPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredVocabulary, setFilteredVocabulary] = useState<VocabularyItem[]>([])

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    if (user) {
      fetchVocabulary(1)
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  // Filter vocabulary based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVocabulary(vocabulary)
    } else {
      const filtered = vocabulary.filter(item =>
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaning_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaning_zh.includes(searchTerm)
      )
      setFilteredVocabulary(filtered)
    }
  }, [vocabulary, searchTerm])

  const fetchVocabulary = async (page: number) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await fetch(`/api/vocabulary/get?page=${page}&limit=${ITEMS_PER_PAGE}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch vocabulary: ${response.status} ${errorData.error || ''}`)
      }
      
      const result = await response.json()
      
      if (page === 1) {
        setVocabulary(result.data)
        setCurrentPage(1)
      } else {
        setVocabulary(prev => [...prev, ...result.data])
      }
      
      setPagination(result.pagination)
    } catch (error) {
      console.error('Fetch vocabulary error:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (pagination?.hasMore && !loadingMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchVocabulary(nextPage)
    }
  }, [pagination, loadingMore, currentPage])

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
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
        <div>
          <h1 className="text-3xl font-bold">{t('my_vocabulary', 'My Vocabulary')}</h1>
          {pagination && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('total_words', 'Total')}: {pagination.total} {t('words', 'words')}
            </p>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={vocabulary.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          {t('export_csv', 'Export CSV')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_vocabulary', 'Search vocabulary...')}
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {vocabulary.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('no_vocab_yet', 'Your vocabulary book is empty.')}</p>
          <p className="mt-2 text-sm text-gray-400">{t('no_vocab_tip', 'Start adding words from the articles and dialogues you read.')}</p>
        </div>
      ) : (
        <>
          <div className="shadow-lg rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVocabulary.map((item) => (
                <li key={item.id} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{item.word}</h3>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{item.meaning_en}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.meaning_zh}</p>
                      <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">"{item.example}"</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full ml-4"
                      title={t('delete', 'Delete')}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Load More Button */}
          {pagination?.hasMore && !loadingMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                {t('load_more', 'Load More')}
              </button>
            </div>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="text-center mt-6">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">{t('loading_more', 'Loading more...')}</span>
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {searchTerm && (
            <div className="text-center mt-4 text-sm text-gray-500">
              {t('search_results', 'Showing')} {filteredVocabulary.length} {t('of', 'of')} {vocabulary.length} {t('words', 'words')}
            </div>
          )}
        </>
      )}
    </div>
  )
} 