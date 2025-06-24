import { Suspense } from 'react'
import ArticlePanel from './components/ArticlePanel'

export default function Home() {
  return (
    <div>
      <div className="container py-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ArticlePanel />
        </Suspense>
      </div>
    </div>
  )
}