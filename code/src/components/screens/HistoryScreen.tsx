import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  AlertTriangle, 
  MapPin, 
  Clock,
  Mic,
  Camera,
  Users,
  Filter,
  Calendar,
  Search,
  ChevronRight,
  Play,
  Image,
  FileText,
  Share2,
  Trash2,
  Hand,
  Volume2,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/appContext';
import { BottomNav } from '@/components/BottomNav';
import { QuickExitMenu } from '@/components/QuickExitMenu';
import { auth, getSOSEvents, type SOSEvent } from '@/lib/firebase';

type AlertType = 'emergency' | 'false-alarm' | 'test';
type TriggerMethod = 'voice' | 'gesture' | 'manual' | 'distress' | 'volume' | 'shake';

interface AlertRecord {
  id: string;
  type: AlertType;
  date: Date;
  duration: number; // seconds
  triggerMethod: TriggerMethod;
  location: {
    address: string;
    lat: number;
    lon: number;
  };
  contacts: {
    name: string;
    responded: boolean;
  }[];
  media: {
    photos: number;
    audioDuration: number;
  };
  threatLevel: 'low' | 'medium' | 'high';
}

function convertSOSEventToAlert(event: SOSEvent): AlertRecord {
  const triggeredAt = new Date(event.triggeredAt);
  const resolvedAt = event.resolvedAt ? new Date(event.resolvedAt) : new Date();
  const durationSeconds = Math.floor((resolvedAt.getTime() - triggeredAt.getTime()) / 1000);
  
  let alertType: AlertType = 'emergency';
  if (event.status === 'cancelled') alertType = 'false-alarm';
  else if (event.triggerMethod === 'manual') alertType = 'test';
  
  let triggerMethod: TriggerMethod = 'manual';
  if (event.triggerMethod === 'voice') triggerMethod = 'voice';
  else if (event.triggerMethod === 'gesture') triggerMethod = 'gesture';
  else if (event.triggerMethod === 'distress_password') triggerMethod = 'distress';

  return {
    id: event.id,
    type: alertType,
    date: triggeredAt,
    duration: Math.max(durationSeconds, 0),
    triggerMethod,
    location: event.location ? {
      address: event.location.address || 'Unknown location',
      lat: event.location.lat,
      lon: event.location.lng,
    } : { address: 'No location data', lat: 0, lon: 0 },
    contacts: event.contactsNotified.map(name => ({ name, responded: true })),
    media: { photos: 0, audioDuration: 0 },
    threatLevel: event.status === 'active' ? 'high' : 'medium',
  };
}

