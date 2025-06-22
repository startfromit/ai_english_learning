'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerificationSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Clear the pending verification email from localStorage
    localStorage.removeItem('pendingVerificationEmail')
  }, [])

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email verified successfully!
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            Your account has been verified. You can now sign in and start using our service.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Thank you for verifying your email address. Your account is now active and ready to use.
              </p>
            </div>

            <div>
              <button
                onClick={handleSignIn}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In Now
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                You will be redirected to the sign-in page where you can access your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 