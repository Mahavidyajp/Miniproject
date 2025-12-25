import { useState } from 'react';
import { Shield, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createAccount, loginUser } from '@/lib/firebase';

interface AuthScreenProps {
  onAuthSuccess: (userId: string) => void;
  onAdminClick?: () => void;
}

export const AuthScreen = ({ onAuthSuccess, onAdminClick }: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await loginUser(email, password);
    setIsLoading(false);

    if (result.error) {
      toast({ title: 'Login Failed', description: result.error, variant: 'destructive' });
    } else if (result.user) {
      toast({ title: 'Welcome back!', description: 'Successfully logged in' });
      onAuthSuccess(result.user.uid);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await createAccount(email, password, displayName);
    setIsLoading(false);

    if (result.error) {
      toast({ title: 'Sign Up Failed', description: result.error, variant: 'destructive' });
    } else if (result.user) {
      toast({ title: 'Account Created!', description: 'Welcome to SafeCalc' });
      onAuthSuccess(result.user.uid);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SafeCalc</h1>
          <p className="text-muted-foreground mt-1">Your personal safety companion</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2 mb-6">
              <Button
                variant={mode === 'login' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setMode('login')}
                data-testid="button-login-tab"
              >
                Log In
              </Button>
              <Button
                variant={mode === 'signup' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setMode('signup')}
                data-testid="button-signup-tab"
              >
                Sign Up
              </Button>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    data-testid="input-display-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4"
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={isLoading}
              data-testid="button-auth-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {mode === 'login' && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline"
                  data-testid="link-switch-to-signup"
                >
                  Sign up
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline"
                  data-testid="link-switch-to-login"
                >
                  Log in
                </button>
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>

        {onAdminClick && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-6 text-muted-foreground"
            onClick={onAdminClick}
            data-testid="button-admin-dashboard"
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};
