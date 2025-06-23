import { Suspense } from 'react'
import ArticlePanel from './components/ArticlePanel'
import SessionDebug from './components/SessionDebug'

export default function Home() {
  return (
    <div>
      <div className="container py-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ArticlePanel />
        </Suspense>
        <SessionDebug />
      </div>
    </div>
  )
} 