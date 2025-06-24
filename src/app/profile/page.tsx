'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'

function ProfileContent() {
  const { user, loading } = useAuth()
  const [remainingPlays, setRemainingPlays] = useState<number | null>(null)
  const [loadingPlays, setLoadingPlays] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchRemainingPlays = async () => {
    if (!user) return
    
    try {
      setError(null)
      const response = await fetch('/api/get-remaining-plays')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch remaining plays')
      }
      
      setRemainingPlays(data.remaining ?? 0)
    } catch (error) {
      console.error('Error fetching remaining plays:', error)
      setError(error instanceof Error ? error.message : 'Failed to load play count')
      setRemainingPlays(null)
    } finally {
      setLoadingPlays(false)
    }
  }

  useEffect(() => {
    fetchRemainingPlays()
  }, [user])
  
  const refreshPlays = async () => {
    try {
      setLoadingPlays(true)
      await fetchRemainingPlays()
    } catch (error) {
      console.error('Error refreshing plays:', error)
    } finally {
      setLoadingPlays(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
      </div>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h2>
          <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              <span className="font-medium">Name:</span> {user?.name || 'Not provided'}
            </p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Usage</h2>
            <button
              onClick={refreshPlays}
              disabled={loadingPlays}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 px-2 py-1 border border-indigo-200 dark:border-indigo-800 rounded-md"
            >
              {loadingPlays ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            {error ? (
              <div className="text-red-500 text-sm">
                {error}.{' '}
                <button 
                  onClick={fetchRemainingPlays}
                  className="text-indigo-600 hover:underline"
                  disabled={loadingPlays}
                >
                  {loadingPlays ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Remaining audio plays today:</span>{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {loadingPlays ? 'Loading...' : `${remainingPlays ?? 'N/A'}`} / 20
                  </span>
                </p>
                {!loadingPlays && remainingPlays !== null && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${(remainingPlays / 20) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Your free daily limit resets at midnight (UTC).
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            &larr; Back to Home
          </Link>
          <button
            onClick={() => router.push('/auth/signout')}
            className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
