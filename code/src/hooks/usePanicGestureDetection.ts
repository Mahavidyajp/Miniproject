import { useState, useRef, useCallback, useEffect } from 'react';

interface PanicGestureResult {
  panicGestureDetected: boolean;
  confidenceScore: number;
  error?: string;
}

interface UsePanicGestureDetectionReturn {
  isActive: boolean;
  isLoading: boolean;
  lastResult: PanicGestureResult | null;
  error: string | null;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const DETECTION_INTERVAL_MS = 2000;
const CONFIDENCE_THRESHOLD = 0.7;

export function usePanicGestureDetection(
  onPanicDetected: () => void,
  enabled: boolean = true
): UsePanicGestureDetectionReturn {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<PanicGestureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const consecutiveDetectionsRef = useRef<number>(0);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const detectPanicGesture = useCallback(async (frameDataUri: string): Promise<PanicGestureResult> => {
    try {
      const response = await fetch('/api/detect-panic-gesture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoFrameDataUri: frameDataUri }),
      });

      if (!response.ok) {
        throw new Error('Detection request failed');
      }

      return await response.json();
    } catch (err) {
      console.error('Panic gesture detection error:', err);
      return {
        panicGestureDetected: false,
        confidenceScore: 0,
        error: err instanceof Error ? err.message : 'Detection failed',
      };
    }
  }, []);

  const runDetectionCycle = useCallback(async () => {
    if (!isActive || !enabled) return;

    const frame = captureFrame();
    if (!frame) return;

    setIsLoading(true);
    const result = await detectPanicGesture(frame);
    setLastResult(result);
    setIsLoading(false);

    if (result.panicGestureDetected && result.confidenceScore >= CONFIDENCE_THRESHOLD) {
      consecutiveDetectionsRef.current++;
      if (consecutiveDetectionsRef.current >= 2) {
        onPanicDetected();
        consecutiveDetectionsRef.current = 0;
      }
    } else {
      consecutiveDetectionsRef.current = 0;
    }
  }, [isActive, enabled, captureFrame, detectPanicGesture, onPanicDetected]);

  const startDetection = useCallback(async () => {
    if (!enabled) {
      setError('Gesture detection is disabled');
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      consecutiveDetectionsRef.current = 0;
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Camera access denied or unavailable');
      setIsActive(false);
    }
  }, [enabled]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setLastResult(null);
    consecutiveDetectionsRef.current = 0;
  }, []);

  useEffect(() => {
    if (isActive && enabled) {
      intervalRef.current = window.setInterval(runDetectionCycle, DETECTION_INTERVAL_MS);
      runDetectionCycle();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, enabled, runDetectionCycle]);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isActive,
    isLoading,
    lastResult,
    error,
    startDetection,
    stopDetection,
    videoRef,
  };
}
