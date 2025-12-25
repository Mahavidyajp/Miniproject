import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Mic, 
  Hand, 
  MapPin, 
  Video, 
  Phone,
  Settings,
  History,
  LogOut,
  Bell,
  BatteryMedium,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Zap,
  PhoneCall,
  HelpCircle,
  ChevronRight,
  Wifi,
  BarChart3,
  X,
  Camera,
  CameraOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/appContext';
import { useToast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { QuickExitMenu } from '@/components/QuickExitMenu';
import { usePanicGestureDetection } from '@/hooks/usePanicGestureDetection';

export function DashboardScreen() {
  const { 
    threatLevel, 
    features, 
    toggleFeature, 
    triggerSOS,
    cancelSOS,
    sosActive,
    silentMode,
    distressTriggerTime,
    setScreen,
    logout,
    emergencyContacts,
    safeTimer
  } = useApp();
  const { toast } = useToast();
  
  const [isPanicHeld, setIsPanicHeld] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [lastAICheck, setLastAICheck] = useState('2 mins ago');
  const [batterySaver, setBatterySaver] = useState(false);

  const handleGesturePanicDetected = useCallback(() => {
    toast({
      title: "Panic Gesture Detected",
      description: "Emergency SOS triggered via gesture recognition.",
      variant: "destructive",
    });
    triggerSOS(false);
  }, [triggerSOS, toast]);

  const {
    isActive: isGestureActive,
    isLoading: isGestureLoading,
    lastResult: gestureResult,
    error: gestureError,
    startDetection,
    stopDetection,
    videoRef,
  } = usePanicGestureDetection(handleGesturePanicDetected, features.gestureRecognition);

  useEffect(() => {
    if (features.gestureRecognition && !isGestureActive) {
      startDetection();
    } else if (!features.gestureRecognition && isGestureActive) {
      stopDetection();
    }
  }, [features.gestureRecognition, isGestureActive, startDetection, stopDetection]);

  useEffect(() => {
    if (gestureError) {
      toast({
        title: "Gesture Detection Error",
        description: gestureError,
        variant: "destructive",
      });
    }
  }, [gestureError, toast]);

  // Simulate AI status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastAICheck('Just now');
      setTimeout(() => setLastAICheck('1 min ago'), 60000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePanicStart = () => {
    setIsPanicHeld(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        triggerSOS(false);
      }
    }, 100);
    
    const handleEnd = () => {
      clearInterval(interval);
      setIsPanicHeld(false);
      setHoldProgress(0);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
    
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
  };

  const handleImSafe = () => {
    if (sosActive) {
      cancelSOS();
      toast({
        title: "You're safe",
        description: "All alerts cancelled. False alarm notification sent.",
      });
    } else {
      toast({
        title: "Status confirmed",
        description: "Your contacts have been notified you're safe.",
      });
    }
  };

  const handleSilentAlert = () => {
    triggerSOS(true);
    toast({
      title: "Silent alert sent",
      description: "Emergency contacts notified. Stay calm.",
    });
  };

  const statusColor = threatLevel === 'low' ? 'text-safe' : threatLevel === 'medium' ? 'text-alert' : 'text-emergency';
  const statusBg = threatLevel === 'low' ? 'bg-safe' : threatLevel === 'medium' ? 'bg-alert' : 'bg-emergency';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          {/* Left: Protection Status */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusBg} animate-pulse`} />
            <div>
              <p className="text-xs text-muted-foreground">Protection Status</p>
              <p className={`font-semibold ${statusColor}`}>
                {threatLevel === 'low' ? 'All Clear' : threatLevel === 'medium' ? 'Monitoring' : 'Alert Active'}
              </p>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Exit */}
            <QuickExitMenu />
            
            {/* Battery Saver */}
            <button 
              onClick={() => setBatterySaver(!batterySaver)}
              className={`p-2 rounded-xl transition-colors ${
                batterySaver ? 'bg-safe/10 text-safe' : 'hover:bg-accent text-muted-foreground'
              }`}
              data-testid="button-battery-saver"
            >
              <BatteryMedium className="w-5 h-5" />
            </button>
            
            {/* Profile */}
            <button 
              onClick={() => setScreen('settings')}
              className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
              data-testid="button-profile"
            >
              <User className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
        
        {/* AI Status Bar */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-safe" />
          <span className="text-muted-foreground">AI Status:</span>
          <span className="text-foreground font-medium">All clear</span>
          <span className="text-muted-foreground">• {lastAICheck}</span>
        </div>
      </header>

      {/* Silent SOS Banner - shown when distress password was used */}
      {silentMode && distressTriggerTime && (
        <div className="bg-emergency/10 border-b border-emergency/20 px-4 py-3" data-testid="banner-silent-sos">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
              <div>
                <p className="text-sm font-medium text-emergency">Silent SOS Active</p>
                <p className="text-xs text-muted-foreground">
                  Contacts are being alerted silently
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-emergency hover:text-emergency hover:bg-emergency/10"
              onClick={() => {
                cancelSOS();
                toast({
                  title: "Silent SOS cancelled",
                  description: "Your contacts have been notified you're safe.",
                });
              }}
              data-testid="button-cancel-silent-sos"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 space-y-4 overflow-auto pb-24">
        {/* PANIC BUTTON - Most Prominent */}
        <Card className="border-emergency/20 bg-gradient-to-br from-emergency/5 to-transparent overflow-hidden">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Hold for 2 seconds to send SOS
            </p>
            
            <div className="relative inline-flex">
              <button
                onMouseDown={handlePanicStart}
                onTouchStart={handlePanicStart}
                className={`w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isPanicHeld 
                    ? 'bg-emergency scale-95' 
                    : 'bg-gradient-to-br from-emergency to-rose-700 hover:scale-105 hover:shadow-xl'
                }`}
                style={{
                  boxShadow: isPanicHeld 
                    ? '0 0 60px hsl(var(--emergency) / 0.6), inset 0 0 30px hsl(var(--emergency) / 0.3)' 
                    : '0 10px 40px hsl(var(--emergency) / 0.3)'
                }}
              >
                <div className="text-center">
                  <AlertTriangle className="w-10 h-10 text-white mx-auto mb-1" />
                  <span className="text-xl font-bold text-white">PANIC</span>
                </div>
              </button>
              
              {/* Progress ring */}
              {isPanicHeld && (
                <svg className="absolute inset-0 w-36 h-36 -rotate-90 pointer-events-none">
                  <circle
                    cx="72"
                    cy="72"
                    r="68"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-white/30"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="68"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${holdProgress * 4.27} 427`}
                    className="text-white transition-all"
                  />
                </svg>
              )}
            </div>
            
            {isPanicHeld && (
              <p className="mt-4 text-emergency font-medium animate-pulse">
                Keep holding...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Silent Alert */}
          <button
            onClick={handleSilentAlert}
            className="p-4 rounded-2xl bg-alert/10 border border-alert/20 hover:bg-alert/20 transition-colors flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-alert/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-alert" />
            </div>
            <span className="text-xs font-medium text-foreground">Silent Alert</span>
          </button>
          
          {/* Safe Timer */}
          <button
            onClick={() => setScreen('safe-timer')}
            className={`p-4 rounded-2xl border transition-colors flex flex-col items-center gap-2 ${
              safeTimer.isActive 
                ? 'bg-primary/10 border-primary/30 hover:bg-primary/20' 
                : 'bg-card border-border hover:bg-accent'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              safeTimer.isActive ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              <Clock className={`w-6 h-6 ${safeTimer.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className="text-xs font-medium text-foreground">
              {safeTimer.isActive ? 'Timer On' : 'Safe Timer'}
            </span>
          </button>
          
          {/* I'm Safe */}
          <button
            onClick={handleImSafe}
            className="p-4 rounded-2xl bg-safe/10 border border-safe/20 hover:bg-safe/20 transition-colors flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-safe/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-safe" />
            </div>
            <span className="text-xs font-medium text-foreground">I'm Safe</span>
          </button>
        </div>

        {/* AI Monitoring Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">AI Monitoring</h3>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                threatLevel === 'low' 
                  ? 'bg-safe/10 text-safe' 
                  : threatLevel === 'medium' 
                  ? 'bg-alert/10 text-alert' 
                  : 'bg-emergency/10 text-emergency'
              }`}>
                {threatLevel === 'low' ? 'Low' : threatLevel === 'medium' ? 'Medium' : 'High'} Threat
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Mic, label: 'Voice Detection', key: 'voiceDetection' as const },
                { icon: Hand, label: 'Gesture Recognition', key: 'gestureRecognition' as const },
                { icon: MapPin, label: 'Movement Tracking', key: 'movementTracking' as const },
                { icon: Video, label: 'Auto Recording', key: 'autoRecording' as const },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = features[item.key];
                const isGestureItem = item.key === 'gestureRecognition';
                const showCameraActive = isGestureItem && isGestureActive;
                return (
                  <div 
                    key={item.key}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      showCameraActive ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/50'
                    }`}
                  >
                    {showCameraActive ? (
                      <Camera className="w-4 h-4 text-primary animate-pulse" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? 'text-safe' : 'text-muted-foreground'}`} />
                    )}
                    <span className="text-xs text-foreground truncate">
                      {isGestureItem && showCameraActive ? 'Scanning...' : item.label}
                    </span>
                    <span className={`ml-auto text-xs ${
                      showCameraActive ? 'text-primary' : isActive ? 'text-safe' : 'text-muted-foreground'
                    }`}>
                      {showCameraActive ? (isGestureLoading ? 'AI' : 'On') : (isActive ? 'On' : 'Off')}
                    </span>
                  </div>
                );
              })}
            </div>

            {isGestureActive && gestureResult && (
              <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">
                    Camera active - Show open palm to trigger SOS
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last scan: Confidence {Math.round((gestureResult.confidenceScore || 0) * 100)}%
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-3">
              Last trigger: None
            </p>
            
            <video 
              ref={videoRef}
              className="hidden"
              playsInline
              muted
              data-testid="gesture-video-feed"
            />
          </CardContent>
        </Card>

        {/* Location Sharing Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Location Sharing</h3>
                  <p className="text-xs text-muted-foreground">
                    {features.locationTracking ? 'Ready to share' : 'Disabled'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-safe text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>GPS</span>
                </div>
                <p className="text-xs text-muted-foreground">High accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Emergency Contacts</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setScreen('settings')}
                className="text-primary h-8"
              >
                Edit
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {emergencyContacts.slice(0, 3).map((contact, i) => (
                  <div 
                    key={contact.id}
                    className="w-8 h-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                    style={{ zIndex: 3 - i }}
                  >
                    {contact.name.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {emergencyContacts.length} contact{emergencyContacts.length !== 1 ? 's' : ''} ready
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Quick Toggles</h3>
            
            <div className="space-y-2">
              {[
                { icon: Mic, label: 'Voice Keyword Detection', key: 'voiceDetection' as const },
                { icon: Hand, label: 'Gesture Recognition', key: 'gestureRecognition' as const },
                { icon: MapPin, label: 'Background Location', key: 'locationTracking' as const },
                { icon: PhoneCall, label: 'Fake Call Ready', key: 'movementTracking' as const },
                { icon: Video, label: 'Auto-Recording', key: 'autoRecording' as const },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = features[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleFeature(item.key)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${
                      isActive ? 'bg-primary' : 'bg-secondary'
                    }`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        isActive ? 'left-6' : 'left-1'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav activeTab="home" />
    </div>
  );
}
