import { Suspense } from 'react'
import ArticlePanel from './components/ArticlePanel'
import Header from './components/Header'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow container py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ArticlePanel />
        </Suspense>
      </div>
      <Footer />
    </main>
  )
} 