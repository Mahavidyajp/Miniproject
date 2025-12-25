import { useState } from 'react';
import { Shield, ChevronRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/appContext';

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
];

export function WelcomeScreen() {
  const { setScreen } = useApp();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguages, setShowLanguages] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg glow-safe">
            <Shield className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2 animate-slide-up text-center">
          Welcome to SafeCalc
        </h1>
        <p className="text-muted-foreground text-center mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Your everyday utility app
        </p>

        {/* Language selector */}
        <div className="w-full mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowLanguages(!showLanguages)}
            className="w-full glass-card p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">
                {languages.find(l => l.code === selectedLanguage)?.native}
              </span>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showLanguages ? 'rotate-90' : ''}`} />
          </button>
          
          {showLanguages && (
            <div className="mt-2 glass-card overflow-hidden animate-scale-in">
              <div className="max-h-48 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setShowLanguages(false);
                    }}
                    className={`w-full p-3 text-left hover:bg-accent/50 transition-colors flex items-center justify-between ${
                      selectedLanguage === lang.code ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-sm text-muted-foreground">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Features preview */}
        <div className="w-full space-y-3 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { title: 'Quick Calculations', desc: 'Fast and accurate' },
            { title: 'History Tracking', desc: 'Never lose your work' },
            { title: 'Scientific Mode', desc: 'Advanced functions' },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue button */}
        <Button 
          onClick={() => setScreen('disguise-selection')}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          Get Started
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
