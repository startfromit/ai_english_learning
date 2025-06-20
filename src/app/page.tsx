import { Suspense } from 'react'
import ArticlePanel from './components/ArticlePanel'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#f8f4e9] dark:bg-[#181c23]">
      <div className="flex-grow container py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ArticlePanel />
        </Suspense>
      </div>
      <Footer />
    </main>
  )
} 