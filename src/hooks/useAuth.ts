'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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
    loading: true
  })
  
  // NextAuth session
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') {
      setState(prev => ({ ...prev, loading: true }))
    } else if (session?.user) {
      setState({
        user: {
          id: session.user.id || '',
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        },
        loading: false,
        provider: 'nextauth'
      })
    } else {
      setState({
        user: null,
        loading: false,
        provider: 'nextauth'
      })
    }
  }, [session, status])

  return state
}
