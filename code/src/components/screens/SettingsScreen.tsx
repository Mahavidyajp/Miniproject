import { useState } from 'react';
import { 
  ChevronLeft, 
  Calculator, 
  Lock, 
  Users, 
  Mic, 
  Hand, 
  Bell,
  Shield,
  Battery,
  Trash2,
  HelpCircle,
  Info,
  ChevronRight,
  User,
  Heart,
  MessageSquare,
  MapPin,
  Camera,
  Video,
  Phone,
  Volume2,
  Smartphone,
  Vibrate,
  Clock,
  Cloud,
  Download,
  FileText,
  Settings2,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  Eye,
  Timer,
  Zap,
  Palette,
  Type,
  Play,
  Mail,
  ExternalLink,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useApp, DisguiseMode } from '@/lib/appContext';
import { useToast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { QuickExitMenu } from '@/components/QuickExitMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SettingsSection = 
  | 'main' 
  | 'account' 
  | 'passwords' 
  | 'contacts' 
  | 'ai-voice'
  | 'ai-gesture'
  | 'ai-threat'
  | 'triggers'
  | 'sos-response'
  | 'location'
  | 'disguise'
  | 'notifications'
  | 'battery'
  | 'privacy'
  | 'advanced'
  | 'about';

export function SettingsScreen() {
  const { 
    setScreen, 
    disguiseMode, 
    setDisguiseMode,
    features, 
    toggleFeature,
    emergencyContacts,
    logout,
    changePassword,
    normalPassword,
    displayName,
    email,
    bloodType,
    allergies,
    medications,
    emergencyMessage,
    updateProfile
  } = useApp();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');
  
  // Password change dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordType, setPasswordType] = useState<'normal' | 'distress'>('normal');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  // Admin password dialog state  
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Profile edit dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileEditField, setProfileEditField] = useState<'displayName' | 'bloodType' | 'allergies' | 'medications' | 'emergencyMessage'>('displayName');
  const [profileEditValue, setProfileEditValue] = useState('');

  const handleOpenProfileDialog = (field: typeof profileEditField) => {
    setProfileEditField(field);
    setProfileEditValue(
      field === 'displayName' ? displayName :
      field === 'bloodType' ? bloodType :
      field === 'allergies' ? allergies :
      field === 'medications' ? medications :
      emergencyMessage
    );
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = () => {
    updateProfile({ [profileEditField]: profileEditValue });
    toast({ title: 'Saved', description: 'Profile updated successfully' });
    setProfileDialogOpen(false);
  };

  const getProfileFieldLabel = () => {
    switch (profileEditField) {
      case 'displayName': return 'Display Name';
      case 'bloodType': return 'Blood Type';
      case 'allergies': return 'Allergies';
      case 'medications': return 'Medications';
      case 'emergencyMessage': return 'Emergency Message';
    }
  };

  const handleOpenPasswordDialog = (type: 'normal' | 'distress') => {
    setPasswordType(type);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordDialogOpen(true);
  };

  const handleChangePassword = () => {
    if (newPasswordInput !== confirmPasswordInput) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    
    const result = changePassword(passwordType, currentPasswordInput, newPasswordInput);
    
    if (result.success) {
      toast({ title: 'Success', description: `${passwordType === 'normal' ? 'Normal' : 'Distress'} password changed successfully` });
      setPasswordDialogOpen(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAdminAccess = () => {
    if (adminPasswordInput === normalPassword) {
      setAdminDialogOpen(false);
      setAdminPasswordInput('');
      setScreen('admin');
    } else {
      toast({ title: 'Error', description: 'Incorrect password', variant: 'destructive' });
    }
  };

  // Settings state
  const [sosSettings, setSosSettings] = useState({
    sendSms: true,
    makeCall: true,
    sendWhatsapp: true,
    recordAudio: true,
    audioDuration: 10,
    capturePhotos: true,
    photoInterval: 5,
    recordVideo: false,
    shareLocation: true,
    trackingDuration: 'until-stopped',
  });

  const [locationSettings, setLocationSettings] = useState({
    updateFrequency: 10,
    displayFormat: 'address',
    batterySaver: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    cloudBackup: false,
    autoDelete: 'never',
  });

  const [biometricSettings, setBiometricSettings] = useState({
    fingerprint: false,
    faceUnlock: false,
    biometricDistress: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    autoLockTimer: 30,
    captureOnFail: true,
    maxFailedAttempts: 5,
    lockoutDuration: 5,
  });

  const [autoLockDialogOpen, setAutoLockDialogOpen] = useState(false);
  
  const [disguiseCustomization, setDisguiseCustomization] = useState({
    appName: 'Calculator',
    appIcon: 'default',
  });
  
  const [appNameDialogOpen, setAppNameDialogOpen] = useState(false);
  const [appIconDialogOpen, setAppIconDialogOpen] = useState(false);
  const [customAppName, setCustomAppName] = useState('');

  const handleBack = () => {
    if (currentSection === 'main') {
      setScreen('dashboard');
    } else {
      setCurrentSection('main');
    }
  };

  const renderHeader = (title: string) => (
    <header className="p-4 flex items-center gap-3 border-b border-border sticky top-0 bg-background z-10">
      <button 
        onClick={handleBack}
        className="p-2 hover:bg-accent rounded-xl transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <h1 className="text-xl font-semibold text-foreground flex-1">{title}</h1>
      <QuickExitMenu />
    </header>
  );

  const SettingsItem = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    destructive = false,
    toggle,
    onToggle
  }: {
    icon: any;
    label: string;
    value?: string;
    onClick?: () => void;
    destructive?: boolean;
    toggle?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <button
      onClick={toggle ? undefined : onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          destructive ? 'bg-emergency/10' : 'bg-primary/10'
        }`}>
          <Icon className={`w-5 h-5 ${destructive ? 'text-emergency' : 'text-primary'}`} />
        </div>
        <span className={`font-medium ${destructive ? 'text-emergency' : 'text-foreground'}`}>
          {label}
        </span>
      </div>
      {toggle !== undefined ? (
        <Switch checked={toggle} onCheckedChange={onToggle} />
      ) : (
        <div className="flex items-center gap-2">
          {value && <span className="text-sm text-muted-foreground">{value}</span>}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </button>
  );

  // Main Settings View
  if (currentSection === 'main') {
    const sections = [
      {
        title: 'Account',
        items: [
          { icon: User, label: 'Profile & Medical Info', action: () => setCurrentSection('account') },
        ],
      },
      {
        title: 'Security',
        items: [
          { icon: Lock, label: 'Password & Biometrics', value: 'Manage PINs', action: () => setCurrentSection('passwords') },
          { icon: Users, label: 'Emergency Contacts', value: `${emergencyContacts.length} contacts`, action: () => setCurrentSection('contacts') },
        ],
      },
      {
        title: 'AI Configuration',
        items: [
          { icon: Mic, label: 'Voice Keywords', value: 'Configure', action: () => setCurrentSection('ai-voice') },
          { icon: Hand, label: 'Gesture Recognition', value: 'Configure', action: () => setCurrentSection('ai-gesture') },
          { icon: Shield, label: 'Threat Analysis', value: 'Medium', action: () => setCurrentSection('ai-threat') },
        ],
      },
      {
        title: 'Trigger Methods',
        items: [
          { icon: Zap, label: 'SOS Triggers', value: 'Configure', action: () => setCurrentSection('triggers') },
        ],
      },
      {
        title: 'SOS Response',
        items: [
          { icon: Bell, label: 'Alert Actions', value: 'Configure', action: () => setCurrentSection('sos-response') },
          { icon: MapPin, label: 'Location Settings', value: 'Configure', action: () => setCurrentSection('location') },
        ],
      },
      {
        title: 'Appearance',
        items: [
          { icon: Calculator, label: 'Disguise Mode', value: disguiseMode, action: () => setCurrentSection('disguise') },
          { icon: Bell, label: 'Notifications', value: 'Configure', action: () => setCurrentSection('notifications') },
        ],
      },
      {
        title: 'System',
        items: [
          { icon: BarChart3, label: 'Admin Dashboard', value: 'Analytics', action: () => setAdminDialogOpen(true) },
          { icon: Battery, label: 'Battery & Performance', action: () => setCurrentSection('battery') },
          { icon: Cloud, label: 'Privacy & Data', action: () => setCurrentSection('privacy') },
          { icon: Settings2, label: 'Advanced', action: () => setCurrentSection('advanced') },
        ],
      },
      {
        title: 'Help',
        items: [
          { icon: HelpCircle, label: 'Tutorials & FAQs', action: () => setCurrentSection('about') },
          { icon: Info, label: 'About', value: 'v1.0.0', action: () => setCurrentSection('about') },
        ],
      },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Settings')}

        <main className="flex-1 overflow-auto pb-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mt-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-5">
                {section.title}
              </h2>
              <Card className="mx-4">
                <CardContent className="p-0 divide-y divide-border">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.value && (
                            <span className="text-sm text-muted-foreground capitalize">{item.value}</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Logout */}
          <div className="mt-6 px-4 pb-20">
            <Button 
              variant="outline" 
              className="w-full text-emergency hover:text-emergency hover:bg-emergency/10"
              onClick={() => {
                logout();
                toast({ title: 'Logged out', description: 'You have been logged out safely.' });
              }}
            >
              Exit to Disguise
            </Button>
          </div>
        </main>
        
        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change {passwordType === 'normal' ? 'Normal' : 'Distress'} Password</DialogTitle>
              <DialogDescription>
                {passwordType === 'distress' 
                  ? 'This password triggers a silent SOS when used to log in.'
                  : 'This password gives you normal access to the app.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <Input 
                  type="password" 
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-1"
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">New Password</label>
                <Input 
                  type="password" 
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <Input 
                  type="password" 
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-1"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleChangePassword} data-testid="button-save-password">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Admin Access Dialog */}
        <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Access</DialogTitle>
              <DialogDescription>
                Enter your password to access the admin dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                type="password" 
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
                data-testid="input-admin-password"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdminAccess} data-testid="button-admin-access">Access Dashboard</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <BottomNav activeTab="settings" />
      </div>
    );
  }

  // Account Settings
  if (currentSection === 'account') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Profile & Medical Info')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {displayName ? displayName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{displayName || 'Set your name'}</p>
                  <p className="text-sm text-muted-foreground">{email || 'No email set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem 
                icon={User} 
                label="Name" 
                value={displayName || 'Set name'} 
                onClick={() => handleOpenProfileDialog('displayName')} 
              />
              <SettingsItem 
                icon={Heart} 
                label="Blood Type" 
                value={bloodType || 'Not set'} 
                onClick={() => handleOpenProfileDialog('bloodType')} 
              />
              <SettingsItem 
                icon={AlertTriangle} 
                label="Allergies" 
                value={allergies || 'None'} 
                onClick={() => handleOpenProfileDialog('allergies')} 
              />
              <SettingsItem 
                icon={FileText} 
                label="Medications" 
                value={medications || 'None'} 
                onClick={() => handleOpenProfileDialog('medications')} 
              />
              <SettingsItem 
                icon={MessageSquare} 
                label="Custom Emergency Message" 
                value={emergencyMessage ? 'Configured' : 'Not set'} 
                onClick={() => handleOpenProfileDialog('emergencyMessage')} 
              />
            </CardContent>
          </Card>
        </main>
        
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {getProfileFieldLabel()}</DialogTitle>
              <DialogDescription>
                {profileEditField === 'emergencyMessage' 
                  ? 'This message will be sent to your emergency contacts during an SOS.'
                  : `Update your ${getProfileFieldLabel()?.toLowerCase()}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {profileEditField === 'emergencyMessage' ? (
                <textarea
                  value={profileEditValue}
                  onChange={(e) => setProfileEditValue(e.target.value)}
                  placeholder={`Enter your ${getProfileFieldLabel()?.toLowerCase()}`}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="input-profile-message"
                />
              ) : (
                <Input
                  value={profileEditValue}
                  onChange={(e) => setProfileEditValue(e.target.value)}
                  placeholder={profileEditField === 'bloodType' ? 'e.g., A+, B-, O+, AB+' : `Enter your ${getProfileFieldLabel()?.toLowerCase()}`}
                  data-testid="input-profile-field"
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} data-testid="button-save-profile">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Password Settings
  if (currentSection === 'passwords') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Password & Biometrics')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Password Security</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem 
                icon={Lock} 
                label="Change Normal Password" 
                value="Access app safely"
                onClick={() => handleOpenPasswordDialog('normal')} 
              />
              <SettingsItem 
                icon={Shield} 
                label="Change Distress Password" 
                value="Triggers silent SOS"
                onClick={() => handleOpenPasswordDialog('distress')} 
              />
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Biometric Authentication</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem 
                icon={Fingerprint} 
                label="Fingerprint Unlock" 
                toggle={biometricSettings.fingerprint} 
                onToggle={(v) => {
                  setBiometricSettings(s => ({...s, fingerprint: v}));
                  if (v) {
                    toast({ title: 'Fingerprint Enabled', description: 'You can now unlock with your fingerprint' });
                  }
                }} 
              />
              <SettingsItem 
                icon={Eye} 
                label="Face Unlock" 
                toggle={biometricSettings.faceUnlock} 
                onToggle={(v) => {
                  setBiometricSettings(s => ({...s, faceUnlock: v}));
                  if (v) {
                    toast({ title: 'Face Unlock Enabled', description: 'You can now unlock with face recognition' });
                  }
                }} 
              />
              <SettingsItem 
                icon={Fingerprint} 
                label="Biometric for Distress" 
                value="Trigger SOS with pattern"
                toggle={biometricSettings.biometricDistress} 
                onToggle={(v) => {
                  setBiometricSettings(s => ({...s, biometricDistress: v}));
                  if (v) {
                    toast({ title: 'Distress Pattern Set', description: 'Use wrong fingerprint 3x to trigger silent SOS' });
                  }
                }} 
              />
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Security Settings</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem 
                icon={Timer} 
                label="Auto-lock Timer" 
                value={`${securitySettings.autoLockTimer} seconds`} 
                onClick={() => setAutoLockDialogOpen(true)} 
              />
              <SettingsItem 
                icon={Camera} 
                label="Capture Photo on Failed Attempts" 
                toggle={securitySettings.captureOnFail} 
                onToggle={(v) => {
                  setSecuritySettings(s => ({...s, captureOnFail: v}));
                  if (v) {
                    toast({ title: 'Intruder Detection Enabled', description: 'Photos will be taken on failed login attempts' });
                  }
                }} 
              />
              <SettingsItem 
                icon={Lock} 
                label="Max Failed Attempts" 
                value={`${securitySettings.maxFailedAttempts} attempts`} 
                onClick={() => {}} 
              />
              <SettingsItem 
                icon={AlertTriangle} 
                label="Lockout Duration" 
                value={`${securitySettings.lockoutDuration} minutes`} 
                onClick={() => {}} 
              />
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1">
            Biometric authentication provides quick access while maintaining security. The distress pattern allows triggering emergency mode discreetly.
          </p>
        </main>

        {/* Auto-lock Timer Dialog */}
        <Dialog open={autoLockDialogOpen} onOpenChange={setAutoLockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Auto-lock Timer</DialogTitle>
              <DialogDescription>
                Choose how long until the app automatically locks.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              {[15, 30, 60, 120, 300].map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => {
                    setSecuritySettings(s => ({...s, autoLockTimer: seconds}));
                    setAutoLockDialogOpen(false);
                    toast({ title: 'Timer Updated', description: `Auto-lock set to ${seconds} seconds` });
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${
                    securitySettings.autoLockTimer === seconds 
                      ? 'bg-primary/10 border-2 border-primary text-primary' 
                      : 'bg-secondary/50 text-foreground hover:bg-accent'
                  }`}
                  data-testid={`button-autolock-${seconds}`}
                >
                  {seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minute${seconds > 60 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change {passwordType === 'normal' ? 'Normal' : 'Distress'} Password</DialogTitle>
              <DialogDescription>
                {passwordType === 'distress' 
                  ? 'This password triggers a silent SOS when used to log in.'
                  : 'This password gives you normal access to the app.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <Input 
                  type="password" 
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">New Password</label>
                <Input 
                  type="password" 
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <Input 
                  type="password" 
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleChangePassword}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Contacts Settings
  if (currentSection === 'contacts') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Emergency Contacts')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          {emergencyContacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    contact.priority === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {contact.priority}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full">
            <Users className="w-4 h-4 mr-2" />
            Add Contact
          </Button>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Bell} label="Send Test Alert" value="Verify contacts" onClick={() => {
                toast({ title: 'Test alert sent', description: 'Your contacts will receive a test notification.' });
              }} />
              <SettingsItem icon={Phone} label="Verify Phone Numbers" onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // AI Voice Settings
  if (currentSection === 'ai-voice') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Voice Keywords')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                The app listens for these keywords to trigger an alert:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Help', 'Emergency', 'SOS', 'Call 911'].map((keyword) => (
                  <span key={keyword} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    "{keyword}"
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Mic} label="Add Custom Keyword" onClick={() => {}} />
              <SettingsItem icon={RefreshCw} label="Re-train Voice Model" onClick={() => {}} />
              <SettingsItem icon={Play} label="Test Keyword Detection" onClick={() => {
                toast({ title: 'Listening...', description: 'Say one of your keywords now.' });
              }} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">Sensitivity</span>
                <span className="text-sm text-primary">Medium</span>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div className="h-full w-1/2 bg-primary rounded-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // AI Gesture Settings
  if (currentSection === 'ai-gesture') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Gesture Recognition')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Recognized gestures that trigger alerts:
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Triple tap back of phone', enabled: true },
                  { name: 'Three-finger swipe', enabled: true },
                  { name: 'Power button 5x', enabled: false },
                ].map((gesture) => (
                  <div key={gesture.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <span className="text-sm text-foreground">{gesture.name}</span>
                    <Switch checked={gesture.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Hand} label="Add Custom Gesture" onClick={() => {}} />
              <SettingsItem icon={RefreshCw} label="Calibrate Detection" onClick={() => {}} />
              <SettingsItem icon={Play} label="Test Gestures" onClick={() => {
                toast({ title: 'Ready', description: 'Perform a gesture now.' });
              }} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // AI Threat Analysis
  if (currentSection === 'ai-threat') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Threat Analysis')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-foreground">Sensitivity Level</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map((level) => (
                  <button
                    key={level}
                    className={`py-3 rounded-xl font-medium transition-colors ${
                      level === 'Medium' 
                        ? 'bg-primary text-white' 
                        : 'bg-secondary text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Zap} label="False Alarm Learning" toggle={true} onToggle={() => {}} />
              <SettingsItem icon={FileText} label="View AI Performance Stats" onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Trigger Methods
  if (currentSection === 'triggers') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('SOS Triggers')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Mic} label="Voice Keywords" toggle={features.voiceDetection} onToggle={() => toggleFeature('voiceDetection')} />
              <SettingsItem icon={Hand} label="Gestures" toggle={features.gestureRecognition} onToggle={() => toggleFeature('gestureRecognition')} />
              <SettingsItem icon={Lock} label="Touch Patterns" toggle={true} onToggle={() => {}} />
              <SettingsItem icon={Volume2} label="Volume Buttons" toggle={true} onToggle={() => {}} />
              <SettingsItem icon={Smartphone} label="Power Button" toggle={false} onToggle={() => {}} />
              <SettingsItem icon={Vibrate} label="Shake Detection" toggle={false} onToggle={() => {}} />
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1">
            Tap on each trigger to customize its activation sequence.
          </p>
        </main>
      </div>
    );
  }

  // SOS Response Settings
  if (currentSection === 'sos-response') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Alert Actions')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Messaging</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={MessageSquare} label="Send SMS" toggle={sosSettings.sendSms} onToggle={(v) => setSosSettings(s => ({...s, sendSms: v}))} />
              <SettingsItem icon={Phone} label="Make Call" toggle={sosSettings.makeCall} onToggle={(v) => setSosSettings(s => ({...s, makeCall: v}))} />
              <SettingsItem icon={MessageSquare} label="Send WhatsApp" toggle={sosSettings.sendWhatsapp} onToggle={(v) => setSosSettings(s => ({...s, sendWhatsapp: v}))} />
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Recording</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Mic} label="Record Audio" toggle={sosSettings.recordAudio} onToggle={(v) => setSosSettings(s => ({...s, recordAudio: v}))} />
              {sosSettings.recordAudio && (
                <SettingsItem icon={Clock} label="Audio Duration" value={`${sosSettings.audioDuration} min`} onClick={() => {}} />
              )}
              <SettingsItem icon={Camera} label="Capture Photos" toggle={sosSettings.capturePhotos} onToggle={(v) => setSosSettings(s => ({...s, capturePhotos: v}))} />
              {sosSettings.capturePhotos && (
                <SettingsItem icon={Timer} label="Photo Interval" value={`${sosSettings.photoInterval} sec`} onClick={() => {}} />
              )}
              <SettingsItem icon={Video} label="Record Video" toggle={sosSettings.recordVideo} onToggle={(v) => setSosSettings(s => ({...s, recordVideo: v}))} />
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Location</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={MapPin} label="Share Live Location" toggle={sosSettings.shareLocation} onToggle={(v) => setSosSettings(s => ({...s, shareLocation: v}))} />
              <SettingsItem icon={Clock} label="Tracking Duration" value="Until stopped" onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Location Settings
  if (currentSection === 'location') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Location Settings')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={RefreshCw} label="Update Frequency" value={`${locationSettings.updateFrequency}s`} onClick={() => {}} />
              <SettingsItem icon={MapPin} label="Display Format" value={locationSettings.displayFormat} onClick={() => {}} />
              <SettingsItem icon={Battery} label="Battery Saver Mode" toggle={locationSettings.batterySaver} onToggle={(v) => setLocationSettings(s => ({...s, batterySaver: v}))} />
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1">
            Battery saver mode reduces location accuracy and update frequency to extend battery life.
          </p>
        </main>
      </div>
    );
  }

  // Disguise Settings
  if (currentSection === 'disguise') {
    const disguiseOptions: { type: DisguiseMode; name: string; icon: any; description: string }[] = [
      { type: 'calculator', name: 'Calculator', icon: Calculator, description: 'Appears as a basic calculator app' },
      { type: 'notes', name: 'Notes', icon: FileText, description: 'Appears as a note-taking app' },
      { type: 'weather', name: 'Weather', icon: Cloud, description: 'Appears as a weather forecast app' },
    ];

    const iconOptions = [
      { id: 'default', name: 'Default', color: 'bg-primary' },
      { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
      { id: 'green', name: 'Green', color: 'bg-green-500' },
      { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
      { id: 'purple', name: 'Purple', color: 'bg-purple-500' },
      { id: 'red', name: 'Red', color: 'bg-red-500' },
    ];

    const getAppNameForMode = (mode: DisguiseMode) => {
      if (disguiseCustomization.appName !== 'Calculator' && disguiseCustomization.appName !== 'Notes' && disguiseCustomization.appName !== 'Weather') {
        return disguiseCustomization.appName;
      }
      switch (mode) {
        case 'calculator': return 'Calculator';
        case 'notes': return 'Notes';
        case 'weather': return 'Weather';
      }
    };

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Disguise Mode')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">App Appearance</h3>
          <Card>
            <CardContent className="p-4 space-y-3">
              {disguiseOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = disguiseMode === option.type;
                return (
                  <button
                    key={option.type}
                    onClick={() => {
                      setDisguiseMode(option.type);
                      setDisguiseCustomization(s => ({...s, appName: option.name}));
                      toast({ title: 'Disguise Changed', description: `App now appears as ${option.name}` });
                    }}
                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-secondary/50 border-2 border-transparent'
                    }`}
                    data-testid={`button-disguise-${option.type}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary' : 'bg-muted'}`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className={`font-medium block ${isSelected ? 'text-primary' : 'text-foreground'}`}>{option.name}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Customization</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem 
                icon={Palette} 
                label="App Icon Style" 
                value={iconOptions.find(i => i.id === disguiseCustomization.appIcon)?.name || 'Default'}
                onClick={() => setAppIconDialogOpen(true)} 
              />
              <SettingsItem 
                icon={Type} 
                label="Custom App Name" 
                value={getAppNameForMode(disguiseMode)}
                onClick={() => {
                  setCustomAppName(getAppNameForMode(disguiseMode));
                  setAppNameDialogOpen(true);
                }} 
              />
              <SettingsItem 
                icon={FileText} 
                label="Manage Fake Data" 
                value="Configure dummy content"
                onClick={() => toast({ title: 'Coming Soon', description: 'Fake data management will be available in a future update' })} 
              />
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Preview</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  iconOptions.find(i => i.id === disguiseCustomization.appIcon)?.color || 'bg-primary'
                }`}>
                  {disguiseMode === 'calculator' && <Calculator className="w-8 h-8 text-white" />}
                  {disguiseMode === 'notes' && <FileText className="w-8 h-8 text-white" />}
                  {disguiseMode === 'weather' && <Cloud className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{getAppNameForMode(disguiseMode)}</p>
                  <p className="text-xs text-muted-foreground">This is how your app will appear</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1">
            The disguise mode helps keep your safety app hidden. The app will function normally as the selected utility until you enter your secret password.
          </p>
        </main>

        {/* App Icon Dialog */}
        <Dialog open={appIconDialogOpen} onOpenChange={setAppIconDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose App Icon Style</DialogTitle>
              <DialogDescription>
                Select a color theme for your app icon.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 grid grid-cols-3 gap-3">
              {iconOptions.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => {
                    setDisguiseCustomization(s => ({...s, appIcon: icon.id}));
                    setAppIconDialogOpen(false);
                    toast({ title: 'Icon Updated', description: `App icon changed to ${icon.name}` });
                  }}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-colors ${
                    disguiseCustomization.appIcon === icon.id 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'bg-secondary/50 border-2 border-transparent hover:bg-accent'
                  }`}
                  data-testid={`button-icon-${icon.id}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${icon.color} flex items-center justify-center`}>
                    {disguiseMode === 'calculator' && <Calculator className="w-6 h-6 text-white" />}
                    {disguiseMode === 'notes' && <FileText className="w-6 h-6 text-white" />}
                    {disguiseMode === 'weather' && <Cloud className="w-6 h-6 text-white" />}
                  </div>
                  <span className="text-xs font-medium text-foreground">{icon.name}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* App Name Dialog */}
        <Dialog open={appNameDialogOpen} onOpenChange={setAppNameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Custom App Name</DialogTitle>
              <DialogDescription>
                Enter a custom name for your app that will appear on the home screen.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={customAppName}
                onChange={(e) => setCustomAppName(e.target.value)}
                placeholder="Enter app name"
                maxLength={20}
                data-testid="input-custom-app-name"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {customAppName.length}/20 characters
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAppNameDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (customAppName.trim()) {
                    setDisguiseCustomization(s => ({...s, appName: customAppName.trim()}));
                    setAppNameDialogOpen(false);
                    toast({ title: 'Name Updated', description: `App name changed to "${customAppName.trim()}"` });
                  }
                }}
                data-testid="button-save-app-name"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Notifications Settings
  if (currentSection === 'notifications') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Notifications')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Bell} label="Silent Notifications" toggle={true} onToggle={() => {}} />
              <SettingsItem icon={Vibrate} label="Vibration" toggle={true} onToggle={() => {}} />
              <SettingsItem icon={Play} label="Test Notification" onClick={() => {
                toast({ title: 'Test notification', description: 'This is how notifications will appear.' });
              }} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Battery Settings
  if (currentSection === 'battery') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Battery & Performance')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Battery Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location tracking</span>
                  <span className="text-foreground">~5%/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voice detection</span>
                  <span className="text-foreground">~3%/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Background service</span>
                  <span className="text-foreground">~2%/day</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Zap} label="Doze Mode Exemption" value="Enabled" onClick={() => {}} />
              <SettingsItem icon={RefreshCw} label="Background Service" value="Running" onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Privacy Settings
  if (currentSection === 'privacy') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Privacy & Data')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Eye} label="View Stored Data" onClick={() => {}} />
              <SettingsItem icon={Cloud} label="Cloud Backup" toggle={privacySettings.cloudBackup} onToggle={(v) => setPrivacySettings(s => ({...s, cloudBackup: v}))} />
              <SettingsItem icon={Clock} label="Auto-delete Old Alerts" value={privacySettings.autoDelete} onClick={() => {}} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Download} label="Export All Data" onClick={() => {}} />
              <SettingsItem icon={Trash2} label="Delete All Data" destructive onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Advanced Settings
  if (currentSection === 'advanced') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('Advanced')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Settings2} label="Developer Mode" toggle={false} onToggle={() => {}} />
              <SettingsItem icon={Play} label="Test All Features" onClick={() => {
                toast({ title: 'System Test', description: 'Running comprehensive system test...' });
              }} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={RefreshCw} label="Reset App (Keep Data)" onClick={() => {}} />
              <SettingsItem icon={Trash2} label="Factory Reset" destructive onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // About
  if (currentSection === 'about') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader('About & Help')}
        <main className="flex-1 p-4 space-y-4 overflow-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Guardian SOS</h2>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <SettingsItem icon={Play} label="Tutorial Videos" onClick={() => {}} />
              <SettingsItem icon={HelpCircle} label="FAQs" onClick={() => {}} />
              <SettingsItem icon={Mail} label="Contact Support" onClick={() => {}} />
              <SettingsItem icon={FileText} label="Legal Information" onClick={() => {}} />
              <SettingsItem icon={Download} label="Export Diagnostic Logs" onClick={() => {}} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return null;
}
