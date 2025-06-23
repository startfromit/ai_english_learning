"use client";

import { useState } from "react";
import DebugInfo from "./_components/DebugInfo";
import EmailTestAndDiagnostics from "./_components/EmailTestAndDiagnostics";
import ForceCleanup from "./_components/ForceCleanup";
import AdminSettings from "./_components/AdminSettings";
import AuthGuard from "../../../components/AuthGuard";

const TABS = [
  { id: "info", label: "Debug Info", component: <DebugInfo /> },
  { id: "email-test-diagnostics", label: "Email Test & Diagnostics", component: <EmailTestAndDiagnostics /> },
  { id: "force-cleanup", label: "Force User Cleanup", component: <ForceCleanup /> },
  { id: "admin-settings", label: "Admin Settings", component: <AdminSettings /> },
];

function DebugPageContent() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const activeComponent = TABS.find((tab) => tab.id === activeTab)?.component;

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
  return (
    <AuthGuard>
      <DebugPageContent />
    </AuthGuard>
  );
} 