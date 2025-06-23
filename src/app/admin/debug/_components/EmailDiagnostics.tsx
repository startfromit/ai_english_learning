"use client";

import { useState } from 'react';

export default function EmailDiagnostics() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const runDiagnostics = async () => {
    setLoading(true);
    setResult('Running diagnostics...');
    try {
      const response = await fetch('/api/test-email', {
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
      <h2 className="text-xl font-bold mb-4">Email Diagnostics</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        This tool will attempt to connect to the SMTP server using the credentials from your environment variables and send a test email to itself.
      </p>
      <div className="mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter email address for diagnostics"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <button
        onClick={runDiagnostics}
        disabled={loading || !email}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
      >
        {loading ? 'Running...' : 'Run Email Diagnostics'}
      </button>
      <div className="mt-4">
        <h3 className="font-semibold">Result:</h3>
        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm mt-2 min-h-[100px]">{result}</pre>
      </div>
    </div>
  );
} 