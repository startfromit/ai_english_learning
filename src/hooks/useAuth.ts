'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

type AuthUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  debugSession: () => Promise<any>
  signIn: (provider?: string, options?: any) => Promise<any>
  signOut: (options?: any) => Promise<any>
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>(() => ({
    user: null,
    loading: true,
    debugSession: async () => ({}),
    signIn: async () => ({}),
    signOut: async () => {}
  }))

  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') {
      setState(prev => ({ ...prev, loading: true }))
    } else if (session?.user) {
      // 确保 session.user 存在
      const user = session.user;
      // 从 session.user 中获取角色信息
      const userRole = (session.user as any).role || 'user';
      console.log('Setting user with role:', { user, role: userRole });
      
      setState(prev => ({
        ...prev,
        user: {
          id: user.id || '',
          email: user.email,
          name: user.name,
          image: user.image,
          role: userRole,
        },
        loading: false,
      }))
    } else {
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
      }))
    }
  }, [session, status])

  // 添加调试函数
  const debugSession = async () => {
    try {
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      console.log('Debug session:', data);
      return data;
    } catch (error) {
      console.error('Debug session error:', error);
      return { error };
    }
  };

  return {
    ...state,
    debugSession,
    signIn,
    signOut,
  };
}
