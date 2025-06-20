'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthState = {
  user: User | null
  loading: boolean
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true
  })

  useEffect(() => {
    const supabase = createClient()
    
    const fetchUser = async (): Promise<void> => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) throw error
        
        setState(prev => ({
          ...prev,
          user,
          loading: false
        }))
      } catch (error) {
        console.error('Error fetching user:', error)
        setState(prev => ({
          ...prev,
          loading: false
        }))
      }
    }
    
    fetchUser()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setState({
          user: session?.user ?? null,
          loading: false
        })
      }
    )
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return state
}
