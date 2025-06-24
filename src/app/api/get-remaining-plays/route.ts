import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
);

const MAX_DAILY_PLAYS = 20;

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Log session info for debugging
    console.log('Session in get-remaining-plays:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });

    if (!session?.user?.email) {
      console.log('No session or user email found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        session: !!session,
        hasUser: !!session?.user,
        hasEmail: !!session?.user?.email
      }, { status: 401 });
    }

    // Try to get user by email first
    let userId = session.user.id;
    
    // If no user ID in session, try to get it from the users table
    if (!userId) {
      console.log('No user ID in session, trying to get from users table');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (userError || !userData) {
        console.error('Error getting user data:', userError || 'No user data found');
        return NextResponse.json({ 
          error: 'User not found',
          details: userError?.message || 'No user data found'
        }, { status: 404 });
      }
      userId = userData.id;
    }

    console.log('Using user ID:', userId);

    // Try to use the database function, but fallback to manual check if it fails
    try {
      const { data: currentCount, error: countError } = await supabase
        .rpc('check_and_reset_daily_play_count', { user_id: userId });

      if (countError) {
        console.error('Database function error, falling back to manual check:', countError);
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