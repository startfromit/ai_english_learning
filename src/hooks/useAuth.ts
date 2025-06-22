'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'

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
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()

  useEffect(() => {
    const supabase = createClient()
    
    const fetchUser = async (): Promise<void> => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) throw error
        
        if (user) {
          setState({
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email,
              image: user.user_metadata?.avatar_url
            },
            loading: false,
            provider: 'supabase'
          })
        } else {
          setState({
            user: null,
            loading: false,
            provider: 'supabase'
          })
        }
      } catch (error) {
        console.error('Error fetching Supabase user:', error)
        setState({
          user: null,
          loading: false,
          provider: 'supabase'
        })
      }
    }
    
    // If NextAuth session exists, use it
    if (nextAuthSession?.user) {
      setState({
        user: {
          id: nextAuthSession.user.id || '',
          email: nextAuthSession.user.email,
          name: nextAuthSession.user.name,
          image: nextAuthSession.user.image
        },
        loading: false,
        provider: 'github'
      })
    } else if (nextAuthStatus === 'loading') {
      // Still loading NextAuth
      setState(prev => ({ ...prev, loading: true }))
    } else {
      // No NextAuth session, try Supabase
      fetchUser()
    }
    
    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!nextAuthSession?.user) { // Only update if no NextAuth session
          if (session?.user) {
            setState({
              user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email,
                image: session.user.user_metadata?.avatar_url
              },
              loading: false,
              provider: 'supabase'
            })
          } else {
            setState({
              user: null,
              loading: false,
              provider: 'supabase'
            })
          }
        }
      }
    )
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [nextAuthSession, nextAuthStatus])

  return state
}
