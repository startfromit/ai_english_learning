'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ForceCleanupPage() {
  const [message, setMessage] = useState('')

  const forceSignOut = async () => {
    setMessage('Signing out...')
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage(`Error signing out: ${error.message}`)
      return
    }

    setMessage('User signed out. Clearing local data...')

    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
          let cookie = cookies[i];
          let eqPos = cookie.indexOf("=");
          let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          name = name.trim();
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    } catch (e) {
      console.error('Cookie clearing failed', e)
    }

    localStorage.clear()
    sessionStorage.clear()
    
    setMessage('Local data cleared. Please also follow the manual steps below.')
    alert('Local session data has been cleared. You will be reloaded.');
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Full User Data Cleanup</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-red-700">
              Step 1: Clear Browser Session
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              This will log you out and clear all local session data from your browser.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <button
              onClick={forceSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Force Logout and Clear Local Data
            </button>
            {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Step 2: Delete Users from Supabase Authentication
            </h3>
             <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This is a destructive action and will permanently delete the user accounts.
                </p>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">1. Go to Supabase Authentication</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to your Supabase project dashboard and click the <strong>Authentication</strong> icon in the left sidebar (it looks like a person).
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">2. Find and Delete Users</h4>
                <p className="text-sm text-gray-600 mt-1">
                  In the <strong>Users</strong> tab, use the search bar to find all users with the email address you are having trouble with (e.g., `670199081@qq.com`).
                </p>
                 <p className="text-sm text-gray-600 mt-1">
                  You will likely see at least one user, possibly two. Select <strong>all</strong> of them and click the delete button.
                </p>
              </div>

               <div>
                <h4 className="text-sm font-medium text-gray-900">3. (Optional) Check Public `users` Table</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to the <strong>Table Editor</strong> (spreadsheet icon), select your `users` table, and delete any leftover rows for that email address.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">4. Try Registering Again</h4>
                <p className="text-sm text-gray-600 mt-1">
                  After completing all steps, you should be able to register a new account with that email address without any issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 