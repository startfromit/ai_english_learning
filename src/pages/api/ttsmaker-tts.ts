import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text, voice } = req.body;

  // 获取用户session
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // 检查用户播放次数
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const MAX_DAILY_PLAYS = 10;
  
  // Get or create user usage record
  const { data: usage, error } = await supabase
    .from('user_usage')
    .select('daily_play_count, last_play_date')
    .eq('id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error getting user usage:', error);
    res.status(500).json({ error: 'Failed to check usage' });
    return;
  }

  // If no record exists or it's a new day, create/update one
  if (!usage || usage.last_play_date !== today) {
    const { error: upsertError } = await supabase
      .from('user_usage')
      .upsert({
        id: session.user.id,
        daily_play_count: 1,
        last_play_date: today,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (upsertError) {
      console.error('Error creating user usage:', upsertError);
      res.status(500).json({ error: 'Failed to update usage' });
      return;
    }
  } else {
    // Check if user has reached the limit
    if (usage.daily_play_count >= MAX_DAILY_PLAYS) {
      const acceptLanguage = req.headers['accept-language'] || '';
      const isChinese = acceptLanguage.includes('zh') || acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh-TW');
      
      const message = isChinese 
        ? '可用播放次数不足，目前未开放充值渠道，请明日再试'
        : 'Insufficient play credits. Recharge feature is not available yet. Please try again tomorrow.';
      
      res.status(429).json({ 
        error: 'Daily play limit reached', 
        message,
        remaining: 0 
      });
      return;
    }
    
    // Increment the play count
    const { error: updateError } = await supabase
      .from('user_usage')
      .update({
        daily_play_count: usage.daily_play_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);
    
    if (updateError) {
      console.error('Error incrementing play count:', updateError);
      res.status(500).json({ error: 'Failed to update usage' });
      return;
    }
  }

  try {
    const response = await fetch('https://api.ttsmaker.com/v1/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, lang: 'en', format: 'mp3' }),
    });

    if (!response.ok) {
      res.status(response.status).json({ error: 'TTSMaker API failed' });
      return;
    }

    const data = await response.json();
    const remaining = usage ? MAX_DAILY_PLAYS - (usage.daily_play_count + 1) : MAX_DAILY_PLAYS - 1;
    res.status(200).json({ 
      url: data?.url || null,
      remaining: Math.max(0, remaining)
    });
  } catch (error) {
    res.status(500).json({ error: 'TTSMaker API failed', details: error });
  }
} 