export type TTSEngine = 'azure' | 'ttsmaker';

export interface TTSOptions {
  text: string;
  voice: string;
  engine: TTSEngine;
}

export interface TTSError {
  error: string;
  message: string;
  remaining?: number;
}

export async function getTTSUrl({ text, voice, engine, ssml = false }: TTSOptions & { ssml?: boolean }): Promise<string | null> {
  try {
    if (!text) {
      throw new Error('Text is required for TTS');
    }

    const endpoint = `/api/tts/${engine}`;
    const requestBody = { 
      text, 
      voice,
      ssml,
      timestamp: new Date().toISOString()
    };

    console.log(`[TTS] Calling API: ${endpoint}`, { 
      textLength: text.length,
      voice,
      engine,
      ssml,
      timestamp: requestBody.timestamp
    });
    
    const startTime = performance.now();
    let response;
    
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': navigator.language || 'en',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
    } catch (networkError) {
      console.error('[TTS] Network error:', networkError);
      throw new Error('Network error while calling TTS service');
    }

    const responseTime = Math.round(performance.now() - startTime);
    console.log(`[TTS] Response status: ${response.status} (${responseTime}ms)`);
    
    let responseData;
    try {
      responseData = await response.json().catch(() => ({}));
    } catch (parseError) {
      console.error('[TTS] Failed to parse JSON response:', parseError);
      throw new Error('Invalid response from TTS service');
    }
    
    console.log('[TTS] Response data:', responseData);
    
    if (response.status === 429) {
      const errorMessage = responseData.message || 'Daily play limit reached';
      console.warn(`[TTS] Rate limited: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorMessage = responseData.error || 
                         responseData.message || 
                         `TTS API error: ${response.status} ${response.statusText}`;
      console.error(`[TTS] API error (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    // 处理不同格式的响应
    const audioUrl = responseData.url || responseData.audioUrl;
    if (audioUrl) {
      console.log('[TTS] Successfully got audio URL');
      return audioUrl;
    }
    
    console.error('[TTS] No audio URL in response:', responseData);
    throw new Error('No audio URL in TTS response');
    
  } catch (error) {
    console.error('[TTS] Error in getTTSUrl:', {
      error,
      textLength: text?.length,
      voice,
      engine,
      ssml
    });
    
    // 如果是我们抛出的错误，直接传递
    if (error instanceof Error) {
      throw error;
    }
    
    // 处理非Error对象
    throw new Error(typeof error === 'string' ? error : 'Unknown TTS error');
  }
} 