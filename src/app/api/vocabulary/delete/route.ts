import { createClient } from '@supabase/supabase-js'
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

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing vocabulary item ID' }, { status: 400 })
    }

    // 使用环境变量直接创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from('user_vocabulary')
      .delete()
      .match({ id: id, user_id: session.user.id })

    if (error) {
      console.error('Error deleting vocabulary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Vocabulary item deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in vocabulary delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 