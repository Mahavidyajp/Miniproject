import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getUserData, updateUserData, createSOSEvent, resolveSOSEvent, type UserData } from '@/lib/firebase';

const STORAGE_KEY = 'guardian-sos-app-state';

export type DisguiseMode = 'calculator' | 'notes' | 'weather';
export type AppScreen = 
  | 'welcome' 
  | 'disguise-selection' 
  | 'permissions-setup'
  | 'password-setup'
  | 'contacts-setup'
  | 'setup-complete'
  | 'disguise' 
  | 'dashboard' 
  | 'sos-active'
  | 'settings'
  | 'safe-timer'
  | 'history'
  | 'help'
  | 'admin'
  | 'safe-map';

export type ThreatLevel = 'low' | 'medium' | 'high';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: 'primary' | 'secondary' | 'tertiary';
}

export interface SafeTimer {
  isActive: boolean;
  endTime: number | null;
  duration: number; // in minutes
  checkInCount: number;
  lastCheckIn: number | null;
}

export interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
  mapsLink: string;
}

interface AppState {
  currentScreen: AppScreen;
  disguiseMode: DisguiseMode;
  isAuthenticated: boolean;
  isSetupComplete: boolean;
  normalPassword: string;
  distressPassword: string;
  emergencyContacts: EmergencyContact[];
  threatLevel: ThreatLevel;
  sosActive: boolean;
  silentMode: boolean;
  distressTriggerTime: number | null;
  safeTimer: SafeTimer;
  sosLocation: SOSLocation | null;
  sosLocationHistory: SOSLocation[];
  activeSosEventId: string | null;
  displayName: string;
  email: string;
  bloodType: string;
  allergies: string;
  medications: string;
  emergencyMessage: string;
  features: {
    voiceDetection: boolean;
    gestureRecognition: boolean;
    movementTracking: boolean;
    autoRecording: boolean;
    locationTracking: boolean;
  };
}

interface AppContextType extends AppState {
  setScreen: (screen: AppScreen) => void;
  setDisguiseMode: (mode: DisguiseMode) => void;
  authenticate: (password: string) => 'normal' | 'distress' | 'invalid';
  setupPasswords: (normal: string, distress: string) => void;
  changePassword: (type: 'normal' | 'distress', currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeContact: (id: string) => void;
  completeSetup: () => void;
  triggerSOS: (silent?: boolean, triggerMethod?: 'distress_password' | 'voice' | 'gesture' | 'manual' | 'safe_timer') => void;
  cancelSOS: (status?: 'resolved' | 'cancelled') => void;
  updateSOSLocation: (location: SOSLocation) => void;
  toggleFeature: (feature: keyof AppState['features']) => void;
  logout: () => void;
  startSafeTimer: (durationMinutes: number) => void;
  checkIn: () => void;
  cancelSafeTimer: () => void;
  extendSafeTimer: (additionalMinutes: number) => void;
  updateProfile: (data: { displayName?: string; bloodType?: string; allergies?: string; medications?: string; emergencyMessage?: string }) => void;
}

const defaultState: AppState = {
  currentScreen: 'welcome',
  disguiseMode: 'calculator',
  isAuthenticated: false,
  isSetupComplete: false,
  normalPassword: '',
  distressPassword: '',
  emergencyContacts: [],
  threatLevel: 'low',
  sosActive: false,
  silentMode: false,
  distressTriggerTime: null,
  safeTimer: {
    isActive: false,
    endTime: null,
    duration: 30,
    checkInCount: 0,
    lastCheckIn: null,
  },
  sosLocation: null,
  sosLocationHistory: [],
  activeSosEventId: null,
  displayName: '',
  email: '',
  bloodType: '',
  allergies: '',
  medications: '',
  emergencyMessage: '',
  features: {
    voiceDetection: true,
    gestureRecognition: true,
    movementTracking: true,
    autoRecording: true,
    locationTracking: true,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

interface PersistedState {
  normalPassword: string;
  distressPassword: string;
  isSetupComplete: boolean;
  disguiseMode: DisguiseMode;
  emergencyContacts: EmergencyContact[];
  features: AppState['features'];
  displayName?: string;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  emergencyMessage?: string;
}

function loadPersistedState(): Partial<AppState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: PersistedState = JSON.parse(saved);
      return {
        normalPassword: parsed.normalPassword || '',
        distressPassword: parsed.distressPassword || '',
        isSetupComplete: parsed.isSetupComplete || false,
        disguiseMode: parsed.disguiseMode || 'calculator',
        emergencyContacts: parsed.emergencyContacts || [],
        features: { ...defaultState.features, ...parsed.features },
        displayName: parsed.displayName || '',
        bloodType: parsed.bloodType || '',
        allergies: parsed.allergies || '',
        medications: parsed.medications || '',
        emergencyMessage: parsed.emergencyMessage || '',
      };
    }
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
  }
  return {};
}

