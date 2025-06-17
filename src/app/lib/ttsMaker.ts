export async function fetchTTSMakerAudio(text: string, voice: string = 'en-US-1'): Promise<string | null> {
  const res = await fetch('https://api.ttsmaker.com/v1/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_API_KEY', // 如有API Key请取消注释
    },
    body: JSON.stringify({
      text,
      voice,
      lang: 'en',
      format: 'mp3'
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.url || null;
} 