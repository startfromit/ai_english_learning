"use client";

import { useState } from 'react';

export default function EmailTestAndDiagnostics() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState<'test' | 'diagnostics' | null>(null);

  // 业务测试邮件
  const sendTestEmail = async () => {
    setLoading('test');
    setResult('Sending test email...');
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setResult('Test Email Result:\n' + JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Test Email Error: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  // SMTP 诊断邮件（这里复用 test-email API，但可根据后端实际情况调整）
  const runDiagnostics = async () => {
    setLoading('diagnostics');
    setResult('Running diagnostics...');
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, diagnostics: true })
      });
      const data = await response.json();
      setResult('Diagnostics Result:\n' + JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Diagnostics Error: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Email Test & Diagnostics</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        输入邮箱后可选择业务测试邮件或 SMTP 诊断邮件，两者结果会分别显示。
      </p>
      <div className="mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div className="flex gap-4 mb-4">
        <button
          onClick={sendTestEmail}
          disabled={loading !== null || !email}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {loading === 'test' ? 'Sending...' : '业务测试邮件'}
        </button>
        <button
          onClick={runDiagnostics}
          disabled={loading !== null || !email}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
        >
          {loading === 'diagnostics' ? 'Running...' : 'SMTP 诊断邮件'}
        </button>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">Result:</h3>
        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm mt-2 min-h-[100px] whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
} 