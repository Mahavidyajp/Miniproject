import { useState, useEffect, useCallback, useRef } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  address?: string;
}

export interface GeolocationState {
  location: LocationData | null;
  locationHistory: LocationData[];
  error: string | null;
  isTracking: boolean;
  isLoading: boolean;
  permissionStatus: PermissionState | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    locationHistory: [],
    error: null,
    isTracking: false,
    isLoading: false,
    permissionStatus: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const historyRef = useRef<LocationData[]>([]);

  // Reverse geocode to get address
  const getAddress = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const address = await getAddress(position.coords.latitude, position.coords.longitude);
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            address,
          };
          
          setState(prev => ({
            ...prev,
            location: locationData,
            isLoading: false,
            error: null,
          }));
          resolve(locationData);
        },
        (error) => {
          const errorMessages: Record<number, string> = {
            1: 'Location permission denied',
            2: 'Position unavailable',
            3: 'Location request timed out',
          };
          setState(prev => ({
            ...prev,
            error: errorMessages[error.code] || 'Unknown error',
            isLoading: false,
          }));
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, [getAddress]);

  // Start continuous tracking
  const startTracking = useCallback(async (intervalMs: number = 10000) => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    historyRef.current = [];
    setState(prev => ({ ...prev, isTracking: true, locationHistory: [], error: null }));

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const address = await getAddress(position.coords.latitude, position.coords.longitude);
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          address,
        };

        historyRef.current = [...historyRef.current, locationData].slice(-100); // Keep last 100 points
        
        setState(prev => ({
          ...prev,
          location: locationData,
          locationHistory: historyRef.current,
          error: null,
        }));
      },
      (error) => {
        const errorMessages: Record<number, string> = {
          1: 'Location permission denied',
          2: 'Position unavailable',
          3: 'Location request timed out',
        };
        setState(prev => ({
          ...prev,
          error: errorMessages[error.code] || 'Unknown error',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: intervalMs,
      }
    );

    watchIdRef.current = watchId;
  }, [getAddress]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Check permission status
  const checkPermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setState(prev => ({ ...prev, permissionStatus: permission.state }));
      
      permission.addEventListener('change', () => {
        setState(prev => ({ ...prev, permissionStatus: permission.state }));
      });
    } catch {
      // Permissions API not supported
    }
  }, []);

  // Generate shareable Google Maps link
  const getShareableLink = useCallback((location: LocationData): string => {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }, []);

  // Generate emergency message with location
  const generateEmergencyMessage = useCallback((location: LocationData): string => {
    const mapsLink = getShareableLink(location);
    const accuracy = Math.round(location.accuracy);
    const timestamp = new Date(location.timestamp).toLocaleTimeString();
    
    return `🆘 EMERGENCY ALERT\n\nI need help! My current location:\n📍 ${location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}\n\n🗺️ Map: ${mapsLink}\n\n⏱️ Time: ${timestamp}\n📏 Accuracy: ±${accuracy}m`;
  }, [getShareableLink]);

  // Cleanup on unmount
  useEffect(() => {
    checkPermission();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [checkPermission]);

  return {
    ...state,
    getCurrentLocation,
    startTracking,
    stopTracking,
    getShareableLink,
    generateEmergencyMessage,
    checkPermission,
  };
}