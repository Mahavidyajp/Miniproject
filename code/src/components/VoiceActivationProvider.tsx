import { useEffect, useRef, useCallback, useState } from 'react';
import { useApp } from '@/lib/appContext';
import { toast } from 'sonner';

interface VoiceActivationProviderProps {
  children: React.ReactNode;
}

export function VoiceActivationProvider({ children }: VoiceActivationProviderProps) {
  const { features, triggerSOS, currentScreen, sosActive } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [lastDetectedKeyword, setLastDetectedKeyword] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<boolean>(false);

  const keywords = ['help', 'emergency', 'sos', 'call 911', 'save me'];

  const handleKeywordDetected = useCallback((keyword: string) => {
    if (cooldownRef.current || sosActive) return;
    
    cooldownRef.current = true;
    setLastDetectedKeyword(keyword);
    
    toast.warning(`Voice keyword "${keyword}" detected!`, {
      description: 'Triggering SOS in 3 seconds. Say "cancel" to abort.',
      duration: 3000,
    });

    setTimeout(() => {
      if (!cooldownRef.current) return;
      
      triggerSOS(false, 'voice');
      toast.error('SOS Triggered by Voice', {
        description: `Keyword "${keyword}" activated emergency mode.`,
      });
      
      setTimeout(() => {
        cooldownRef.current = false;
      }, 10000);
    }, 3000);
  }, [triggerSOS, sosActive]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    if (recognitionRef.current) {
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript.toLowerCase();
        }

        if (transcript.includes('cancel') && cooldownRef.current) {
          cooldownRef.current = false;
          toast.success('SOS Cancelled', {
            description: 'Voice command cancelled the emergency trigger.',
          });
          return;
        }

        for (const keyword of keywords) {
          if (transcript.includes(keyword.toLowerCase())) {
            handleKeywordDetected(keyword);
            break;
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setIsListening(false);
          recognitionRef.current = null;
          return;
        }
        
        if (event.error === 'no-speech' || event.error === 'aborted') {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            if (features.voiceDetection) {
              const currentRecognition = recognitionRef.current;
              if (currentRecognition) {
                try {
                  currentRecognition.start();
                } catch (e) {
                  console.log('Recognition restart failed:', e);
                  recognitionRef.current = null;
                }
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (features.voiceDetection && recognitionRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            const currentRecognition = recognitionRef.current;
            if (features.voiceDetection && currentRecognition) {
              try {
                currentRecognition.start();
              } catch (e) {
                console.log('Recognition restart failed:', e);
                recognitionRef.current = null;
              }
            }
          }, 1000);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      recognitionRef.current = null;
    }
  }, [features.voiceDetection, handleKeywordDetected]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    const recognition = recognitionRef.current;
    if (recognition) {
      recognitionRef.current = null;
      try {
        recognition.stop();
      } catch (e) {
        console.log('Recognition stop failed:', e);
      }
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    const shouldListen = features.voiceDetection && 
      currentScreen !== 'welcome' && 
      currentScreen !== 'disguise-selection' &&
      currentScreen !== 'password-setup' &&
      currentScreen !== 'contacts-setup' &&
      currentScreen !== 'permissions-setup';

    if (shouldListen) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [features.voiceDetection, currentScreen, startListening, stopListening]);

  return <>{children}</>;
}
