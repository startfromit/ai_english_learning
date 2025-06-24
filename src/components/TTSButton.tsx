import { useTTS } from '@/hooks/useTTS';
import { Button } from './ui/button';
import { Volume2, Loader2, VolumeX, Volume1, VolumeX as StopIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TTSButtonProps {
  text: string;
  voice?: string;
  provider?: 'ttsmaker' | 'azure';
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon' | null | undefined;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null | undefined;
  showText?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: Error) => void;
}

export function TTSButton({ 
  text, 
  voice = 'en-US-JennyNeural',
  provider = 'ttsmaker',
  className = '',
  size = 'icon',
  variant = 'ghost',
  showText = false,
  onPlayStart,
  onPlayEnd,
  onError
}: TTSButtonProps) {
  const { 
    speak, 
    stop, 
    isLoading, 
    isPlaying, 
    error, 
    currentText 
  } = useTTS();
  
  const [showError, setShowError] = useState(false);
  const isCurrentTextPlaying = isPlaying && currentText === text;

  const handleClick = async () => {
    try {
      setShowError(false);
      
      if (isCurrentTextPlaying) {
        stop();
        return;
      }
      
      console.log('Initiating TTS with provider:', provider, 'voice:', voice);
      
      const result = await speak(text, { 
        voice, 
        provider,
        onStart: () => {
          console.log('TTS playback started');
          onPlayStart?.();
        },
        onEnd: () => {
          console.log('TTS playback ended');
          onPlayEnd?.();
        },
        onError: (err) => {
          console.error('TTS playback error:', err);
          setShowError(true);
          onError?.(err);
        }
      });
      
      console.log('TTS result:', result ? 'success' : 'failed');
      
    } catch (err) {
      console.error('TTS Error:', err);
      setShowError(true);
      onError?.(err instanceof Error ? err : new Error('Failed to play audio'));
    }
  };

  useEffect(() => {
    if (error) {
      console.error('TTS Error:', error);
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-hide error after 3 seconds
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const getButtonIcon = () => {
    if (isLoading && currentText === text) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (showError) {
      return <VolumeX className="h-4 w-4 text-red-500" />;
    }
    if (isCurrentTextPlaying) {
      return <StopIcon className="h-4 w-4" />;
    }
    return <Volume2 className="h-4 w-4" />;
  };

  const buttonText = isCurrentTextPlaying 
    ? 'Stop' 
    : isLoading && currentText === text 
      ? 'Generating...' 
      : 'Listen';

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Button
        type="button"
        onClick={handleClick}
        disabled={isLoading && currentText === text}
        size={size}
        variant={variant}
        className={cn({
          'text-red-500': showError,
          'text-primary': isCurrentTextPlaying,
        })}
        aria-label={isCurrentTextPlaying ? 'Stop playback' : 'Play text to speech'}
        title={text}
      >
        {getButtonIcon()}
        {showText && (
          <span className="ml-2">
            {buttonText}
          </span>
        )}
      </Button>
      
      {showError && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-200 rounded whitespace-nowrap z-10 shadow-md">
          Failed to play audio
        </div>
      )}
    </div>
  );
}
