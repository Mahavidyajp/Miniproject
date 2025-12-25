import { Shield, Check, Calculator, Users, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/appContext';

export function SetupCompleteScreen() {
  const { completeSetup, disguiseMode, emergencyContacts } = useApp();

  const summaryItems = [
    {
      icon: Calculator,
      label: 'Disguise Mode',
      value: disguiseMode.charAt(0).toUpperCase() + disguiseMode.slice(1),
      status: 'complete',
    },
    {
      icon: Lock,
      label: 'Dual PIN System',
      value: 'Normal + Distress',
      status: 'complete',
    },
    {
      icon: Users,
      label: 'Emergency Contacts',
      value: `${emergencyContacts.length} contact${emergencyContacts.length > 1 ? 's' : ''} added`,
      status: 'complete',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex-1 flex flex-col items-center max-w-md mx-auto w-full">
        {/* Success animation */}
        <div className="my-12 animate-scale-in">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center glow-safe">
              <Shield className="w-14 h-14 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-safe flex items-center justify-center shadow-lg">
              <Check className="w-6 h-6 text-safe-foreground" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center animate-slide-up">
          Setup Complete!
        </h1>
        <p className="text-muted-foreground text-center mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Your protection is now active
        </p>

        {/* Summary */}
        <div className="w-full space-y-3 mb-8">
          {summaryItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div 
                key={i}
                className="glass-card p-4 flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground">{item.value}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-safe/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-safe" />
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="w-full glass-card p-5 mb-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Quick Access</h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">1</span>
              <span className="text-muted-foreground">
                Open the calculator and enter your <span className="text-foreground font-medium">normal PIN</span> followed by <span className="text-foreground font-medium">=</span> to access dashboard
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-alert font-bold">2</span>
              <span className="text-muted-foreground">
                Enter <span className="text-foreground font-medium">distress PIN</span> followed by <span className="text-foreground font-medium">=</span> for silent protection
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emergency font-bold">3</span>
              <span className="text-muted-foreground">
                Enter <span className="text-foreground font-medium">911 × 911 =</span> for instant SOS
              </span>
            </li>
          </ul>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Activate button */}
        <Button 
          onClick={completeSetup}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground animate-slide-up glow-safe"
          style={{ animationDelay: '0.6s' }}
        >
          <Shield className="w-5 h-5 mr-2" />
          Activate Protection
        </Button>
      </div>
    </div>
  );
}
