import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#2c3e50] text-white">
      <div className="container py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif">
            Daily English
          </Link>
          <div className="space-x-6">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Today
            </Link>
            <Link href="/history" className="hover:text-gray-300 transition-colors">
              History
            </Link>
            <Link href="/favorites" className="hover:text-gray-300 transition-colors">
              Favorites
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
} 