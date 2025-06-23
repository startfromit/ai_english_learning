import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 使用环境变量直接创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    console.log('Fetching vocabulary for user:', session.user.id, 'page:', page, 'limit:', limit)

    // Get total count first
    const { count, error: countError } = await supabase
      .from('user_vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)
    const hasMore = page < totalPages

    console.log('Successfully fetched vocabulary items:', data?.length || 0, 'of', count, 'total')
    
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error('Unexpected error in vocabulary GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 