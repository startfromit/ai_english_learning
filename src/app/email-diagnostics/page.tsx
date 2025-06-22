'use client'

import { useState } from 'react'

export default function EmailDiagnosticsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [userStatus, setUserStatus] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)

  const runDiagnostics = async () => {
    if (!email) {
      alert('Please enter an email address')
      return
    }

    setLoading(true)
    setResult(null)
    setUserStatus(null)
    setCleanupResult(null)

    try {
      // Test email sending
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)

      // Check user status
      const userResponse = await fetch('/api/check-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const userData = await userResponse.json()
      setUserStatus(userData)
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

  const cleanupUsers = async () => {
    if (!email) {
      alert('Please enter an email address')
      return
    }

    setLoading(true)
    setCleanupResult(null)

    try {
      const response = await fetch('/api/cleanup-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setCleanupResult(data)
    } catch (error) {
      setCleanupResult({
        success: false,
        error: 'Network error',
        details: { message: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoading(false)
    }
  }

  const hasDuplicateUsers = userStatus?.details?.dbUser && userStatus?.details?.currentSession && 
    userStatus.details.dbUser.id !== userStatus.details.currentSession.userId

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Email Diagnostics</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Test Email Delivery
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Since your Supabase settings are correct, let's diagnose the delivery issue
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
              
              <div className="flex space-x-4">
                <button
                  onClick={runDiagnostics}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Run Diagnostics'}
                </button>
                
                {hasDuplicateUsers && (
                  <button
                    onClick={cleanupUsers}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Cleaning...' : 'Cleanup Duplicate Users'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Email Test Result
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

        {userStatus && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Status Check
              </h3>
              {hasDuplicateUsers && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> You have duplicate user accounts. The database user is unverified, but you have a verified GitHub session.
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Database User</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {userStatus.details.dbUser ? (
                      <div className="space-y-1">
                        <div><strong>ID:</strong> {userStatus.details.dbUser.id}</div>
                        <div><strong>Email Verified:</strong> {userStatus.details.dbUser.email_verified ? 'Yes' : 'No'}</div>
                        <div><strong>Provider:</strong> {userStatus.details.dbUser.provider}</div>
                        <div><strong>Created:</strong> {new Date(userStatus.details.dbUser.created_at).toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="text-red-600">User not found in database</span>
                    )}
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Current Session</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {userStatus.details.currentSession ? (
                      <div className="space-y-1">
                        <div><strong>User ID:</strong> {userStatus.details.currentSession.userId}</div>
                        <div><strong>Email:</strong> {userStatus.details.currentSession.email}</div>
                        <div><strong>Email Confirmed:</strong> {userStatus.details.currentSession.emailConfirmed ? 'Yes' : 'No'}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No active session</span>
                    )}
                  </dd>
                </div>
                
                {userStatus.details.signInError && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Sign In Error</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 text-red-600">
                      <code className="bg-gray-100 px-2 py-1 rounded">{userStatus.details.signInError}</code>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {cleanupResult && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Cleanup Result
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${cleanupResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    <code className="bg-gray-100 px-2 py-1 rounded font-bold">
                      {cleanupResult.success ? 'SUCCESS' : 'FAILED'}
                    </code>
                  </dd>
                </div>
                
                {cleanupResult.message && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Message</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      <code className="bg-gray-100 px-2 py-1 rounded">{cleanupResult.message}</code>
                    </dd>
                  </div>
                )}
                
                {cleanupResult.details && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Details</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(cleanupResult.details, null, 2)}
                      </pre>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Email Delivery Troubleshooting
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">1. Duplicate User Issue</h4>
                <p className="text-sm text-gray-600 mt-1">
                  You have both a GitHub user (verified) and an email user (unverified). Use the "Cleanup Duplicate Users" button to remove the unverified user.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">2. Use GitHub Login</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Since you have a verified GitHub account, you can simply use GitHub login instead of email verification.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">3. Check Spam/Junk Folder</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Supabase emails are often filtered as spam. Check your spam/junk folder.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">4. Add Supabase to Whitelist</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add <code className="bg-gray-100 px-1 rounded">*@supabase.co</code> to your email whitelist.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">5. Try Different Email</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Test with Gmail or Outlook to see if it's provider-specific.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 