import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/appContext';
import { 
  MapPin, 
  Camera, 
  Mic, 
  MessageSquare, 
  Phone, 
  Bell, 
  Activity,
  Battery,
  Check,
  X,
  ChevronRight,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  icon: React.ReactNode;
  reason: string;
  recommendation?: string;
  critical?: boolean;
  status: 'pending' | 'granted' | 'denied';
}

export function PermissionsScreen() {
  const { setScreen } = useApp();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'location',
      name: 'Location (GPS)',
      icon: <MapPin className="h-5 w-5" />,
      reason: 'Send exact location during emergencies',
      recommendation: 'Always Allow for background tracking',
      critical: true,
      status: 'pending'
    },
    {
      id: 'camera',
      name: 'Camera',
      icon: <Camera className="h-5 w-5" />,
      reason: 'Gesture recognition and emergency photo capture',
      status: 'pending'
    },
    {
      id: 'microphone',
      name: 'Microphone',
      icon: <Mic className="h-5 w-5" />,
      reason: 'Voice keyword detection and audio recording',
      status: 'pending'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: <MessageSquare className="h-5 w-5" />,
      reason: 'Send emergency messages without internet',
      critical: true,
      status: 'pending'
    },
    {
      id: 'phone',
      name: 'Phone',
      icon: <Phone className="h-5 w-5" />,
      reason: 'Auto-call emergency contacts',
      status: 'pending'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      reason: 'Silent background operation alerts',
      status: 'pending'
    },
    {
      id: 'background',
      name: 'Background Activity',
      icon: <Activity className="h-5 w-5" />,
      reason: 'Run safety features when phone is locked',
      critical: true,
      status: 'pending'
    },
    {
      id: 'battery',
      name: 'Battery Optimization',
      icon: <Battery className="h-5 w-5" />,
      reason: 'Prevent Android from killing background services',
      critical: true,
      status: 'pending'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const requestPermission = async (id: string) => {
    // Simulate permission request - in native app, this would use Capacitor plugins
    const newStatus: 'granted' | 'denied' = Math.random() > 0.1 ? 'granted' : 'denied';
    
    setPermissions(prev => 
      prev.map(p => p.id === id ? { ...p, status: newStatus } : p)
    );

    // Move to next permission after a short delay
    setTimeout(() => {
      if (currentIndex < permissions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowAll(true);
      }
    }, 500);
  };

  const grantedCount = permissions.filter(p => p.status === 'granted').length;
  const criticalDenied = permissions.filter(p => p.critical && p.status === 'denied');

  const handleContinue = () => {
    setScreen('password-setup');
  };

  const currentPermission = permissions[currentIndex];

  if (!showAll && currentPermission) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Progress Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Permission {currentIndex + 1} of {permissions.length}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-muted-foreground"
            >
              Skip All
            </Button>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex) / permissions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            currentPermission.critical 
              ? 'bg-destructive/10 text-destructive' 
              : 'bg-primary/10 text-primary'
          }`}>
            {currentPermission.icon}
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">
            {currentPermission.name}
          </h2>

          {currentPermission.critical && (
            <div className="flex items-center gap-1 text-destructive text-sm mb-4">
              <AlertTriangle className="h-4 w-4" />
              <span>Critical for emergency features</span>
            </div>
          )}

          <p className="text-muted-foreground text-center mb-6 max-w-xs">
            {currentPermission.reason}
          </p>

          {currentPermission.recommendation && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-center">
                  <span className="font-medium">Recommendation:</span>{' '}
                  {currentPermission.recommendation}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="w-full max-w-xs space-y-3">
            <Button 
              className="w-full"
              size="lg"
              onClick={() => requestPermission(currentPermission.id)}
            >
              Allow {currentPermission.name}
            </Button>
            <Button 
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setPermissions(prev => 
                  prev.map(p => p.id === currentPermission.id ? { ...p, status: 'denied' } : p)
                );
                if (currentIndex < permissions.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                } else {
                  setShowAll(true);
                }
              }}
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Summary View
  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Permissions Summary</h1>
          <p className="text-sm text-muted-foreground">
            {grantedCount} of {permissions.length} enabled
          </p>
        </div>
      </div>

      {criticalDenied.length > 0 && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Critical Permissions Missing</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Some emergency features won't work without: {criticalDenied.map(p => p.name).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2 flex-1">
        {permissions.map((permission) => (
          <Card 
            key={permission.id}
            className={`${
              permission.status === 'denied' && permission.critical
                ? 'border-destructive/30'
                : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  permission.status === 'granted' 
                    ? 'bg-green-500/10 text-green-500'
                    : permission.status === 'denied'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {permission.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{permission.name}</span>
                    {permission.critical && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{permission.reason}</p>
                </div>
                <div className="shrink-0">
                  {permission.status === 'granted' ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  ) : permission.status === 'denied' ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => requestPermission(permission.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => requestPermission(permission.id)}
                    >
                      Enable
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        className="w-full mt-6" 
        size="lg"
        onClick={handleContinue}
      >
        Continue to Setup
      </Button>
    </div>
  );
}