export function AppProvider({ children, firebaseUserId }: { children: React.ReactNode; firebaseUserId?: string }) {
  const [state, setState] = useState<AppState>(() => {
    const persisted = loadPersistedState();
    return {
      ...defaultState,
      ...persisted,
      currentScreen: persisted.isSetupComplete ? 'disguise' : 'welcome',
    };
  });
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(!!firebaseUserId);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user data from Firebase on mount
  useEffect(() => {
    if (!firebaseUserId) return;

    const loadFirebaseData = async () => {
      try {
        const userData = await getUserData(firebaseUserId);
        if (userData) {
          setState(prev => ({
            ...prev,
            normalPassword: userData.normalPassword || '',
            distressPassword: userData.distressPassword || '',
            isSetupComplete: userData.isSetupComplete || false,
            disguiseMode: userData.disguiseMode || 'calculator',
            emergencyContacts: userData.emergencyContacts?.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              relationship: c.relationship,
              priority: c.priority,
            })) || [],
            features: {
              voiceDetection: userData.features?.voiceActivation ?? true,
              gestureRecognition: userData.features?.gestureDetection ?? true,
              movementTracking: userData.features?.movementTracking ?? true,
              autoRecording: userData.features?.autoRecord ?? true,
              locationTracking: userData.features?.shareLocation ?? true,
            },
            displayName: userData.displayName || '',
            email: userData.email || '',
            bloodType: (userData as any).bloodType || '',
            allergies: (userData as any).allergies || '',
            medications: (userData as any).medications || '',
            emergencyMessage: (userData as any).emergencyMessage || '',
            activeSosEventId: userData.activeSosEventId || null,
            currentScreen: userData.isSetupComplete ? 'disguise' : 'welcome',
          }));
        }
      } catch (error) {
        console.error('Failed to load Firebase data:', error);
      } finally {
        setIsLoadingFirebase(false);
      }
    };

    loadFirebaseData();
  }, [firebaseUserId]);

  // Persist state changes to localStorage and Firebase
  useEffect(() => {
    const toSave: PersistedState = {
      normalPassword: state.normalPassword,
      distressPassword: state.distressPassword,
      isSetupComplete: state.isSetupComplete,
      disguiseMode: state.disguiseMode,
      emergencyContacts: state.emergencyContacts,
      features: state.features,
      displayName: state.displayName,
      bloodType: state.bloodType,
      allergies: state.allergies,
      medications: state.medications,
      emergencyMessage: state.emergencyMessage,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }

    // Debounced Firebase save
    if (firebaseUserId && !isLoadingFirebase) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateUserData(firebaseUserId, {
            normalPassword: state.normalPassword,
            distressPassword: state.distressPassword,
            isSetupComplete: state.isSetupComplete,
            disguiseMode: state.disguiseMode,
            displayName: state.displayName,
            emergencyContacts: state.emergencyContacts.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              relationship: c.relationship,
              priority: c.priority,
              notifyBySMS: true,
              notifyByCall: true,
              notifyByEmail: false,
            })),
            features: {
              voiceActivation: state.features.voiceDetection,
              gestureDetection: state.features.gestureRecognition,
              movementTracking: state.features.movementTracking,
              silentMode: true,
              autoRecord: state.features.autoRecording,
              shareLocation: state.features.locationTracking,
              notifyContacts: true,
              safeTimer: true,
              periodicCheckIn: false,
              codeWord: 'pineapple',
            },
          } as any);
        } catch (error) {
          console.warn('Failed to save to Firebase:', error);
        }
      }, 1000);
    }
  }, [
    state.normalPassword,
    state.distressPassword,
    state.isSetupComplete,
    state.disguiseMode,
    state.emergencyContacts,
    state.features,
    state.displayName,
    state.bloodType,
    state.allergies,
    state.medications,
    state.emergencyMessage,
    firebaseUserId,
    isLoadingFirebase,
  ]);

  const setScreen = useCallback((screen: AppScreen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const setDisguiseMode = useCallback((mode: DisguiseMode) => {
    setState(prev => ({ ...prev, disguiseMode: mode }));
  }, []);

  const authenticate = useCallback((password: string): 'normal' | 'distress' | 'invalid' => {
    if (password === state.normalPassword) {
      setState(prev => ({ ...prev, isAuthenticated: true, currentScreen: 'dashboard' }));
      return 'normal';
    }
    if (password === state.distressPassword) {
      // Silent SOS trigger - stays on disguise but activates background SOS
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: true, 
        currentScreen: 'dashboard',
        sosActive: true, 
        silentMode: true,
        distressTriggerTime: Date.now(),
      }));
      return 'distress';
    }
    return 'invalid';
  }, [state.normalPassword, state.distressPassword]);

  const setupPasswords = useCallback((normal: string, distress: string) => {
    setState(prev => ({ ...prev, normalPassword: normal, distressPassword: distress }));
  }, []);

  const changePassword = useCallback((type: 'normal' | 'distress', currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
    const expectedCurrent = type === 'normal' ? state.normalPassword : state.distressPassword;
    
    if (currentPassword !== expectedCurrent) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    if (newPassword.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters' };
    }
    
    // Make sure normal and distress passwords are different
    const otherPassword = type === 'normal' ? state.distressPassword : state.normalPassword;
    if (newPassword === otherPassword) {
      return { success: false, error: 'Normal and distress passwords must be different' };
    }
    
    setState(prev => ({
      ...prev,
      [type === 'normal' ? 'normalPassword' : 'distressPassword']: newPassword,
    }));
    
    return { success: true };
  }, [state.normalPassword, state.distressPassword]);

  const addContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: crypto.randomUUID(),
    };
    setState(prev => ({ 
      ...prev, 
      emergencyContacts: [...prev.emergencyContacts, newContact] 
    }));
  }, []);

  const removeContact = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter(c => c.id !== id),
    }));
  }, []);

  const completeSetup = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isSetupComplete: true, 
      currentScreen: 'disguise' 
    }));
  }, []);

  const triggerSOS = useCallback(async (silent = false, triggerMethod: 'distress_password' | 'voice' | 'gesture' | 'manual' | 'safe_timer' = 'manual') => {
    setState(prev => ({ 
      ...prev, 
      sosActive: true, 
      silentMode: silent,
      threatLevel: 'high',
      currentScreen: silent ? prev.currentScreen : 'sos-active',
    }));
    
    if (firebaseUserId) {
      try {
        const eventId = await createSOSEvent(firebaseUserId, {
          userId: firebaseUserId,
          triggerMethod,
          contactsNotified: state.emergencyContacts.map(c => c.name),
          status: 'active',
          location: state.sosLocation ? {
            lat: state.sosLocation.latitude,
            lng: state.sosLocation.longitude,
            address: state.sosLocation.address,
            accuracy: state.sosLocation.accuracy,
            timestamp: new Date(state.sosLocation.timestamp).toISOString(),
          } : undefined,
        });
        
        if (eventId) {
          setState(prev => ({ ...prev, activeSosEventId: eventId }));
        }
      } catch (error) {
        console.error('Failed to create SOS event:', error);
      }
    }
  }, [firebaseUserId, state.emergencyContacts, state.sosLocation]);

  const cancelSOS = useCallback(async (status: 'resolved' | 'cancelled' = 'resolved') => {
    const eventId = state.activeSosEventId;
    
    setState(prev => ({ 
      ...prev, 
      sosActive: false, 
      silentMode: false,
      distressTriggerTime: null,
      threatLevel: 'low',
      sosLocation: null,
      sosLocationHistory: [],
      activeSosEventId: null,
      currentScreen: 'dashboard',
    }));
    
    if (firebaseUserId && eventId) {
      try {
        await resolveSOSEvent(firebaseUserId, eventId, status);
      } catch (error) {
        console.error('Failed to resolve SOS event:', error);
      }
    }
  }, [firebaseUserId, state.activeSosEventId]);

  const updateSOSLocation = useCallback((location: SOSLocation) => {
    setState(prev => ({
      ...prev,
      sosLocation: location,
      sosLocationHistory: [...prev.sosLocationHistory, location].slice(-100),
    }));
  }, []);

  const toggleFeature = useCallback((feature: keyof AppState['features']) => {
    setState(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isAuthenticated: false, 
      currentScreen: 'disguise' 
    }));
  }, []);

  const startSafeTimer = useCallback((durationMinutes: number) => {
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    setState(prev => ({
      ...prev,
      safeTimer: {
        ...prev.safeTimer,
        isActive: true,
        endTime,
        duration: durationMinutes,
        checkInCount: 0,
        lastCheckIn: Date.now(),
      },
      threatLevel: 'medium',
    }));
  }, []);

  const checkIn = useCallback(() => {
    setState(prev => {
      if (!prev.safeTimer.isActive) return prev;
      const newEndTime = Date.now() + prev.safeTimer.duration * 60 * 1000;
      return {
        ...prev,
        safeTimer: {
          ...prev.safeTimer,
          endTime: newEndTime,
          checkInCount: prev.safeTimer.checkInCount + 1,
          lastCheckIn: Date.now(),
        },
        threatLevel: 'low',
      };
    });
  }, []);

  const cancelSafeTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      safeTimer: {
        ...prev.safeTimer,
        isActive: false,
        endTime: null,
        checkInCount: 0,
        lastCheckIn: null,
      },
      threatLevel: 'low',
    }));
  }, []);

  const extendSafeTimer = useCallback((additionalMinutes: number) => {
    setState(prev => {
      if (!prev.safeTimer.isActive || !prev.safeTimer.endTime) return prev;
      return {
        ...prev,
        safeTimer: {
          ...prev.safeTimer,
          endTime: prev.safeTimer.endTime + additionalMinutes * 60 * 1000,
        },
      };
    });
  }, []);

  const updateProfile = useCallback((data: { displayName?: string; bloodType?: string; allergies?: string; medications?: string; emergencyMessage?: string }) => {
    setState(prev => ({
      ...prev,
      displayName: data.displayName ?? prev.displayName,
      bloodType: data.bloodType ?? prev.bloodType,
      allergies: data.allergies ?? prev.allergies,
      medications: data.medications ?? prev.medications,
      emergencyMessage: data.emergencyMessage ?? prev.emergencyMessage,
    }));
  }, []);

  const value: AppContextType = {
    ...state,
    setScreen,
    setDisguiseMode,
    authenticate,
    setupPasswords,
    changePassword,
    addContact,
    removeContact,
    completeSetup,
    triggerSOS,
    cancelSOS,
    updateSOSLocation,
    toggleFeature,
    logout,
    startSafeTimer,
    checkIn,
    cancelSafeTimer,
    extendSafeTimer,
    updateProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
