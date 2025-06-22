'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface ErrorContent {
  title: string
  description: string
  possibleCauses: string[]
  solution: string
}

const errorMap: Record<string, ErrorContent> = {
  InvalidVerificationLink: {
    title: 'Invalid or Expired Verification Link',
    description:
      'The verification link you used is invalid, has expired, or has already been used.',
    possibleCauses: [
      'The link has already been clicked. Verification links are single-use.',
      'Your email client or an security scanner might have "pre-fetched" or "clicked" the link automatically to check for threats.',
      "If you're using a custom SMTP service, its 'Link Tracking' or 'Click Tracking' feature can cause this issue. Please disable it.",
      'The link has expired.',
    ],
    solution:
      'Please request a new verification email from the sign-in or sign-up page. If the problem persists, disable "Link Tracking" in your custom SMTP service settings.',
  },
  default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    possibleCauses: ['Network connectivity issues', 'Server configuration problems'],
    solution: 'Please try again or contact support if the problem persists.',
  },
}

function AuthenticationErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') || 'default'

  const content = (error && errorMap[error]) || errorMap.default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {content.title}
          </h1>
        </div>

        <div className="mt-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Error Details
            </h3>
            <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Error Code:
                </span>{' '}
                {error}
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Description:
                </span>{' '}
                {content.description}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Possible Causes
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
              {content.possibleCauses.map((cause, index) => (
                <li key={index}>{cause}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Solution</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {content.solution}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-3">
          <Link href="/auth/signin">
            <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Try Again
            </button>
          </Link>
          <Link href="/">
            <button className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthenticationErrorPage 