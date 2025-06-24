import { useState, useCallback, useRef, useEffect } from 'react';

interface TTSOptions {
  voice?: string;
  provider?: 'ttsmaker' | 'azure';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useTTS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(async (
    text: string, 
    options: TTSOptions = {}
  ) => {
    const {
      voice = 'en-US-JennyNeural',
      provider = 'ttsmaker',
      onStart,
      onEnd,
      onError
    } = options;

    if (!text) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentText(text);
    
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      console.log(`Calling TTS API: /api/tts/${provider}`);
      const response = await fetch(`/api/tts/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          text, 
          voice,
          ssml: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to generate speech using ${provider}`;
        console.error('TTS API Error:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }

      const result = await response.json();
      
      // Handle Azure TTS response which returns a data URL
      if (result.url && result.url.startsWith('data:audio/')) {
        const base64Data = result.url.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(blob);
        return audioUrl;
      }
      
      // Handle direct binary response (for backward compatibility)
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.onplay = () => {
        setIsPlaying(true);
        onStart?.();
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        onEnd?.();
        // Clean up the object URL to prevent memory leaks
        if (audioRef.current) {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        }
      };
      
      audio.onerror = (e) => {
        const error = new Error(`Audio playback error: ${e}`);
        console.error('Audio error:', error);
        setError(error.message);
        onError?.(error);
        setIsLoading(false);
        setIsPlaying(false);
      };
      
      // Start playback
      await audio.play();
      return audio;
      
    } catch (err) {
      console.error('TTS Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return true;
    }
    return false;
  }, []);

  return {
    speak,
    stop,
    isLoading,
    isPlaying,
    error,
    currentText,
  };
};
