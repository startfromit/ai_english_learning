'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'

export default function AuthNav() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Don't show auth nav on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  if (loading) {
    return (
      <nav className="flex items-center justify-end p-4">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </nav>
    )
  }

  return (
    <nav className="flex items-center justify-end p-4">
      {user ? (
        <div className="flex items-center space-x-4">
          {user.image && (
            <img src={user.image} alt={user.name || 'User avatar'} className="h-8 w-8 rounded-full" />
          )}
          <Link 
            href="/profile"
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
          >
            {user.name || user.email}
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <Link 
            href={`/auth/signin?redirectedFrom=${encodeURIComponent(pathname || '/')}`}
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
          >
            Sign in
          </Link>
          <Link 
            href={`/auth/signup?redirectedFrom=${encodeURIComponent(pathname || '/')}`}
            className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md"
          >
            Sign up
          </Link>
        </div>
      )}
    </nav>
  )
}
