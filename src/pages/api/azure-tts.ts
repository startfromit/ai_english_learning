import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text, voice, ssml } = req.body;
  const subscriptionKey = process.env.AZURE_TTS_KEY!;
  const region = process.env.AZURE_TTS_REGION!;

  if (!subscriptionKey || !region) {
    res.status(500).json({ error: 'Azure TTS key or region not set' });
    return;
  }

  const sdk = require('microsoft-cognitiveservices-speech-sdk');

  const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
  speechConfig.speechSynthesisVoiceName = voice;
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  try {
    const result = await new Promise<any>((resolve, reject) => {
      const callback = (result: any) => resolve(result);
      const errorCallback = (error: any) => reject(error);

      if (ssml || (typeof text === 'string' && text.trim().startsWith('<speak'))) {
        synthesizer.speakSsmlAsync(text, callback, errorCallback);
      } else {
        synthesizer.speakTextAsync(text, callback, errorCallback);
      }
    });

    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
      const buffer = Buffer.from(result.audioData);
      const base64 = buffer.toString('base64');
      res.status(200).json({ url: `data:audio/mp3;base64,${base64}` });
    } else {
      res.status(500).json({ error: 'Azure TTS failed', details: result.errorDetails });
    }
  } catch (error) {
    res.status(500).json({ error: 'Azure TTS failed', details: error });
  } finally {
    synthesizer.close();
  }
} 