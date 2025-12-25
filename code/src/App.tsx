import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, useApp } from "@/lib/appContext";
import { auth, onAuthStateChanged, getUserData, logoutUser, type User } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

import { AuthScreen } from "@/components/screens/AuthScreen";
import { AdminAuthScreen } from "@/components/screens/AdminAuthScreen";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { VoiceActivationProvider } from "@/components/VoiceActivationProvider";
import { DisguiseSelectionScreen } from "@/components/screens/DisguiseSelectionScreen";
import { PasswordSetupScreen } from "@/components/screens/PasswordSetupScreen";
import { ContactsSetupScreen } from "@/components/screens/ContactsSetupScreen";
import { SetupCompleteScreen } from "@/components/screens/SetupCompleteScreen";
import { CalculatorDisguise } from "@/components/screens/CalculatorDisguise";
import { NotesDisguise } from "@/components/screens/NotesDisguise";
import { WeatherDisguise } from "@/components/screens/WeatherDisguise";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { SOSActiveScreen } from "@/components/screens/SOSActiveScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { SafeTimerScreen } from "@/components/screens/SafeTimerScreen";
import { PermissionsScreen } from "@/components/screens/PermissionsScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import HelpScreen from "@/components/screens/HelpScreen";
import AdminDashboardScreen from "@/components/screens/AdminDashboardScreen";
import { SafeMapScreen } from "@/components/screens/SafeMapScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function AppScreens() {
  const { currentScreen, disguiseMode } = useApp();

  switch (currentScreen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'disguise-selection':
      return <DisguiseSelectionScreen />;
    case 'permissions-setup':
      return <PermissionsScreen />;
    case 'password-setup':
      return <PasswordSetupScreen />;
    case 'contacts-setup':
      return <ContactsSetupScreen />;
    case 'setup-complete':
      return <SetupCompleteScreen />;
    case 'disguise':
      if (disguiseMode === 'calculator') {
        return <CalculatorDisguise />;
      }
      if (disguiseMode === 'notes') {
        return <NotesDisguise />;
      }
      if (disguiseMode === 'weather') {
        return <WeatherDisguise />;
      }
      return <CalculatorDisguise />;
    case 'dashboard':
      return <DashboardScreen />;
    case 'sos-active':
      return <SOSActiveScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'safe-timer':
      return <SafeTimerScreen />;
    case 'history':
      return <HistoryScreen />;
    case 'help':
      return <HelpScreen />;
    case 'admin':
      return <AdminDashboardScreen />;
    case 'safe-map':
      return <SafeMapScreen />;
    default:
      return <WelcomeScreen />;
  }
}

function AuthenticatedApp({ userId }: { userId: string }) {
  return (
    <AppProvider firebaseUserId={userId}>
      <VoiceActivationProvider>
        <div className="min-h-screen bg-background">
          <AppScreens />
        </div>
        <Toaster />
        <Sonner />
      </VoiceActivationProvider>
    </AppProvider>
  );
}

type AuthView = 'user' | 'admin-login' | 'admin-dashboard';

function AppRoot() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('user');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setIsLoading(false);
        if (authView === 'admin-dashboard') {
          setAuthView('user');
          setAdminUserId(null);
        }
        return;
      }

      if (authView === 'admin-dashboard' && adminUserId === firebaseUser.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authView, adminUserId]);

  const handleAuthSuccess = (userId: string) => {
    setAuthView('user');
  };

  const handleAdminClick = async () => {
    setIsLoading(true);
    if (user) {
      await logoutUser();
    }
    setIsLoading(false);
    setAuthView('admin-login');
  };

  const handleAdminAuthSuccess = (userId: string) => {
    setAdminUserId(userId);
    setAuthView('admin-dashboard');
  };

  const handleBackToUserLogin = async () => {
    setIsLoading(true);
    if (adminUserId || user) {
      await logoutUser();
    }
    setAdminUserId(null);
    setAuthView('user');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authView === 'admin-login') {
    return (
      <>
        <AdminAuthScreen 
          onAdminAuthSuccess={handleAdminAuthSuccess} 
          onBackClick={handleBackToUserLogin} 
        />
        <Toaster />
        <Sonner />
      </>
    );
  }

  if (authView === 'admin-dashboard' && adminUserId) {
    return (
      <AppProvider firebaseUserId={adminUserId}>
        <div className="min-h-screen bg-background">
          <AdminDashboardScreen onLogout={handleBackToUserLogin} />
        </div>
        <Toaster />
        <Sonner />
      </AppProvider>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} onAdminClick={handleAdminClick} />
        <Toaster />
        <Sonner />
      </>
    );
  }

  return <AuthenticatedApp userId={user.uid} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppRoot />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
