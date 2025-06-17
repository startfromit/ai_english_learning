export type TTSEngine = 'azure' | 'ttsmaker';

export interface TTSOptions {
  text: string;
  voice: string;
  engine: TTSEngine;
}

export async function getTTSUrl({ text, voice, engine }: TTSOptions): Promise<string | null> {
  if (engine === 'ttsmaker') {
    // TTSMaker
    const res = await fetch('https://api.ttsmaker.com/v1/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, lang: 'en', format: 'mp3' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url || null;
  }

  if (engine === 'azure') {
    // 推荐：将此请求转发到你自己的 serverless API，避免密钥泄露
    const res = await fetch('/api/azure-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url || null;
  }

  // 其它引擎可在此扩展
  return null;
} 