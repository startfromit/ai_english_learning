import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // 获取用户session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ remainingPlays: 0 });
    }

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    const MAX_DAILY_PLAYS = 10;
    
    const { data: usage, error } = await supabase
      .from('user_usage')
      .select('daily_play_count, last_play_date')
      .eq('id', session.user.id)
      .single();

    if (error || !usage || usage.last_play_date !== today) {
      return NextResponse.json({ remainingPlays: MAX_DAILY_PLAYS });
    }
    
    const remainingPlays = Math.max(0, MAX_DAILY_PLAYS - (usage.daily_play_count || 0));
    return NextResponse.json({ remainingPlays });
  } catch (error) {
    console.error('Error getting remaining plays:', error);
    return NextResponse.json(
      { error: 'Failed to get remaining plays' },
      { status: 500 }
    );
  }
} 