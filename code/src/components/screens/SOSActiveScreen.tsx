import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Mic, 
  Camera, 
  MessageSquare, 
  Phone,
  Check,
  X,
  Shield,
  Navigation,
  ExternalLink,
  Copy,
  RefreshCw,
  Send,
  Eye,
  PhoneCall,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/appContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from 'sonner';

type ContactStatus = 'sending' | 'delivered' | 'read' | 'calling' | 'failed';

interface ContactDeliveryStatus {
  id: string;
  sms: ContactStatus;
  whatsapp: ContactStatus;
  call: ContactStatus;
}

export function SOSActiveScreen() {
  const { cancelSOS, emergencyContacts, sosLocation, sosLocationHistory, updateSOSLocation, features, normalPassword } = useApp();
  const { 
    location, 
    isTracking, 
    error: locationError, 
    startTracking, 
    stopTracking, 
    getShareableLink,
    generateEmergencyMessage,
    getCurrentLocation 
  } = useGeolocation();
  
  const [countdown, setCountdown] = useState(30);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelPin, setCancelPin] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  
  // Audio waveform visualization
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0.1));
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Contact delivery statuses
  const [contactStatuses, setContactStatuses] = useState<ContactDeliveryStatus[]>([]);
  
  const [statusUpdates, setStatusUpdates] = useState([
    { id: 1, message: 'SOS Triggered', icon: AlertTriangle, done: true },
  ]);

  // Initialize contact statuses
  useEffect(() => {
    setContactStatuses(
      emergencyContacts.map(c => ({
        id: c.id,
        sms: 'sending',
        whatsapp: 'sending',
        call: c.priority === 'primary' ? 'calling' : 'sending',
      }))
    );
  }, [emergencyContacts]);

  // Simulate audio recording waveform
  useEffect(() => {
    if (features.autoRecording) {
      audioIntervalRef.current = setInterval(() => {
        setAudioLevels(prev => {
          const newLevels = [...prev.slice(1), Math.random() * 0.8 + 0.2];
          return newLevels;
        });
      }, 100);
    }
    
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [features.autoRecording]);

  // Simulate photo capture every 5 seconds
  useEffect(() => {
    const photoInterval = setInterval(() => {
      setPhotoCount(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(photoInterval);
  }, []);

  // Simulate contact delivery status updates
  useEffect(() => {
    const statusTimers: NodeJS.Timeout[] = [];
    
    emergencyContacts.forEach((contact, i) => {
      // SMS delivered after 2-4 seconds
      statusTimers.push(
        setTimeout(() => {
          setContactStatuses(prev => prev.map(s => 
            s.id === contact.id ? { ...s, sms: 'delivered' } : s
          ));
        }, 2000 + i * 1000)
      );
      
      // SMS read after 5-10 seconds (for primary)
      if (contact.priority === 'primary') {
        statusTimers.push(
          setTimeout(() => {
            setContactStatuses(prev => prev.map(s => 
              s.id === contact.id ? { ...s, sms: 'read' } : s
            ));
          }, 5000 + i * 2000)
        );
      }
      
      // WhatsApp delivered after 5 seconds
      statusTimers.push(
        setTimeout(() => {
          setContactStatuses(prev => prev.map(s => 
            s.id === contact.id ? { ...s, whatsapp: 'delivered' } : s
          ));
        }, 5000 + i * 1500)
      );
    });
    
    return () => {
      statusTimers.forEach(t => clearTimeout(t));
    };
  }, [emergencyContacts]);

  // Start location tracking when SOS is triggered
  useEffect(() => {
    if (features.locationTracking) {
      startTracking(10000); // Update every 10 seconds
    }
    
    return () => {
      stopTracking();
    };
  }, [features.locationTracking, startTracking, stopTracking]);

  // Update SOS location when geolocation changes
  useEffect(() => {
    if (location) {
      updateSOSLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        timestamp: location.timestamp,
        mapsLink: getShareableLink(location),
      });
    }
  }, [location, updateSOSLocation, getShareableLink]);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Elapsed time
    const elapsedInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Simulate status updates with proper icons
    const updates = [
      { delay: 2000, message: 'Location shared with contacts', icon: MapPin },
      { delay: 4000, message: 'SMS sent to all contacts', icon: MessageSquare },
      { delay: 6000, message: 'WhatsApp messages sent', icon: Send },
      { delay: 8000, message: 'Audio recording started', icon: Mic },
      { delay: 10000, message: 'Camera capturing photos', icon: Camera },
      { delay: 12000, message: 'Live location link created', icon: ExternalLink },
    ];

    updates.forEach(({ delay, message, icon }) => {
      setTimeout(() => {
        setStatusUpdates(prev => [
          ...prev, 
          { id: prev.length + 1, message, icon, done: true }
        ]);
      }, delay);
    });

    return () => {
      clearInterval(countdownInterval);
      clearInterval(elapsedInterval);
    };
  }, []);

  const handleCancelAttempt = () => {
    if (cancelPin === normalPassword || cancelPin.length >= 4) {
      cancelSOS();
      toast.success('Alert cancelled', {
        description: 'Your contacts have been notified you are safe.',
      });
    } else {
      toast.error('Incorrect PIN');
      setCancelPin('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyLocationToClipboard = useCallback(() => {
    if (sosLocation) {
      const message = `📍 Emergency Location:\n${sosLocation.address || `${sosLocation.latitude.toFixed(6)}, ${sosLocation.longitude.toFixed(6)}`}\n\n🗺️ ${sosLocation.mapsLink}`;
      navigator.clipboard.writeText(message);
      toast.success('Location copied to clipboard');
    }
  }, [sosLocation]);

  const openInMaps = useCallback(() => {
    if (sosLocation) {
      window.open(sosLocation.mapsLink, '_blank');
    }
  }, [sosLocation]);

  const getStatusIcon = (status: ContactStatus) => {
    switch (status) {
      case 'sending': return <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
      case 'delivered': return <Check className="w-3 h-3 text-safe" />;
      case 'read': return <Eye className="w-3 h-3 text-primary" />;
      case 'calling': return <PhoneCall className="w-3 h-3 text-alert animate-pulse" />;
      case 'failed': return <X className="w-3 h-3 text-emergency" />;
    }
  };

  const getStatusLabel = (status: ContactStatus) => {
    switch (status) {
      case 'sending': return 'Sending...';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      case 'calling': return 'Calling...';
      case 'failed': return 'Failed';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Emergency header */}
      <header className="bg-emergency text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">🆘 SENDING EMERGENCY ALERT</p>
              <p className="text-sm text-white/80">Duration: {formatTime(elapsedTime)}</p>
            </div>
          </div>
        </div>
        
        {/* Countdown bar */}
        {countdown > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Canceling in...</span>
              <span className="font-mono font-bold text-xl">{countdown}s</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 space-y-4 overflow-auto pb-24">
        {/* Status Updates Timeline */}
        <Card className="border-safe/30 bg-safe/5">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Status Updates</h3>
            
            <div className="space-y-2">
              {statusUpdates.map((update, i) => {
                const Icon = update.icon;
                return (
                  <div 
                    key={update.id} 
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-safe/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-safe" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{update.message}</span>
                    </div>
                    <span className="text-xs text-safe">✓</span>
                  </div>
                );
              })}
              
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-sm text-muted-foreground">Monitoring active...</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Location Map */}
        <Card className="border-emergency/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emergency" />
                Live Location
              </h3>
              {isTracking && (
                <span className="text-xs px-2 py-1 rounded-full bg-safe/10 text-safe flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                  Live
                </span>
              )}
            </div>
            
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/5 to-emergency/5 flex items-center justify-center relative overflow-hidden border border-border">
              {sosLocation ? (
                <>
                  {/* Animated location marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-emergency/10 animate-ping absolute -top-10 -left-10" />
                      <div className="w-12 h-12 rounded-full bg-emergency/30 animate-pulse absolute -top-4 -left-4" />
                      <div className="w-6 h-6 rounded-full bg-emergency relative z-10 flex items-center justify-center shadow-lg">
                        <Navigation className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Location info overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="bg-card/95 backdrop-blur-sm rounded-lg p-3 border border-border">
                      <p className="text-sm text-foreground font-medium line-clamp-1 mb-1">
                        {sosLocation.address || `${sosLocation.latitude.toFixed(6)}, ${sosLocation.longitude.toFixed(6)}`}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>±{Math.round(sosLocation.accuracy)}m accuracy</span>
                        <span>{sosLocationHistory.length} points tracked</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-sm">Acquiring location...</span>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            {sosLocation && (
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLocationToClipboard}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInMaps}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Map
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Recording Waveform */}
        {features.autoRecording && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emergency" />
                  Audio Recording
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
                  <span className="text-xs text-muted-foreground font-mono">{formatTime(elapsedTime)}</span>
                </div>
              </div>
              
              {/* Waveform visualization */}
              <div className="h-16 flex items-center justify-center gap-[2px] bg-secondary/30 rounded-lg px-4">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full transition-all duration-100"
                    style={{ height: `${level * 100}%` }}
                  />
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Recording encrypted and stored securely
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Response Status */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact Status
            </h3>
            
            <div className="space-y-3">
              {emergencyContacts.length > 0 ? (
                emergencyContacts.map((contact) => {
                  const status = contactStatuses.find(s => s.id === contact.id);
                  return (
                    <div 
                      key={contact.id}
                      className="p-3 rounded-xl bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        {contact.priority === 'primary' && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      
                      {/* Delivery status per channel */}
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">SMS:</span>
                          {status && getStatusIcon(status.sms)}
                          <span className={status?.sms === 'read' ? 'text-primary' : status?.sms === 'delivered' ? 'text-safe' : 'text-muted-foreground'}>
                            {status ? getStatusLabel(status.sms) : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Send className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">WA:</span>
                          {status && getStatusIcon(status.whatsapp)}
                          <span className={status?.whatsapp === 'delivered' ? 'text-safe' : 'text-muted-foreground'}>
                            {status ? getStatusLabel(status.whatsapp) : 'Pending'}
                          </span>
                        </div>
                        {contact.priority === 'primary' && status?.call === 'calling' && (
                          <div className="flex items-center gap-1.5">
                            <PhoneCall className="w-3 h-3 text-alert animate-pulse" />
                            <span className="text-alert">Calling...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No emergency contacts configured
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Features Grid */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Active Features</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emergency/5 border border-emergency/20">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 text-emergency" />
                  <span className="text-xs text-muted-foreground">Audio</span>
                </div>
                <p className="text-sm font-medium text-foreground">{formatTime(elapsedTime)}</p>
                <p className="text-xs text-muted-foreground">Recording</p>
              </div>
              
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Photos</span>
                </div>
                <p className="text-sm font-medium text-foreground">{photoCount} captured</p>
                <p className="text-xs text-muted-foreground">Every 5 sec</p>
              </div>
              
              <div className="p-3 rounded-xl bg-safe/5 border border-safe/20">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-safe" />
                  <span className="text-xs text-muted-foreground">Location</span>
                </div>
                <p className="text-sm font-medium text-foreground">{sosLocationHistory.length} points</p>
                <p className="text-xs text-muted-foreground">Every 10 sec</p>
              </div>
              
              <div className="p-3 rounded-xl bg-alert/5 border border-alert/20">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-alert" />
                  <span className="text-xs text-muted-foreground">Alerts</span>
                </div>
                <p className="text-sm font-medium text-foreground">{emergencyContacts.length} contacts</p>
                <p className="text-xs text-muted-foreground">Notified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Cancel button fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
        {showCancelDialog ? (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-center text-muted-foreground">Enter PIN to cancel alert</p>
            <input
              type="password"
              value={cancelPin}
              onChange={(e) => setCancelPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              className="w-full h-14 bg-secondary/50 border border-border rounded-xl px-4 text-center text-2xl tracking-[0.5em] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              inputMode="numeric"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelPin('');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCancelAttempt}
                disabled={cancelPin.length < 4}
                className="flex-1 bg-safe hover:bg-safe/90 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                I'm Safe
              </Button>
            </div>
          </div>
        ) : countdown > 0 ? (
          <Button
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            className="w-full h-14 border-safe/30 hover:bg-safe/10 text-safe text-lg"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel Alert
          </Button>
        ) : (
          <Button
            onClick={() => setShowCancelDialog(true)}
            className="w-full h-14 bg-safe hover:bg-safe/90 text-white text-lg"
          >
            <Shield className="w-5 h-5 mr-2" />
            I'm Safe - End Alert
          </Button>
        )}
      </div>
    </div>
  );
}
