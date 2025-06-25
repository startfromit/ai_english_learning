"use client";

import { useState, useEffect } from "react";
import { Copy, Check, GitBranch, GitCommit, Calendar, User, Clock } from "lucide-react";

interface GitInfo {
  commitId: string;
  commitMessage: string;
  author: string;
  date: string;
  branch: string;
  isDirty: boolean;
  buildTime: string;
}

export default function GitVersionInfo() {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchGitInfo = async () => {
      try {
        const response = await fetch('/api/admin/git-info');
        if (!response.ok) {
          throw new Error('Failed to fetch git info');
        }
        const data = await response.json();
        setGitInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchGitInfo();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Git Version Info</h3>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!gitInfo) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Git Version Info</h3>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-700 dark:text-yellow-300">No git information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Git Version Info</h3>
      
      <div className="space-y-4">
        {/* Commit ID */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitCommit className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Commit ID:</span>
            </div>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                {gitInfo.commitId}
              </code>
              <button
                onClick={() => copyToClipboard(gitInfo.commitId)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy commit ID"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Branch */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Branch:</span>
            <span className="text-gray-900 dark:text-white">{gitInfo.branch}</span>
          </div>
        </div>

        {/* Commit Message */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">Message:</span>
            <span className="text-gray-900 dark:text-white">{gitInfo.commitMessage}</span>
          </div>
        </div>

        {/* Author */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Author:</span>
            <span className="text-gray-900 dark:text-white">{gitInfo.author}</span>
          </div>
        </div>

        {/* Commit Date */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Commit Date:</span>
            <span className="text-gray-900 dark:text-white">{formatDate(gitInfo.date)}</span>
          </div>
        </div>

        {/* Build Time */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Build Time:</span>
            <span className="text-gray-900 dark:text-white">{formatDate(gitInfo.buildTime)}</span>
          </div>
        </div>

        {/* Dirty Status */}
        {gitInfo.isDirty && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                Working directory had uncommitted changes at build time
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 