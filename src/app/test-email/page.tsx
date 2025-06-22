'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmail = async () => {
    if (!email) {
      alert('Please enter an email address')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: { message: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Email Test Page</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Test Email Sending
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Enter an email address to test Supabase email functionality
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter email address to test"
                />
              </div>
              
              <button
                onClick={testEmail}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Email'}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Test Result
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    <code className="bg-gray-100 px-2 py-1 rounded font-bold">
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </code>
                  </dd>
                </div>
                
                {result.message && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Message</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      <code className="bg-gray-100 px-2 py-1 rounded">{result.message}</code>
                    </dd>
                  </div>
                )}
                
                {result.error && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Error</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 text-red-600">
                      <code className="bg-gray-100 px-2 py-1 rounded">{result.error}</code>
                    </dd>
                  </div>
                )}
                
                {result.code && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Error Code</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 text-red-600">
                      <code className="bg-gray-100 px-2 py-1 rounded">{result.code}</code>
                    </dd>
                  </div>
                )}
                
                {result.details && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Details</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Troubleshooting Email Issues
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">1. Check Supabase Email Settings</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to your Supabase dashboard → Authentication → Email Templates and ensure:
                </p>
                <ul className="text-sm text-gray-600 mt-1 list-disc list-inside space-y-1">
                  <li>Email templates are configured</li>
                  <li>SMTP settings are properly configured (if using custom SMTP)</li>
                  <li>Email confirmations are enabled</li>
                  <li>Site URL is set correctly</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">2. Check Environment Variables</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ensure <code className="bg-gray-100 px-2 py-1 rounded text-xs">NEXTAUTH_URL</code> is set correctly in your <code className="bg-gray-100 px-2 py-1 rounded text-xs">.env.local</code> file.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">3. Check Email Provider</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Check your email provider's spam folder. Supabase emails might be filtered as spam.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">4. Common Error Codes</h4>
                <ul className="text-sm text-gray-600 mt-1 list-disc list-inside space-y-1">
                  <li><strong>400:</strong> Bad request - check email format and Supabase settings</li>
                  <li><strong>401:</strong> Unauthorized - check Supabase API keys</li>
                  <li><strong>422:</strong> Unprocessable entity - email might already be confirmed</li>
                  <li><strong>429:</strong> Rate limited - wait before trying again</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 