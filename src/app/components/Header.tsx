import Link from 'next/link'
import AuthNav from '@/components/AuthNav'

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

          {/* Right section: AuthNav */}
          <AuthNav />
        </nav>
      </div>
    </header>
  )
} 