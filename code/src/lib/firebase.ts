import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, type Unsubscribe } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
  timestamp: string;
}

export interface SOSEvent {
  id: string;
  userId: string;
  triggeredAt: string;
  resolvedAt?: string;
  triggerMethod: 'distress_password' | 'voice' | 'gesture' | 'manual' | 'safe_timer';
  location?: UserLocation;
  contactsNotified: string[];
  status: 'active' | 'resolved' | 'cancelled';
  notes?: string;
}

export interface UserPermissions {
  camera: boolean;
  microphone: boolean;
  location: boolean;
  notifications: boolean;
  backgroundLocation: boolean;
  lastChecked: string;
}

export interface UserData {
  email: string;
  displayName?: string;
  disguiseMode: 'calculator' | 'notes' | 'weather';
  normalPassword: string;
  distressPassword: string;
  emergencyContacts: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    relationship: string;
    priority: 'primary' | 'secondary' | 'tertiary';
    notifyBySMS: boolean;
    notifyByCall: boolean;
    notifyByEmail: boolean;
  }>;
  features: {
    voiceActivation: boolean;
    gestureDetection: boolean;
    movementTracking: boolean;
    silentMode: boolean;
    autoRecord: boolean;
    shareLocation: boolean;
    notifyContacts: boolean;
    safeTimer: boolean;
    periodicCheckIn: boolean;
    codeWord: string;
  };
  permissions?: UserPermissions;
  lastLocation?: UserLocation;
  activeSosEventId?: string;
  isAdmin?: boolean;
  shareWithAdmin?: boolean;
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createAccount(email: string, password: string, displayName?: string): Promise<{ user: User; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const initialUserData: UserData = {
      email: email,
      displayName: displayName || email.split('@')[0],
      disguiseMode: 'calculator',
      normalPassword: '',
      distressPassword: '',
      emergencyContacts: [],
      features: {
        voiceActivation: false,
        gestureDetection: false,
        movementTracking: true,
        silentMode: true,
        autoRecord: true,
        shareLocation: true,
        notifyContacts: true,
        safeTimer: true,
        periodicCheckIn: false,
        codeWord: 'pineapple',
      },
      isSetupComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, "users", user.uid), initialUserData);
    
    return { user };
  } catch (error: any) {
    let errorMessage = 'Failed to create account';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already registered';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    return { user: null as any, error: errorMessage };
  }
}

export async function loginUser(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    let errorMessage = 'Failed to log in';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password';
    }
    return { user: null, error: errorMessage };
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

export async function updateUserData(userId: string, data: Partial<UserData>): Promise<boolean> {
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating user data:", error);
    return false;
  }
}

