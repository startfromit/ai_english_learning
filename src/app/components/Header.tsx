'use client'
import Link from 'next/link'
import AuthNav from '@/components/AuthNav'
import { useContext } from 'react'
import { ThemeContext } from './ThemeProvider'

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

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Left section: Logo and Main Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-serif text-gray-800 dark:text-white">
              Daily English
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                Today
              </Link>
              <Link href="/history" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                History
              </Link>
              <Link href="/favorites" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                Favorites
              </Link>
            </div>
          </div>

          {/* Right section: ThemeToggle + AuthNav */}
          <div className="flex items-center">
            <ThemeToggle />
            <AuthNav />
          </div>
        </nav>
      </div>
    </header>
  )
} 