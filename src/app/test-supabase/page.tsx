'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from 'next-auth/react'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Testing...')
  const [error, setError] = useState<string | null>(null)
  const { data: session, status: sessionStatus } = useSession()

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setStatus('Loading session...')
      return
    }
    
    if (sessionStatus === 'unauthenticated') {
      setStatus('No session found - user not authenticated')
      return
    }
    
    if (session?.user?.id) {
      testSupabase()
    }
  }, [session, sessionStatus])

  const testSupabase = async () => {
    try {
      setStatus('Testing Supabase connection...')
      const supabase = createClient()
      
      if (!session?.user?.id) {
        setStatus('No session found - user not authenticated')
        return
      }
      
      setStatus(`Connected as: ${session.user.email} (ID: ${session.user.id})`)
      
      // Test 1: Check if user_vocabulary table exists
      const { data: tableTest, error: tableError } = await supabase
        .from('user_vocabulary')
        .select('count')
        .limit(1)
      
      if (tableError) {
        if (tableError.code === '42P01') {
          throw new Error('user_vocabulary table does not exist. Please run the database migration.')
        }
        throw new Error(`Table error: ${tableError.message}`)
      }
      
      setStatus('✅ Table exists and accessible')
      
      // Test 2: Check RLS policies
      try {
        const { data: policies, error: policiesError } = await supabase
          .rpc('get_policies', { table_name: 'user_vocabulary' })
        
        if (policiesError) {
          console.log('Could not check policies via RPC:', policiesError.message)
        } else {
          console.log('RLS Policies:', policies)
        }
      } catch (rpcError) {
        console.log('RPC function not available or failed')
      }
      
      // Test 3: Try to insert a test record
      const testWord = `test_${Date.now()}`
      const { data: insertData, error: insertError } = await supabase
        .from('user_vocabulary')
        .insert({
          user_id: session.user.id,
          word: testWord,
          meaning_en: 'test meaning',
          meaning_zh: '测试含义',
          example: 'This is a test example.'
        })
        .select()
      
      if (insertError) {
        if (insertError.code === '23505') {
          setStatus('✅ Table exists and constraints working (duplicate key prevented)')
        } else if (insertError.code === '42501') {
          throw new Error(`RLS policy violation: ${insertError.message}. User ID: ${session.user.id}`)
        } else {
          throw new Error(`Insert error: ${insertError.message}`)
        }
      } else {
        setStatus('✅ Table exists and insert working correctly!')
        
        // Clean up test record
        await supabase
          .from('user_vocabulary')
          .delete()
          .eq('word', testWord)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('❌ Test failed')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <p className="font-semibold">Status: {status}</p>
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 