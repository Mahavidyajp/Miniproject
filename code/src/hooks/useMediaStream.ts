import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

interface MediaStreamData {
  audioChunks: string[];
  videoFrame?: string;
  timestamp: string;
  isStreaming: boolean;
}

interface UseMediaStreamOptions {
  userId: string;
  sosEventId: string;
  onStreamUpdate?: (data: MediaStreamData) => void;
}

export function useMediaStream({ userId, sosEventId, onStreamUpdate }: UseMediaStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startStreaming = useCallback(async (includeVideo = true, includeAudio = true) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: includeAudio,
        video: includeVideo ? { facingMode: 'environment', width: 320, height: 240 } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setIsStreaming(true);

      if (includeAudio && stream.getAudioTracks().length > 0) {
        const audioRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioRecorderRef.current = audioRecorder;

        audioRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              audioChunksRef.current.push(base64Audio);
              
              if (audioChunksRef.current.length > 10) {
                audioChunksRef.current.shift();
              }

              await updateStreamData();
            };
            reader.readAsDataURL(event.data);
          }
        };

        audioRecorder.start(2000);
      }

      if (includeVideo && stream.getVideoTracks().length > 0) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;
        }
        if (!videoRef.current) {
          videoRef.current = document.createElement('video');
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
        }
        
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        videoIntervalRef.current = setInterval(async () => {
          if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 320, 240);
              const frameData = canvasRef.current.toDataURL('image/jpeg', 0.5);
              await updateStreamData(frameData);
            }
          }
        }, 3000);
      }

    } catch (err: any) {
      console.error('Failed to start media stream:', err);
      setError(err.message || 'Failed to access camera/microphone');
      setIsStreaming(false);
    }
  }, [userId, sosEventId]);

  const updateStreamData = useCallback(async (videoFrame?: string) => {
    try {
      const streamData: MediaStreamData = {
        audioChunks: audioChunksRef.current.slice(-5),
        videoFrame,
        timestamp: new Date().toISOString(),
        isStreaming: true
      };

      const streamRef = doc(db, 'users', userId, 'sosEvents', sosEventId, 'stream', 'live');
      await setDoc(streamRef, streamData);

      if (onStreamUpdate) {
        onStreamUpdate(streamData);
      }
    } catch (err) {
      console.error('Failed to update stream data:', err);
    }
  }, [userId, sosEventId, onStreamUpdate]);

  const stopStreaming = useCallback(async () => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsStreaming(false);

    try {
      const streamRef = doc(db, 'users', userId, 'sosEvents', sosEventId, 'stream', 'live');
      await setDoc(streamRef, { isStreaming: false, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to update stream status:', err);
    }
  }, [userId, sosEventId]);

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    isStreaming,
    error,
    startStreaming,
    stopStreaming
  };
}

export function useStreamSubscription(userId: string, sosEventId: string) {
  const [streamData, setStreamData] = useState<MediaStreamData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId || !sosEventId) return;

    const streamRef = doc(db, 'users', userId, 'sosEvents', sosEventId, 'stream', 'live');
    const unsubscribe: Unsubscribe = onSnapshot(streamRef, (doc) => {
      if (doc.exists()) {
        setStreamData(doc.data() as MediaStreamData);
        setIsConnected(true);
      } else {
        setStreamData(null);
        setIsConnected(false);
      }
    }, (error) => {
      console.error('Stream subscription error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, [userId, sosEventId]);

  return { streamData, isConnected };
}
