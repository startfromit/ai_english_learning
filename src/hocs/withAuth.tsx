'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function withAuth(Component: any, requiredRole?: string) {
  return function WithAuthWrapper(props: any) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;
      
      // 如果用户未登录，重定向到登录页
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // 如果需要特定角色但用户没有该角色，重定向到首页
      if (requiredRole && (session as any)?.user?.role !== requiredRole) {
        router.push('/');
      }
    }, [session, status, router]);

    // 如果会话正在加载或用户未授权，显示加载中或空内容
    if (status === 'loading' || !session || (requiredRole && (session as any)?.user?.role !== requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
