'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function SignOutPage() {
  useEffect(() => {
    // We trigger the sign-out process here, and then redirect to the homepage.
    // The callbackUrl ensures the user lands on the homepage after sign-out is complete.
    signOut({ callbackUrl: '/' })
  }, [])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Signing you out...
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Please wait while we securely sign you out of your account.
        </p>
      </div>
    </div>
  )
}
