import { useState } from 'react';
import { Eye, EyeOff, ChevronRight, AlertTriangle, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/appContext';

export function PasswordSetupScreen() {
  const { setupPasswords, setScreen } = useApp();
  const [normalPassword, setNormalPassword] = useState('');
  const [confirmNormal, setConfirmNormal] = useState('');
  const [distressPassword, setDistressPassword] = useState('');
  const [confirmDistress, setConfirmDistress] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [step, setStep] = useState<'normal' | 'distress'>('normal');

  const normalMatch = normalPassword === confirmNormal && normalPassword.length >= 4;
  const distressMatch = distressPassword === confirmDistress && distressPassword.length >= 4;
  const passwordsDifferent = normalPassword !== distressPassword;

  const handleContinue = () => {
    if (step === 'normal' && normalMatch) {
      setStep('distress');
    } else if (step === 'distress' && distressMatch && passwordsDifferent) {
      setupPasswords(normalPassword, distressPassword);
      setScreen('contacts-setup');
    }
  };

  const renderPinInput = (
    value: string, 
    onChange: (v: string) => void, 
    placeholder: string
  ) => (
    <div className="relative">
      <input
        type={showPasswords ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder={placeholder}
        className="w-full h-14 bg-secondary/50 border border-border rounded-xl px-4 text-center text-2xl tracking-[0.5em] font-mono text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-primary"
        inputMode="numeric"
      />
      <button
        type="button"
        onClick={() => setShowPasswords(!showPasswords)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-sm text-primary font-medium mb-2">Step 2 of 4</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {step === 'normal' ? 'Create Access PIN' : 'Create Distress PIN'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'normal' 
              ? 'This PIN opens your full dashboard' 
              : 'This PIN silently triggers protection while showing normal app'
            }
          </p>
        </div>

        {/* Info card */}
        <div className={`glass-card p-4 mb-6 animate-slide-up ${
          step === 'distress' ? 'border-alert/30' : ''
        }`}>
          <div className="flex gap-3">
            {step === 'normal' ? (
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-alert shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                {step === 'normal' ? 'Normal Access' : 'Distress Mode'}
              </p>
              <p className="text-sm text-muted-foreground">
                {step === 'normal' 
                  ? 'Use this PIN when you\'re safe and want to access your dashboard.'
                  : 'If forced to unlock, use this PIN. It shows the normal app while silently alerting your contacts.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* PIN inputs */}
        {step === 'normal' ? (
          <div className="space-y-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Enter 4-6 digit PIN
              </label>
              {renderPinInput(normalPassword, setNormalPassword, '• • • • • •')}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm PIN
              </label>
              {renderPinInput(confirmNormal, setConfirmNormal, '• • • • • •')}
              {confirmNormal && !normalMatch && (
                <p className="text-sm text-emergency mt-2">PINs don't match</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Enter 4-6 digit distress PIN
              </label>
              {renderPinInput(distressPassword, setDistressPassword, '• • • • • •')}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm distress PIN
              </label>
              {renderPinInput(confirmDistress, setConfirmDistress, '• • • • • •')}
              {confirmDistress && !distressMatch && (
                <p className="text-sm text-emergency mt-2">PINs don't match</p>
              )}
              {distressPassword && !passwordsDifferent && (
                <p className="text-sm text-alert mt-2">Must be different from normal PIN</p>
              )}
            </div>
          </div>
        )}

        {/* Password strength */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">PIN Strength</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((level) => {
              const currentPin = step === 'normal' ? normalPassword : distressPassword;
              const strength = currentPin.length >= 4 ? Math.min(4, Math.floor(currentPin.length / 1.5)) : 0;
              return (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    level <= strength 
                      ? strength >= 3 ? 'bg-safe' : strength >= 2 ? 'bg-alert' : 'bg-emergency'
                      : 'bg-secondary'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {step === 'normal' ? normalPassword.length : distressPassword.length}/6 digits
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Continue button */}
        <Button 
          onClick={handleContinue}
          disabled={step === 'normal' ? !normalMatch : !(distressMatch && passwordsDifferent)}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
