'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRemainingPlays } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'

function ProfileContent() {
  const { user, provider } = useAuth()
  const [remainingPlays, setRemainingPlays] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchRemainingPlays = async () => {
      if (!user) return
      
      try {
        const plays = await getRemainingPlays()
        setRemainingPlays(plays)
      } catch (error) {
        console.error('Error fetching remaining plays:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRemainingPlays()
  }, [user])
  
  const refreshPlays = async () => {
    try {
      setLoading(true)
      const plays = await getRemainingPlays()
      setRemainingPlays(plays)
    } catch (error) {
      console.error('Error refreshing plays:', error)
    } finally {
      setLoading(false)
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
        <button
          onClick={refreshPlays}
          disabled={loading}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 px-3 py-1 border border-indigo-200 dark:border-indigo-800 rounded-md"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
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
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              <span className="font-medium">Sign-in method:</span> {provider === 'github' ? 'GitHub' : 'Email/Password'}
            </p>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Usage</h2>
          <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Remaining audio plays today:</span>{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {remainingPlays} / 10
              </span>
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${(remainingPlays / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your free daily limit resets at midnight (UTC).
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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
