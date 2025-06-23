import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_DAILY_PLAYS = 20;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No session or user email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user email:', session.user.email);

    // Get user ID from session
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('Error getting user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData) {
      console.log('No user data found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userData.id;
    console.log('User ID:', userId);

    // Try to use the database function, but fallback to manual check if it fails
    try {
      const { data: currentCount, error: countError } = await supabase
        .rpc('check_and_reset_daily_play_count', { user_id: userId });

      if (countError) {
        console.error('Database function error:', countError);
        // Fallback to manual check
        const today = new Date().toISOString().split('T')[0];
        const { data: usage, error: usageError } = await supabase
          .from('user_usage')
          .select('daily_play_count, last_play_date')
          .eq('id', userId)
          .single();

        if (usageError && usageError.code !== 'PGRST116') {
          console.error('Error getting usage data:', usageError);
          return NextResponse.json({ error: 'Failed to check play count' }, { status: 500 });
        }

        let currentCount = 0;
        if (usage && usage.last_play_date === today) {
          currentCount = usage.daily_play_count || 0;
        }

        const remaining = Math.max(0, MAX_DAILY_PLAYS - currentCount);
        return NextResponse.json({ 
          remaining,
          used: currentCount,
          total: MAX_DAILY_PLAYS
        });
      }

      const remaining = Math.max(0, MAX_DAILY_PLAYS - currentCount);
      return NextResponse.json({ 
        remaining,
        used: currentCount,
        total: MAX_DAILY_PLAYS
      });

    } catch (functionError) {
      console.error('Function call error:', functionError);
      // Fallback to manual check
      const today = new Date().toISOString().split('T')[0];
      const { data: usage, error: usageError } = await supabase
        .from('user_usage')
        .select('daily_play_count, last_play_date')
        .eq('id', userId)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Error getting usage data:', usageError);
        return NextResponse.json({ error: 'Failed to check play count' }, { status: 500 });
      }

      let currentCount = 0;
      if (usage && usage.last_play_date === today) {
        currentCount = usage.daily_play_count || 0;
      }

      const remaining = Math.max(0, MAX_DAILY_PLAYS - currentCount);
      return NextResponse.json({ 
        remaining,
        used: currentCount,
        total: MAX_DAILY_PLAYS
      });
    }

  } catch (error) {
    console.error('Get remaining plays error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 