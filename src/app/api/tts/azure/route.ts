import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

const MAX_DAILY_PLAYS = 20;

// Helper function to format error responses
function errorResponse(message: string, status: number, details?: any) {
  console.error(`[Azure TTS] Error (${status}):`, message, details || '');
  return NextResponse.json(
    { 
      error: message,
      ...(details && { details: JSON.stringify(details) })
    },
    { status }
  );
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10);
  
  console.log(`[${requestId}] [Azure TTS] Starting request`);
  
  try {
    // Get user session
    const user = await getCurrentUser();
    if (!user?.email) {
      console.log(`[${requestId}] [Azure TTS] Unauthorized - no user session`);
      return errorResponse('Unauthorized', 401);
    }
    
    console.log(`[${requestId}] [Azure TTS] User: ${user.email}`);

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log(`[${requestId}] [Azure TTS] Request body:`, { 
        textLength: requestBody?.text?.length,
        voice: requestBody?.voice,
        ssml: requestBody?.ssml
      });
    } catch (parseError) {
      console.error(`[${requestId}] [Azure TTS] Failed to parse request body:`, parseError);
      return errorResponse('Invalid request body', 400);
    }

    const { text, voice, ssml = false } = requestBody;

    if (!text || !voice) {
      console.log(`[${requestId}] [Azure TTS] Missing required fields`, { 
        hasText: !!text, 
        hasVoice: !!voice 
      });
      return errorResponse('Missing text or voice', 400);
    }

    // Initialize Supabase client
    const supabase = createClient();
    
    console.log(`[${requestId}] [Azure TTS] Fetching user data`);
    
    // Get the user ID and check if we need to reset the daily count
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      console.error(`[${requestId}] [Azure TTS] User not found:`, userError);
      return errorResponse('User not found', 404);
    }

    const userId = userData.id;
    
    // Use the database function to increment play count
    const { data: newCount, error: countError } = await supabase
      .rpc('increment_play_count', { user_id: userId });

    if (countError) {
      console.error(`[${requestId}] [Azure TTS] Error incrementing play count:`, countError);
      return errorResponse('Failed to update play count', 500, countError);
    }

    console.log(`[${requestId}] [Azure TTS] User ID: ${userId}, New play count: ${newCount}`);

    // Check daily limit
    if (newCount > MAX_DAILY_PLAYS) {
      const message = `Daily play limit of ${MAX_DAILY_PLAYS} reached`;
      console.warn(`[${requestId}] [Azure TTS] ${message}`);
      return NextResponse.json(
        { 
          error: message,
          remaining: 0,
          current: newCount,
          limit: MAX_DAILY_PLAYS
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_DAILY_PLAYS.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    // Generate TTS using Azure
    const ttsText = ssml 
      ? text 
      : `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${text}</voice></speak>`;
    
    // Get Azure TTS credentials from environment
    const azureKey = process.env.AZURE_TTS_KEY;
    const azureRegion = process.env.AZURE_TTS_REGION || 'eastus';

    if (!azureKey) {
      const error = 'Azure TTS key not configured';
      console.error(`[${requestId}] [Azure TTS] ${error}`);
      return errorResponse('TTS service not configured', 500);
    }
    
    console.log(`[${requestId}] [Azure TTS] Using Azure region: ${azureRegion}`);
    
    const endpoint = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    console.log('Calling Azure TTS endpoint:', endpoint);
    console.log(`[${requestId}] [Azure TTS] Calling Azure TTS API`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'ai-english-learning',
          'X-Request-ID': requestId
        },
        body: ttsText
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error(`[${requestId}] [Azure TTS] API error (${response.status} ${response.statusText} in ${responseTime}ms):`, errorText);
        } catch (e) {
          errorText = 'Failed to read error response';
          console.error(`[${requestId}] [Azure TTS] API error (${response.status} ${response.statusText} in ${responseTime}ms):`, 'No error details available');
        }
        
        throw new Error(`Azure TTS API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      console.log(`[${requestId}] [Azure TTS] API call successful (${response.status} in ${responseTime}ms)`);
      
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      
      const totalTime = Date.now() - startTime;
      console.log(`[${requestId}] [Azure TTS] Audio generated successfully in ${totalTime}ms`);

      return NextResponse.json({
        url: audioUrl,
        remaining: Math.max(0, MAX_DAILY_PLAYS - newCount),
        limit: MAX_DAILY_PLAYS,
        requestId
      }, {
        headers: {
          'X-RateLimit-Limit': MAX_DAILY_PLAYS.toString(),
          'X-RateLimit-Remaining': Math.max(0, MAX_DAILY_PLAYS - newCount).toString(),
          'X-Request-ID': requestId,
          'X-Response-Time': totalTime.toString()
        }
      });

    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`[${requestId}] [Azure TTS] Error in API call (${errorTime}ms):`, error);
      throw error;
    }

  } catch (error) {
    console.error('Azure TTS API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[${requestId}] [Azure TTS] Handling CORS preflight request`);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Request-ID',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
      'X-Request-ID': requestId,
      'X-TTS-Service': 'Azure',
      'X-TTS-Version': '1.0'
    },
  });
};
