'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

type ExtendedSession = Session & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, status, update } = useSession() as {
    data: ExtendedSession | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    update: (data?: any) => Promise<Session | null>;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminStatus = async () => {
      if (!isMounted) return;
      
      try {
        // 只在会话状态变化时检查
        if (status === 'authenticated' && session?.user) {
          // 如果已经有 admin 角色，直接通过
          if (session.user.role === 'admin') {
            setIsAdmin(true);
            setIsLoading(false);
            return;
          }
          
          // 否则从服务器获取最新角色
          const response = await fetch('/api/auth/debug', {
            cache: 'no-store',
            next: { revalidate: 0 }
          });
          
          if (!response.ok) {
            throw new Error('Failed to verify admin status');
          }
          
          const data = await response.json();
          const userRole = data?.session?.user?.role || 'user';
          
          if (userRole !== 'admin') {
            console.log('User is not an admin, redirecting...');
            router.push('/');
            return;
          }
          
          // 更新会话中的角色
          if (session.user.role !== userRole) {
            await update({ role: userRole });
          }
          
          if (isMounted) {
            setIsAdmin(true);
          }
        } else if (status === 'unauthenticated') {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();
    
    return () => {
      isMounted = false;
    };
  }, [status, router, update]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // 重定向中...
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {session?.user?.email}
              {session?.user?.role === 'admin' && ' (Admin)'}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
