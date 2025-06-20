'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

type AuthGuardProps = {
  children: React.ReactNode
  requiredRole?: string
}

export default function AuthGuard({ 
  children,
  requiredRole
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const redirectToSignIn = useCallback(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams()
      searchParams.set('redirectedFrom', pathname || '/')
      router.push(`/auth/signin?${searchParams.toString()}`)
    }
  }, [pathname, router])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      redirectToSignIn()
      return
    }
    
    // Optional: Check user role if requiredRole is provided
    if (requiredRole) {
      // Add your role checking logic here
      // For example:
      // if (user.role !== requiredRole) {
      //   router.push('/unauthorized')
      // }
    }
  }, [user, loading, router, requiredRole, redirectToSignIn])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    )
  }

  return <>{children}</>
}
