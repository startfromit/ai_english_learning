import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_DAILY_PLAYS = 20;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { text, voice, ssml = false } = req.body;

    if (!text || !voice) {
      return res.status(400).json({ error: 'Missing text or voice' });
    }

    // Get user ID from session
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userData.id;

    // Check and reset daily play count if it's a new day, then increment
    const { data: newCount, error: countError } = await supabase
      .rpc('increment_play_count', { user_id: userId });

    if (countError) {
      console.error('Error incrementing play count:', countError);
      return res.status(500).json({ error: 'Failed to update play count' });
    }

    // Check if user has reached the limit (after increment)
    if (newCount > MAX_DAILY_PLAYS) {
      const acceptLanguage = req.headers['accept-language'] || '';
      const isChinese = acceptLanguage.includes('zh') || acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh-TW');
      
      const message = isChinese 
        ? '可用播放次数不足，目前未开放充值渠道，请明日再试（每日限制：20次）'
        : 'Insufficient play credits. Recharge feature is not available yet. Please try again tomorrow. (Daily limit: 20 plays)';
      
      res.status(429).json({ 
        error: 'Daily play limit reached', 
        message,
        remaining: 0 
      });
      return;
    }

    // Generate TTS using Azure
    const ttsText = ssml ? text : `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${text}</voice></speak>`;
    
    const response = await fetch(`https://${process.env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Type': ssml ? 'application/ssml+xml' : 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'ai-english-learning'
      },
      body: ttsText
    });

    if (!response.ok) {
      console.error('Azure TTS Error:', response.status, response.statusText);
      return res.status(500).json({ error: 'TTS generation failed' });
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    res.status(200).json({ 
      url: audioUrl,
      remaining: MAX_DAILY_PLAYS - newCount
    });

  } catch (error) {
    console.error('Azure TTS API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 