export async function saveAlertHistory(userId: string, alert: {
  type: 'emergency' | 'false-alarm' | 'test';
  timestamp: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  notes?: string;
}): Promise<boolean> {
  try {
    const alertRef = doc(collection(db, "users", userId, "alerts"));
    await setDoc(alertRef, {
      ...alert,
      id: alertRef.id,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error saving alert:", error);
    return false;
  }
}

export async function getAlertHistory(userId: string): Promise<any[]> {
  try {
    const alertsRef = collection(db, "users", userId, "alerts");
    const querySnapshot = await getDocs(alertsRef);
    const alerts: any[] = [];
    querySnapshot.forEach((doc) => {
      alerts.push({ id: doc.id, ...doc.data() });
    });
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Error getting alerts:", error);
    return [];
  }
}

export async function createSOSEvent(userId: string, event: Omit<SOSEvent, 'id' | 'triggeredAt'>): Promise<string | null> {
  try {
    const sosRef = doc(collection(db, "users", userId, "sosEvents"));
    const sosData = {
      ...event,
      id: sosRef.id,
      triggeredAt: new Date().toISOString(),
    };
    await setDoc(sosRef, sosData);
    
    await setDoc(doc(db, "users", userId), {
      activeSosEventId: sosRef.id,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return sosRef.id;
  } catch (error) {
    console.error("Error creating SOS event:", error);
    return null;
  }
}

export async function resolveSOSEvent(userId: string, eventId: string, status: 'resolved' | 'cancelled'): Promise<boolean> {
  try {
    const sosRef = doc(db, "users", userId, "sosEvents", eventId);
    await setDoc(sosRef, {
      status,
      resolvedAt: new Date().toISOString(),
    }, { merge: true });
    
    await setDoc(doc(db, "users", userId), {
      activeSosEventId: null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error resolving SOS event:", error);
    return false;
  }
}

export async function getSOSEvents(userId: string): Promise<SOSEvent[]> {
  try {
    const sosRef = collection(db, "users", userId, "sosEvents");
    const querySnapshot = await getDocs(sosRef);
    const events: SOSEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push(doc.data() as SOSEvent);
    });
    return events.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  } catch (error) {
    console.error("Error getting SOS events:", error);
    return [];
  }
}

export async function updateUserLocation(userId: string, location: UserLocation): Promise<boolean> {
  try {
    const locationRef = doc(collection(db, "users", userId, "locations"));
    await setDoc(locationRef, {
      ...location,
      id: locationRef.id,
    });
    
    await setDoc(doc(db, "users", userId), {
      lastLocation: location,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error updating location:", error);
    return false;
  }
}

export async function updateUserPermissions(userId: string, permissions: UserPermissions): Promise<boolean> {
  try {
    await setDoc(doc(db, "users", userId), {
      permissions,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating permissions:", error);
    return false;
  }
}

export async function getAllUsers(): Promise<(UserData & { id: string })[]> {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const users: (UserData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() as UserData });
    });
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const userData = await getUserData(userId);
    return userData?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export function subscribeToAllUsers(callback: (users: (UserData & { id: string })[]) => void): Unsubscribe {
  const usersRef = collection(db, "users");
  return onSnapshot(usersRef, (snapshot) => {
    const users: (UserData & { id: string })[] = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() as UserData });
    });
    callback(users);
  }, (error) => {
    console.error("Error in users subscription:", error);
  });
}

export function subscribeToUserSOSEvents(userId: string, callback: (events: SOSEvent[]) => void): Unsubscribe {
  const sosRef = collection(db, "users", userId, "sosEvents");
  return onSnapshot(sosRef, (snapshot) => {
    const events: SOSEvent[] = [];
    snapshot.forEach((doc) => {
      events.push(doc.data() as SOSEvent);
    });
    callback(events.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()));
  }, (error) => {
    console.error("Error in SOS events subscription:", error);
  });
}

export function subscribeToSOSEvents(userId: string, callback: (events: SOSEvent[]) => void): Unsubscribe {
  const sosRef = collection(db, "users", userId, "sosEvents");
  return onSnapshot(sosRef, (snapshot) => {
    const events: SOSEvent[] = [];
    snapshot.forEach((doc) => {
      events.push(doc.data() as SOSEvent);
    });
    callback(events.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()));
  }, (error) => {
    console.error("Error in SOS events subscription:", error);
  });
}

export async function updateSOSEventStream(userId: string, eventId: string, streamData: {
  audioChunk?: string;
  videoFrame?: string;
  isStreaming: boolean;
}): Promise<boolean> {
  try {
    const streamRef = doc(db, "users", userId, "sosEvents", eventId, "stream", "live");
    await setDoc(streamRef, {
      ...streamData,
      timestamp: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating stream:", error);
    return false;
  }
}

export function subscribeToSOSStream(userId: string, eventId: string, callback: (data: any) => void): Unsubscribe {
  const streamRef = doc(db, "users", userId, "sosEvents", eventId, "stream", "live");
  return onSnapshot(streamRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  }, (error) => {
    console.error("Error in stream subscription:", error);
  });
}

export { onAuthStateChanged };
export type { User, Unsubscribe };
