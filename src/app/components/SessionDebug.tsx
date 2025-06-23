'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

type ExtendedSession = Session & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
};

export default function SessionDebug() {
  const { data: session, status, update } = useSession() as {
    data: ExtendedSession | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    update: (data?: any) => Promise<Session | null>;
  };
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetchDebugInfo = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 获取调试信息
      console.log('Fetching debug info...');
      const response = await fetch('/api/auth/debug', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Debug info received:', data);
      
      // 更新调试信息
      setDebugInfo(data);
      setLastFetched(Date.now());
      
      // 只有当会话中的角色与调试信息中的角色不同时才更新会话
      const serverRole = data?.session?.user?.role;
      const clientRole = session?.user?.role;
      
      if (serverRole && clientRole !== serverRole) {
        console.log(`Updating client role from '${clientRole}' to '${serverRole}'`);
        await update({ role: serverRole });
      }
    } catch (err) {
      console.error('Error in fetchDebugInfo:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, session?.user?.role, update]);
  
  // 只在组件挂载时获取一次调试信息
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 初始加载
      fetchDebugInfo();
      
      // 监听 visibilitychange 事件，当页面重新获得焦点时刷新数据
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchDebugInfo();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
    // 注意：这里移除了 fetchDebugInfo 依赖，因为我们使用了 useCallback 并确保它不会改变
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    await update();
    await fetchDebugInfo();
  };

  if (!session) {
    return (
      <div className="mt-8 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h3 className="font-bold mb-2 text-yellow-800">Not Authenticated</h3>
        <p className="text-sm text-yellow-700">Please sign in to view session information.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Session Debug</h2>
        {lastFetched && (
          <span className="text-sm text-gray-500">
            Last updated: {new Date(lastFetched).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Session Data</h3>
        <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
          {JSON.stringify({
            user: {
              id: session.user?.id,
              name: session.user?.name,
              email: session.user?.email,
              role: session.user?.role,
            },
            expires: session.expires
          }, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Debug Info</h3>
        {isLoading ? (
          <div>Loading debug info...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : debugInfo ? (
          <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
            {JSON.stringify({
              session: {
                user: {
                  id: debugInfo.session?.user?.id,
                  role: debugInfo.session?.user?.role,
                }
              },
              token: {
                id: debugInfo.token?.sub,
                role: debugInfo.token?.role
              }
            }, null, 2)}
          </pre>
        ) : null}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={handleRefresh}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading}
        >
          Refresh Session
        </button>
        <button
          onClick={fetchDebugInfo}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh Debug Info'}
        </button>
      </div>
    </div>
  );
}