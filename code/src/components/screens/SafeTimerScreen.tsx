import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  Plus, 
  Minus,
  Phone,
  Shield,
  Play,
  Pause,
  MapPin,
  Navigation,
  Bell,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/appContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CHECK_IN_INTERVALS = [15, 30, 60]; // minutes
const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes grace period

type TimerStage = 'setup' | 'active' | 'grace' | 'escalating';
type EscalationLevel = 0 | 1 | 2 | 3; // 0=none, 1=primary, 2=all contacts, 3=full SOS

export function SafeTimerScreen() {
  const { 
    setScreen, 
    safeTimer, 
    startSafeTimer, 
    checkIn, 
    cancelSafeTimer,
    extendSafeTimer,
    emergencyContacts,
    triggerSOS
  } = useApp();
  
  const [selectedInterval, setSelectedInterval] = useState(30);
  const [destination, setDestination] = useState('');
  const [activityNote, setActivityNote] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [stage, setStage] = useState<TimerStage>('setup');
  const [escalationLevel, setEscalationLevel] = useState<EscalationLevel>(0);
  const [graceTimeRemaining, setGraceTimeRemaining] = useState(GRACE_PERIOD_MS);
  const [pinInput, setPinInput] = useState('');

  // Determine current stage based on timer state
  useEffect(() => {
    if (!safeTimer.isActive) {
      setStage('setup');
      setEscalationLevel(0);
      return;
    }
    
    if (timeRemaining > 0) {
      setStage('active');
    } else if (graceTimeRemaining > 0) {
      setStage('grace');
    } else {
      setStage('escalating');
    }
  }, [safeTimer.isActive, timeRemaining, graceTimeRemaining]);

  // Update time remaining every second
  useEffect(() => {
    if (!safeTimer.isActive || !safeTimer.endTime) return;

    const updateTime = () => {
      const remaining = Math.max(0, safeTimer.endTime! - Date.now());
      setTimeRemaining(remaining);
      
      // Timer expired - enter grace period
      if (remaining <= 0) {
        const graceEnd = safeTimer.endTime! + GRACE_PERIOD_MS;
        const graceRemaining = Math.max(0, graceEnd - Date.now());
        setGraceTimeRemaining(graceRemaining);
        
        // Show check-in dialog during grace period
        if (graceRemaining > 0 && !showCheckInDialog) {
          setShowCheckInDialog(true);
        }
        
        // Escalation stages during grace period
        const elapsedGrace = GRACE_PERIOD_MS - graceRemaining;
        if (elapsedGrace >= 0 && escalationLevel < 1) {
          // Stage 1: Silent alert to primary contact
          setEscalationLevel(1);
        }
        if (elapsedGrace >= 60000 && escalationLevel < 2) { // After 1 min
          // Stage 2: Alert all contacts
          setEscalationLevel(2);
        }
        if (graceRemaining <= 0 && escalationLevel < 3) {
          // Stage 3: Full SOS
          setEscalationLevel(3);
          triggerSOS(false);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [safeTimer.isActive, safeTimer.endTime, escalationLevel, showCheckInDialog, triggerSOS]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  const handleStartTimer = () => {
    startSafeTimer(selectedInterval);
    setGraceTimeRemaining(GRACE_PERIOD_MS);
    setEscalationLevel(0);
  };

  const handleCheckIn = () => {
    checkIn();
    setShowCheckInDialog(false);
    setGraceTimeRemaining(GRACE_PERIOD_MS);
    setEscalationLevel(0);
    setPinInput('');
  };

  const handleConfirmCheckIn = () => {
    // In a real app, this would verify against the user's PIN
    handleCheckIn();
  };

  const handleCancel = () => {
    cancelSafeTimer();
    setShowCancelDialog(false);
    setShowCheckInDialog(false);
    setDestination('');
    setActivityNote('');
    setEscalationLevel(0);
  };

  const adjustInterval = (delta: number) => {
    const intervals = [5, 10, 15, 20, 30, 45, 60, 90, 120];
    const currentIndex = intervals.indexOf(selectedInterval);
    if (currentIndex === -1) {
      setSelectedInterval(30);
      return;
    }
    const newIndex = Math.max(0, Math.min(intervals.length - 1, currentIndex + (delta > 0 ? 1 : -1)));
    setSelectedInterval(intervals[newIndex]);
  };

  const progress = safeTimer.isActive && safeTimer.endTime
    ? Math.min(100, ((safeTimer.duration * 60 * 1000 - timeRemaining) / (safeTimer.duration * 60 * 1000)) * 100)
    : 0;

  const graceProgress = stage === 'grace' 
    ? ((GRACE_PERIOD_MS - graceTimeRemaining) / GRACE_PERIOD_MS) * 100
    : 0;

  const primaryContact = emergencyContacts.find(c => c.priority === 'primary');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <button 
          onClick={() => setScreen('dashboard')}
          className="p-2 hover-elevate rounded-xl transition-colors"
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Safe Timer</h1>
        </div>
        {safeTimer.isActive && (
          <div className={`ml-auto px-2 py-1 rounded-md text-xs font-medium ${
            stage === 'grace' || stage === 'escalating' 
              ? 'bg-destructive/10 text-destructive' 
              : 'bg-safe/10 text-safe'
          }`}>
            {stage === 'active' && 'Active'}
            {stage === 'grace' && 'Check-in Required'}
            {stage === 'escalating' && 'Alerting Contacts'}
          </div>
        )}
      </header>

      <main className="flex-1 p-4 space-y-6 overflow-auto">
        {stage === 'setup' ? (
          <>
            {/* Setup Form */}
            <div className="glass-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4 inline mr-2 text-primary" />
                  Where are you going? (Optional)
                </label>
                <Input
                  placeholder="e.g., Walking home, First date at coffee shop"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-secondary/50"
                  data-testid="input-destination"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Navigation className="w-4 h-4 inline mr-2 text-primary" />
                  Activity notes (Optional)
                </label>
                <Input
                  placeholder="e.g., Meeting John, Route through Main St"
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  className="bg-secondary/50"
                  data-testid="input-activity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  <Clock className="w-4 h-4 inline mr-2 text-primary" />
                  Check-in interval
                </label>
                
                {/* Duration selector */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => adjustInterval(-1)}
                    className="w-12 h-12 rounded-full bg-secondary hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                    data-testid="button-decrease-interval"
                  >
                    <Minus className="w-5 h-5 text-foreground" />
                  </button>
                  
                  <div className="w-32 text-center">
                    <span className="text-4xl font-bold text-foreground" data-testid="text-interval">
                      {formatDuration(selectedInterval)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => adjustInterval(1)}
                    className="w-12 h-12 rounded-full bg-secondary hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                    data-testid="button-increase-interval"
                  >
                    <Plus className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Quick select buttons */}
                <div className="flex gap-2 justify-center">
                  {CHECK_IN_INTERVALS.map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setSelectedInterval(interval)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedInterval === interval
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover-elevate'
                      }`}
                      data-testid={`button-interval-${interval}`}
                    >
                      {formatDuration(interval)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartTimer}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
              data-testid="button-start-timer"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Safe Timer
            </Button>

            {/* How it works */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                How it works
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
                  <p className="text-muted-foreground">Set a check-in interval and optional destination info</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</div>
                  <p className="text-muted-foreground">Check in before the timer expires to confirm you're safe</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">3</div>
                  <p className="text-muted-foreground">5-minute grace period if you miss a check-in</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive shrink-0">4</div>
                  <p className="text-muted-foreground">If no response: alerts escalate from primary contact to all contacts to full SOS</p>
                </div>
              </div>
            </div>

            {/* Use cases */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Perfect for</h3>
              <div className="flex flex-wrap gap-2">
                {['Walking home alone', 'First date', 'Solo hiking', 'Traveling', 'Late night commute'].map((useCase) => (
                  <span key={useCase} className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
                    {useCase}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Active Timer Display */}
            <div className={`glass-card p-6 text-center transition-colors ${
              stage === 'grace' || stage === 'escalating' ? 'border-destructive bg-destructive/5' : ''
            }`}>
              {destination && (
                <div className="flex items-center justify-center gap-2 mb-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{destination}</span>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mb-2">
                {stage === 'active' && 'Time until check-in'}
                {stage === 'grace' && 'Grace period - Check in now!'}
                {stage === 'escalating' && 'Alerting your contacts...'}
              </p>
              
              {/* Circular progress */}
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(stage === 'grace' ? graceProgress : progress) * 5.53} 553`}
                    className={`transition-all ${
                      stage === 'grace' || stage === 'escalating' ? 'text-destructive' : 'text-primary'
                    }`}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${
                    stage === 'grace' || stage === 'escalating' ? 'text-destructive' : 'text-foreground'
                  }`} data-testid="text-time-remaining">
                    {stage === 'grace' ? formatTime(graceTimeRemaining) : formatTime(timeRemaining)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {safeTimer.checkInCount} check-ins
                  </span>
                </div>
              </div>

              {/* Escalation indicator */}
              {(stage === 'grace' || stage === 'escalating') && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center justify-center gap-2 text-destructive text-sm font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Escalation Status</span>
                  </div>
                  <div className="flex justify-center gap-1">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      escalationLevel >= 1 ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <Phone className="w-3 h-3" />
                      Primary
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      escalationLevel >= 2 ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <Users className="w-3 h-3" />
                      All Contacts
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      escalationLevel >= 3 ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <Bell className="w-3 h-3" />
                      Full SOS
                    </div>
                  </div>
                </div>
              )}

              {/* Check-in button */}
              <Button
                onClick={handleCheckIn}
                size="lg"
                className={`w-full h-16 text-lg font-semibold ${
                  stage === 'grace' || stage === 'escalating'
                    ? 'bg-safe hover:bg-safe/90 text-safe-foreground animate-pulse' 
                    : 'bg-safe hover:bg-safe/90 text-safe-foreground'
                }`}
                data-testid="button-check-in"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                I'm Safe - Check In
              </Button>

              {/* Timer controls */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => extendSafeTimer(15)}
                  className="flex-1"
                  data-testid="button-extend"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  +15 min
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 border-destructive/30 text-destructive"
                  data-testid="button-cancel"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  End Timer
                </Button>
              </div>
            </div>

            {/* Activity info */}
            {activityNote && (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Activity Notes
                </h3>
                <p className="text-sm text-muted-foreground">{activityNote}</p>
              </div>
            )}

            {/* Emergency contacts */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Contacts to be notified
                </h3>
                <span className="text-sm text-muted-foreground">{emergencyContacts.length} contacts</span>
              </div>
              
              {emergencyContacts.length > 0 ? (
                <div className="space-y-2">
                  {emergencyContacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        escalationLevel >= 1 && contact.priority === 'primary' ? 'bg-destructive/10 border border-destructive/20' :
                        escalationLevel >= 2 ? 'bg-destructive/10 border border-destructive/20' :
                        'bg-secondary/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        (escalationLevel >= 1 && contact.priority === 'primary') || escalationLevel >= 2
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {contact.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-md shrink-0 ${
                        contact.priority === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {contact.priority}
                      </span>
                      {((escalationLevel >= 1 && contact.priority === 'primary') || escalationLevel >= 2) && (
                        <Bell className="w-4 h-4 text-destructive animate-pulse shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No emergency contacts configured
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Safe Timer?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end the timer? Your contacts won't be notified if you end it now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Timer
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              End Timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Required Dialog */}
      <Dialog open={showCheckInDialog && stage === 'grace'} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Are You Safe?
            </DialogTitle>
            <DialogDescription>
              Your check-in timer has expired. Please confirm you're safe within the next {formatTime(graceTimeRemaining)} or your emergency contacts will be alerted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-destructive mb-2" data-testid="text-grace-time">
              {formatTime(graceTimeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">until contacts are notified</p>
            
            {escalationLevel >= 1 && (
              <div className="mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                {escalationLevel === 1 && primaryContact && `Alerting ${primaryContact.name}...`}
                {escalationLevel >= 2 && 'Alerting all contacts...'}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col gap-2">
            <Button 
              onClick={handleConfirmCheckIn}
              className="w-full bg-safe hover:bg-safe/90 text-safe-foreground"
              data-testid="button-confirm-safe"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              I'm Safe - Check In
            </Button>
            <Button 
              variant="outline"
              onClick={() => extendSafeTimer(15)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Extend by 15 minutes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
