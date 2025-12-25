import { useState, useEffect } from 'react';
import { 
  Shield, ArrowLeft, AlertTriangle, Clock, 
  Users, ChevronRight, CheckCircle,
  Mic, MapPin, Bell, 
  Activity, RefreshCw, Eye,
  Phone, Video, Radio, UserCheck, UserX, LogOut, User,
  ChevronLeft, Menu, X, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/appContext';
import { 
  subscribeToAllUsers, 
  subscribeToUserSOSEvents,
  subscribeToSOSStream,
  type UserData, 
  type SOSEvent,
  type Unsubscribe
} from '@/lib/firebase';

type AdminSection = 'users' | 'active-sos' | 'permissions' | 'locations' | 'alerts';

interface UserWithId extends UserData {
  id: string;
}

interface AdminDashboardScreenProps {
  onLogout?: () => void;
}

interface StreamData {
  audioChunks?: string[];
  videoFrame?: string;
  timestamp: string;
  isStreaming: boolean;
}

const AdminDashboardScreen = ({ onLogout }: AdminDashboardScreenProps = {}) => {
  const { setScreen } = useApp();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [allSOSEvents, setAllSOSEvents] = useState<(SOSEvent & { userEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [selectedSOSEvent, setSelectedSOSEvent] = useState<(SOSEvent & { userEmail?: string }) | null>(null);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    const unsubscribes: Unsubscribe[] = [];
    let sosUnsubscribes: Unsubscribe[] = [];

    try {
      const usersUnsub = subscribeToAllUsers((allUsers) => {
        setUsers(allUsers);
        setLoading(false);
        setIsRealtime(true);
        setError(null);
        
        sosUnsubscribes.forEach(unsub => unsub());
        sosUnsubscribes = [];
        
        allUsers.forEach((user) => {
          const sosUnsub = subscribeToUserSOSEvents(user.id, (events) => {
            setAllSOSEvents(prev => {
              const otherEvents = prev.filter(e => e.userId !== user.id);
              const userEvents = events.map(e => ({ ...e, userEmail: user.email }));
              return [...otherEvents, ...userEvents].sort((a, b) => 
                new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
              );
            });
          });
          sosUnsubscribes.push(sosUnsub);
        });
      });
      unsubscribes.push(usersUnsub);
    } catch (err: any) {
      console.error('Failed to setup realtime listeners:', err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        setIsPermissionError(true);
        setError('Firebase permission denied. Please configure Firestore security rules or ensure you have admin access.');
      } else {
        setError('Failed to load data. Please check your Firebase configuration.');
      }
      setLoading(false);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
      sosUnsubscribes.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    if (!selectedSOSEvent) {
      setStreamData(null);
      return;
    }

    const unsub = subscribeToSOSStream(selectedSOSEvent.userId, selectedSOSEvent.id, (data) => {
      setStreamData(data);
    });

    return () => unsub();
  }, [selectedSOSEvent]);

  const activeSOSEvents = allSOSEvents.filter(e => e.status === 'active');
  const resolvedSOSEvents = allSOSEvents.filter(e => e.status === 'resolved');
  const usersWithPermissionIssues = users.filter(u => 
    u.permissions && (!u.permissions.location || !u.permissions.notifications)
  );

  const sections: { id: AdminSection; label: string; icon: React.ElementType; count?: number; alert?: boolean }[] = [
    { id: 'users', label: 'All Users', icon: Users, count: users.length },
    { id: 'active-sos', label: 'Active SOS', icon: AlertTriangle, count: activeSOSEvents.length, alert: activeSOSEvents.length > 0 },
    { id: 'permissions', label: 'Permissions', icon: Shield, count: usersWithPermissionIssues.length },
    { id: 'locations', label: 'Live Locations', icon: MapPin },
    { id: 'alerts', label: 'Alert History', icon: Bell, count: allSOSEvents.length }
  ];

  const handleBack = () => {
    if (selectedSOSEvent) {
      setSelectedSOSEvent(null);
    } else if (selectedUser) {
      setSelectedUser(null);
    } else {
      setScreen('settings');
    }
  };

  const renderSidebar = () => (
    <aside 
      className={`h-full border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 flex flex-col ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <div className="p-3 border-b border-border flex items-center justify-between gap-2">
        {sidebarExpanded && (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Admin</span>
          </div>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          data-testid="button-toggle-sidebar"
        >
          {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setSelectedUser(null);
                setSelectedSOSEvent(null);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : section.alert 
                    ? 'bg-emergency/10 text-emergency hover:bg-emergency/20' 
                    : 'hover:bg-accent text-foreground'
              }`}
              data-testid={`nav-${section.id}`}
              title={!sidebarExpanded ? section.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${section.alert && !isActive ? 'animate-pulse' : ''}`} />
              {sidebarExpanded && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{section.label}</span>
                  {section.count !== undefined && (
                    <Badge 
                      variant={isActive ? 'secondary' : section.alert ? 'destructive' : 'outline'} 
                      className="text-xs"
                    >
                      {section.count}
                    </Badge>
                  )}
                </>
              )}
              {!sidebarExpanded && section.count !== undefined && section.count > 0 && (
                <span className={`absolute right-1 top-1 w-2 h-2 rounded-full ${
                  section.alert ? 'bg-emergency animate-pulse' : 'bg-primary'
                }`} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => {
            if (onLogout) onLogout();
            setScreen('settings');
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
          data-testid="button-logout-admin"
          title={!sidebarExpanded ? 'Exit Admin' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {sidebarExpanded && <span className="text-sm font-medium">Exit Admin</span>}
        </button>
      </div>
    </aside>
  );

  const renderUsersSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="text-sm text-muted-foreground">
          {error ? 'Error loading data' : `${users.length} registered user${users.length !== 1 ? 's' : ''}`}
        </div>
        {isRealtime && (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Connecting to live data...</p>
        </div>
      ) : error ? (
        <Card className={isPermissionError ? 'border-amber-500 bg-amber-500/10' : 'border-red-500 bg-red-500/10'}>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className={`w-12 h-12 mx-auto mb-3 ${isPermissionError ? 'text-amber-500' : 'text-red-500'}`} />
              <h3 className="font-semibold text-foreground mb-2">
                {isPermissionError ? 'Firebase Permission Required' : 'Connection Error'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-muted-foreground">No users registered yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card 
              key={user.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                user.activeSosEventId ? 'border-red-500 bg-red-500/5 animate-pulse' : 'hover:bg-accent/50'
              }`}
              onClick={() => setSelectedUser(user)}
              data-testid={`card-user-${user.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    user.activeSosEventId ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {user.displayName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">{user.displayName || 'User'}</p>
                      {user.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {user.activeSosEventId && (
                      <Badge variant="destructive" className="mt-2 animate-pulse">SOS ACTIVE</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveSOSSection = () => (
    <div className="space-y-4">
      {activeSOSEvents.length === 0 ? (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-500">All Users Safe</h3>
            <p className="text-muted-foreground mt-2">No active SOS events at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeSOSEvents.map((event, i) => {
            const user = users.find(u => u.id === event.userId);
            return (
              <Card 
                key={event.id || i} 
                className="border-red-500 bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-all"
                onClick={() => setSelectedSOSEvent(event)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-500 text-lg">ACTIVE SOS</h3>
                          <p className="text-foreground">{user?.displayName || event.userEmail}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Triggered</p>
                          <p className="text-foreground font-medium">
                            {new Date(event.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Method</p>
                          <p className="text-foreground font-medium capitalize">
                            {event.triggerMethod?.replace('_', ' ') || 'Unknown'}
                          </p>
                        </div>
                        {event.location && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Location</p>
                            <p className="text-foreground font-medium">
                              {event.location.address || `${event.location.lat}, ${event.location.lng}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSOSEvent(event);
                        }}
                      >
                        <Video className="w-4 h-4" />
                        View Live
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const user = users.find(u => u.id === event.userId);
                          if (user?.phone) {
                            window.open(`tel:${user.phone}`, '_blank');
                          }
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderLiveStreamView = () => {
    if (!selectedSOSEvent) return null;
    const user = users.find(u => u.id === selectedSOSEvent.userId);

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedSOSEvent(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Active SOS
        </Button>

        <Card className="border-red-500 bg-red-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Radio className="w-5 h-5 animate-pulse" />
                Live Feed - {user?.displayName || selectedSOSEvent.userEmail}
              </CardTitle>
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              {streamData?.videoFrame ? (
                <img 
                  src={streamData.videoFrame} 
                  alt="Live video feed" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p>Waiting for video stream...</p>
                    <p className="text-xs mt-1">
                      {streamData?.isStreaming ? 'Stream connected' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="bg-black/50 hover:bg-black/70"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                  >
                    {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  {streamData?.isStreaming && (
                    <Badge className="bg-red-500">
                      <Radio className="w-3 h-3 mr-1 animate-pulse" />
                      Recording
                    </Badge>
                  )}
                </div>
                <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                  {streamData?.timestamp ? new Date(streamData.timestamp).toLocaleTimeString() : '--:--:--'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className={`w-4 h-4 ${streamData?.audioChunks?.length ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Audio</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {streamData?.audioChunks?.length ? `${streamData.audioChunks.length} chunks received` : 'No audio data'}
                  </p>
                  {streamData?.audioChunks?.length && streamData.audioChunks.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                    >
                      {isAudioPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isAudioPlaying ? 'Pause' : 'Play Audio'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedSOSEvent.location?.address || 
                     (selectedSOSEvent.location ? `${selectedSOSEvent.location.lat}, ${selectedSOSEvent.location.lng}` : 'No location data')}
                  </p>
                  {selectedSOSEvent.location && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${selectedSOSEvent.location!.lat},${selectedSOSEvent.location!.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Open in Maps
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Emergency Contacts Notified</h4>
                <div className="space-y-2">
                  {selectedSOSEvent.contactsNotified?.length ? (
                    selectedSOSEvent.contactsNotified.map((contact, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                        <span className="text-sm">{contact}</span>
                        <Badge variant="outline" className="text-green-500 border-green-500">Notified</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No contacts notified yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPermissionsSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="bg-green-500/10">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {users.filter(u => u.permissions?.location && u.permissions?.notifications).length}
            </p>
            <p className="text-xs text-muted-foreground">All Permissions</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10">
          <CardContent className="p-4 text-center">
            <UserX className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{usersWithPermissionIssues.length}</p>
            <p className="text-xs text-muted-foreground">Missing Permissions</p>
          </CardContent>
        </Card>
      </div>

      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div>
                <p className="font-medium text-foreground">{user.displayName || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              {user.permissions ? (
                <Badge variant={
                  user.permissions.location && user.permissions.notifications ? 'default' : 'destructive'
                }>
                  {user.permissions.location && user.permissions.notifications ? 'OK' : 'Issues'}
                </Badge>
              ) : (
                <Badge variant="secondary">Not Set</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Camera', granted: user.permissions?.camera, icon: Video },
                { name: 'Microphone', granted: user.permissions?.microphone, icon: Mic },
                { name: 'Location', granted: user.permissions?.location, icon: MapPin },
                { name: 'Notifications', granted: user.permissions?.notifications, icon: Bell },
              ].map((perm, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs ${
                  perm.granted ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                }`}>
                  <perm.icon className="w-3 h-3" />
                  <span>{perm.name}</span>
                  <span className="ml-auto">{perm.granted ? 'Granted' : 'Denied'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderLocationsSection = () => (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Live Location Map</p>
            <p className="text-xs text-muted-foreground/60">
              {users.filter(u => u.lastLocation).length} users with tracked locations
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {users.filter(u => u.lastLocation).map((user) => (
          <Card key={user.id} className={user.activeSosEventId ? 'border-red-500 animate-pulse' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  user.activeSosEventId ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.displayName || user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.lastLocation?.address || `${user.lastLocation?.lat}, ${user.lastLocation?.lng}`}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {user.lastLocation?.timestamp && new Date(user.lastLocation.timestamp).toLocaleString()}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (user.lastLocation) {
                      const url = `https://www.google.com/maps?q=${user.lastLocation.lat},${user.lastLocation.lng}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAlertsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-medium text-foreground">All SOS Events</h3>
        <Badge variant="outline">{allSOSEvents.length} total</Badge>
      </div>

      {allSOSEvents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-muted-foreground">No alerts recorded</p>
          </CardContent>
        </Card>
      ) : (
        allSOSEvents.map((event, i) => (
          <Card 
            key={event.id || i} 
            className={event.status === 'active' ? 'border-red-500 bg-red-500/10' : ''}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={
                      event.status === 'active' ? 'destructive' : 
                      event.status === 'resolved' ? 'default' : 'secondary'
                    }>
                      {event.status}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{event.userEmail}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.triggeredAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Trigger: {event.triggerMethod?.replace('_', ' ') || 'Unknown'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderUserDetail = () => {
    if (!selectedUser) return null;
    
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedUser(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>

        <Card className={selectedUser.activeSosEventId ? 'border-red-500 bg-red-500/10' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                selectedUser.activeSosEventId ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'
              }`}>
                {selectedUser.displayName?.charAt(0) || selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedUser.displayName || 'User'}</h2>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedUser.isAdmin && <Badge>Admin</Badge>}
                  {selectedUser.activeSosEventId && (
                    <Badge variant="destructive" className="animate-pulse">SOS ACTIVE</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">User ID</span>
                <span className="text-foreground font-mono text-xs">{selectedUser.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Setup Complete</span>
                <Badge variant={selectedUser.isSetupComplete ? 'default' : 'secondary'}>
                  {selectedUser.isSetupComplete ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Disguise Mode</span>
                <span className="text-foreground capitalize">{selectedUser.disguiseMode}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Emergency Contacts</span>
                <span className="text-foreground">{selectedUser.emergencyContacts?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Features Enabled</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedUser.features && Object.entries(selectedUser.features).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1">
                  <span className="text-muted-foreground capitalize text-sm">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                    {value ? 'On' : 'Off'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedSOSEvent) return renderLiveStreamView();
    if (selectedUser) return renderUserDetail();

    switch (activeSection) {
      case 'users': return renderUsersSection();
      case 'active-sos': return renderActiveSOSSection();
      case 'permissions': return renderPermissionsSection();
      case 'locations': return renderLocationsSection();
      case 'alerts': return renderAlertsSection();
      default: return renderUsersSection();
    }
  };

  const getSectionTitle = () => {
    if (selectedSOSEvent) return 'Live SOS Feed';
    if (selectedUser) return 'User Details';
    return sections.find(s => s.id === activeSection)?.label || 'Admin Dashboard';
  };

  return (
    <div className="h-screen flex bg-background">
      {renderSidebar()}
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-4 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {(selectedUser || selectedSOSEvent) && (
              <Button size="icon" variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold text-foreground">{getSectionTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isRealtime && (
              <Badge variant="outline" className="text-green-500 border-green-500">
                <Activity className="w-3 h-3 mr-1" />
                Live Data
              </Badge>
            )}
            {activeSOSEvents.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {activeSOSEvents.length} Active SOS
              </Badge>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;
