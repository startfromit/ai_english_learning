"use client";

import { useState } from 'react';

export default function ForceCleanup() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const runCleanup = async () => {
    setLoading(true);
    setResult('Running cleanup...');
    try {
      const response = await fetch('/api/cleanup-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Force User Cleanup</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Manually trigger the cleanup of unverified users who signed up more than 24 hours ago. This is normally handled by a cron job.
      </p>
      <div className="mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter email address to cleanup duplicates"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <button
        onClick={runCleanup}
        disabled={loading || !email}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400"
      >
        {loading ? 'Running...' : 'Force Cleanup Now'}
      </button>
      <div className="mt-4">
        <h3 className="font-semibold">Result:</h3>
        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm mt-2 min-h-[100px]">{result}</pre>
      </div>
    </div>
  );
} 