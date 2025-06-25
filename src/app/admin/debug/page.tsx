"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import DebugInfo from "./_components/DebugInfo";
import EmailTestAndDiagnostics from "./_components/EmailTestAndDiagnostics";
import ForceCleanup from "./_components/ForceCleanup";
import AdminSettings from "./_components/AdminSettings";
import GitVersionInfo from "./_components/GitVersionInfo";
import { Loader2 } from "lucide-react";

const TABS = [
  { id: "info", label: "Debug Info", component: <DebugInfo /> },
  { id: "email-test-diagnostics", label: "Email Test & Diagnostics", component: <EmailTestAndDiagnostics /> },
  { id: "force-cleanup", label: "Force User Cleanup", component: <ForceCleanup /> },
  { id: "admin-settings", label: "Admin Settings", component: <AdminSettings /> },
  { id: "git-version", label: "Git Version Info", component: <GitVersionInfo /> },
];

function DebugPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const activeComponent = TABS.find((tab) => tab.id === activeTab)?.component;

  useEffect(() => {
    // 如果会话加载完成且用户不是管理员，重定向到首页
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  // 如果会话正在加载，显示加载指示器
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 如果用户未登录或不是管理员，返回 null（会被重定向）
  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 p-4 space-y-2 border-r border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Debug Center</h2>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {activeComponent}
        </div>
      </main>
    </div>
  );
}

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [notAdmin, setNotAdmin] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      // session.user.role 可能类型未声明，需用 any
      if ((session?.user as any)?.role !== 'admin') {
        setNotAdmin(true);
      } else {
        setNotAdmin(false);
      }
    }
  }, [session, status]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }
  if (status === 'unauthenticated') {
    return <div className="flex justify-center items-center h-screen"><p>Please sign in to access this page.</p></div>;
  }
  if (notAdmin) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-600 text-lg font-bold">You are not authorized to view this page.</p></div>;
  }
  return <DebugPageContent />;
} 