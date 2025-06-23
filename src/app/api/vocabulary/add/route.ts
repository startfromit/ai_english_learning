import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { word, meaning_en, meaning_zh, example } = await req.json()

    if (!word || !meaning_en || !meaning_zh || !example) {
      return NextResponse.json({ error: 'Missing required vocabulary data' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    console.log('Adding vocabulary for user:', session.user.id, 'word:', word)

    const insertData = {
      user_id: session.user.id,
      word,
      meaning_en,
      meaning_zh,
      example,
    }
    
    console.log('Insert data:', insertData)

    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error adding vocabulary:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Word already exists in your vocabulary.' }, { status: 409 })
      }
      if (error.code === '42501') { // RLS policy violation
        console.error('RLS policy violation. User ID:', session.user.id)
        return NextResponse.json({ error: 'Permission denied. Please try logging in again.' }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully added vocabulary item:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error in vocabulary add:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 