import { Calculator, FileText, Cloud, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, DisguiseMode } from '@/lib/appContext';

const disguiseOptions: {
  type: DisguiseMode;
  name: string;
  icon: React.ElementType;
  description: string;
  bestFor: string;
}[] = [
  {
    type: 'calculator',
    name: 'Calculator',
    icon: Calculator,
    description: 'Standard calculator with scientific mode',
    bestFor: 'Most common, least suspicious',
  },
  {
    type: 'notes',
    name: 'Notes',
    icon: FileText,
    description: 'Simple note-taking app',
    bestFor: 'Professionals and students',
  },
  {
    type: 'weather',
    name: 'Weather',
    icon: Cloud,
    description: 'Weather forecasts and updates',
    bestFor: 'Frequent checking scenarios',
  },
];

export function DisguiseSelectionScreen() {
  const { disguiseMode, setDisguiseMode, setScreen } = useApp();

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-sm text-primary font-medium mb-2">Step 1 of 5</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Choose Your App Style
          </h1>
          <p className="text-muted-foreground">
            Select how the app will appear on your home screen
          </p>
        </div>

        {/* Disguise options */}
        <div className="space-y-4 mb-8 flex-1">
          {disguiseOptions.map((option, i) => {
            const Icon = option.icon;
            const isSelected = disguiseMode === option.type;
            
            return (
              <button
                key={option.type}
                onClick={() => setDisguiseMode(option.type)}
                className={`w-full glass-card p-5 text-left transition-all duration-300 animate-slide-up ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-accent/50'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-foreground'
                  }`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {option.name}
                      </h3>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {option.description}
                    </p>
                    <span className="inline-block px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {option.bestFor}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info card */}
        <div className="glass-card p-4 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-muted-foreground">
            💡 <span className="text-foreground font-medium">Tip:</span> You can change this anytime in settings. The app will function normally while keeping you protected.
          </p>
        </div>

        {/* Continue button */}
        <Button 
          onClick={() => setScreen('permissions-setup')}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