export function HistoryScreen() {
  const { setScreen } = useApp();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const sosEvents = await getSOSEvents(userId);
        const convertedAlerts = sosEvents.map(convertSOSEventToAlert);
        setAlerts(convertedAlerts.sort((a, b) => b.date.getTime() - a.date.getTime()));
      } catch (error) {
        console.error('Failed to load alert history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const getTypeColor = (type: AlertType) => {
    switch (type) {
      case 'emergency': return 'bg-emergency text-white';
      case 'false-alarm': return 'bg-alert text-white';
      case 'test': return 'bg-safe text-white';
    }
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'emergency': return 'Emergency';
      case 'false-alarm': return 'False Alarm';
      case 'test': return 'Test';
    }
  };

  const getTriggerIcon = (method: TriggerMethod) => {
    switch (method) {
      case 'voice': return Mic;
      case 'gesture': return Hand;
      case 'manual': return AlertTriangle;
      case 'distress': return Shield;
      case 'volume': return Volume2;
      case 'shake': return AlertTriangle;
    }
  };

  const getTriggerLabel = (method: TriggerMethod) => {
    switch (method) {
      case 'voice': return 'Voice Keyword';
      case 'gesture': return 'Gesture';
      case 'manual': return 'Manual';
      case 'distress': return 'Distress Password';
      case 'volume': return 'Volume Button';
      case 'shake': return 'Shake';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (searchQuery && !alert.location.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Alert Detail View
  if (selectedAlert) {
    const TriggerIcon = getTriggerIcon(selectedAlert.triggerMethod);
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <button 
            onClick={() => setSelectedAlert(null)}
            className="p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Alert Details</h1>
        </header>

        <main className="flex-1 p-4 space-y-4 overflow-auto">
          {/* Alert Type Banner */}
          <div className={`p-4 rounded-2xl ${getTypeColor(selectedAlert.type)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Alert Type</p>
                <p className="text-xl font-bold">{getTypeLabel(selectedAlert.type)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">{formatDate(selectedAlert.date)}</p>
                <p className="text-lg font-medium">{selectedAlert.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{formatDuration(selectedAlert.duration)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Camera className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{selectedAlert.media.photos}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Mic className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{formatDuration(selectedAlert.media.audioDuration)}</p>
                <p className="text-xs text-muted-foreground">Audio</p>
              </CardContent>
            </Card>
          </div>

          {/* Trigger Method */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Trigger Method</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TriggerIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{getTriggerLabel(selectedAlert.triggerMethod)}</p>
                  <p className="text-sm text-muted-foreground">
                    Threat Level: <span className={`font-medium ${
                      selectedAlert.threatLevel === 'high' ? 'text-emergency' :
                      selectedAlert.threatLevel === 'medium' ? 'text-alert' : 'text-safe'
                    }`}>{selectedAlert.threatLevel}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </h3>
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/5 to-safe/5 flex items-center justify-center mb-3 border border-border">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Map Preview</p>
                </div>
              </div>
              <p className="text-sm text-foreground">{selectedAlert.location.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedAlert.location.lat.toFixed(6)}, {selectedAlert.location.lon.toFixed(6)}
              </p>
            </CardContent>
          </Card>

          {/* Contacts Notified */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Contacts Notified
              </h3>
              <div className="space-y-2">
                {selectedAlert.contacts.map((contact, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {contact.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{contact.name}</span>
                    </div>
                    {contact.responded ? (
                      <div className="flex items-center gap-1 text-safe">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Responded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">No response</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Media Captured */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Media Captured</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Image className="w-6 h-6 text-primary" />
                  <span className="text-sm">View Photos</span>
                  <span className="text-xs text-muted-foreground">{selectedAlert.media.photos} images</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Play className="w-6 h-6 text-primary" />
                  <span className="text-sm">Play Audio</span>
                  <span className="text-xs text-muted-foreground">{formatDuration(selectedAlert.media.audioDuration)}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-3">
              <FileText className="w-5 h-5" />
              Export as PDF Report
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <Share2 className="w-5 h-5" />
              Share with Authorities
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 text-emergency hover:text-emergency">
              <Trash2 className="w-5 h-5" />
              Delete Alert
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Alert List View
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <button 
          onClick={() => setScreen('dashboard')}
          className="p-2 hover:bg-accent rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground flex-1">Alert History</h1>
        <QuickExitMenu />
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </header>

      {/* Search and Filters */}
      {showFilters && (
        <div className="p-4 border-b border-border space-y-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location..."
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'emergency', 'false-alarm', 'test'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterType === type
                    ? type === 'emergency' ? 'bg-emergency text-white' :
                      type === 'false-alarm' ? 'bg-alert text-white' :
                      type === 'test' ? 'bg-safe text-white' :
                      'bg-primary text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}
              >
                {type === 'all' ? 'All' : getTypeLabel(type as AlertType)}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading alert history...</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const TriggerIcon = getTriggerIcon(alert.triggerMethod);
              
              return (
                <Card 
                  key={alert.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Type indicator */}
                      <div className={`w-2 h-full min-h-[60px] rounded-full ${
                        alert.type === 'emergency' ? 'bg-emergency' :
                        alert.type === 'false-alarm' ? 'bg-alert' : 'bg-safe'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(alert.type)}`}>
                                {getTypeLabel(alert.type)}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <TriggerIcon className="w-3 h-3" />
                                {getTriggerLabel(alert.triggerMethod)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-1">{alert.location.address}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(alert.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(alert.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {alert.media.photos}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {alert.contacts.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No Alerts Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Your alert history will appear here when you trigger an SOS'}
            </p>
          </div>
        )}
      </main>
      
      <BottomNav activeTab="history" />
    </div>
  );
}
