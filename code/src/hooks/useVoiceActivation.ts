import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceActivationOptions {
  keywords: string[];
  enabled: boolean;
  onKeywordDetected: (keyword: string) => void;
  sensitivity?: number;
}

export function useVoiceActivation({
  keywords,
  enabled,
  onKeywordDetected,
  sensitivity = 0.7
}: UseVoiceActivationOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).toLowerCase();
        setTranscript(fullTranscript);

        keywords.forEach(keyword => {
          if (fullTranscript.includes(keyword.toLowerCase())) {
            onKeywordDetected(keyword);
          }
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            if (enabled && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Recognition restart failed:', e);
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (enabled) {
          restartTimeoutRef.current = setTimeout(() => {
            if (enabled && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Recognition restart failed:', e);
              }
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start voice detection');
    }
  }, [keywords, enabled, onKeywordDetected]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition stop failed:', e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isListening,
    error,
    transcript,
    startListening,
    stopListening
  };
}
