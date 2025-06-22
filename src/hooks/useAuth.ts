'use client'

import { useEffect, useState, useCallback } from 'react'

type AuthUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  provider?: string
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  })

  const checkAuth = useCallback(async () => {
    // We don't set loading to true here on re-checks to avoid UI flickering.
    // Loading is only true on the initial mount.
    try {
      const response = await fetch('/api/auth/check-session')
      if (!response.ok) throw new Error('Session check failed')

      const { user } = await response.json()

      if (user) {
        setState({ user, loading: false, provider: 'custom' })
      } else {
        setState({ user: null, loading: false, provider: 'none' })
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setState({ user: null, loading: false, provider: 'none' })
    }
  }, [])

  useEffect(() => {
    checkAuth() // Initial check on component mount.

    // Listen for the custom event to re-check auth
    window.addEventListener('auth-change', checkAuth)

    // Cleanup the listener when the component unmounts
    return () => {
      window.removeEventListener('auth-change', checkAuth)
    }
  }, [checkAuth])

  return state
}
