import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

const MAX_DAILY_PLAYS = 20;

export async function POST(request: Request) {
  try {
    // Get user session
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const { text, voice } = await request.json();

    if (!text || !voice) {
      return NextResponse.json(
        { error: 'Missing text or voice' }, 
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Check and increment play count
    const { data: newCount, error: countError } = await supabase
      .rpc('increment_play_count', { user_id: userId });

    if (countError) {
      console.error('Error incrementing play count:', countError);
      return NextResponse.json(
        { error: 'Failed to update play count' }, 
        { status: 500 }
      );
    }

    // Check daily limit
    if (newCount > MAX_DAILY_PLAYS) {
      const acceptLanguage = request.headers.get('accept-language') || '';
      const isChinese = acceptLanguage.includes('zh') || 
                      acceptLanguage.includes('zh-CN') || 
                      acceptLanguage.includes('zh-TW');
      
      const message = isChinese 
        ? '可用播放次数不足，目前未开放充值渠道，请明日再试（每日限制：20次）'
        : 'Insufficient play credits. Recharge feature is not available yet. Please try again tomorrow. (Daily limit: 20 plays)';
      
      return NextResponse.json(
        { 
          error: 'Daily play limit reached', 
          message,
          remaining: 0 
        },
        { status: 429 }
      );
    }

    // Generate TTS using TTSMaker
    const ttsResponse = await fetch('https://api.ttsmaker.com/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TTSMAKER_API_KEY}`
      },
      body: JSON.stringify({
        text: text,
        voice: voice,
        format: 'mp3',
        quality: 'high'
      })
    });

    if (!ttsResponse.ok) {
      console.error('TTSMaker Error:', ttsResponse.status, ttsResponse.statusText);
      return NextResponse.json(
        { error: 'TTS generation failed' },
        { status: 500 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    return NextResponse.json({ 
      url: audioUrl,
      remaining: MAX_DAILY_PLAYS - newCount
    });

  } catch (error) {
    console.error('TTSMaker API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
