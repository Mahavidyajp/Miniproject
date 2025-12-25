import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loginUser, getUserData, logoutUser } from '@/lib/firebase';

interface AdminAuthScreenProps {
  onAdminAuthSuccess: (userId: string) => void;
  onBackClick: () => void;
}

export const AdminAuthScreen = ({ onAdminAuthSuccess, onBackClick }: AdminAuthScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await loginUser(email, password);
      
      if (result.error) {
        toast({ title: 'Login Failed', description: result.error, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      
      if (!result.user) {
        toast({ title: 'Login Failed', description: 'Authentication failed', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const userData = await getUserData(result.user.uid);
      
      if (!userData?.isAdmin) {
        await logoutUser();
        toast({ 
          title: 'Access Denied', 
          description: 'You do not have admin privileges. Contact your administrator.', 
          variant: 'destructive' 
        });
        setIsLoading(false);
        return;
      }

      toast({ title: 'Welcome Admin!', description: 'Successfully logged in to admin dashboard' });
      onAdminAuthSuccess(result.user.uid);
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({ 
        title: 'Login Failed', 
        description: error?.message || 'An error occurred during login', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-destructive/20 border-2 border-destructive flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Authorized personnel only</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="input-admin-password"
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

            <Button
              className="w-full mt-4"
              onClick={handleAdminLogin}
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Access Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={onBackClick}
              data-testid="button-back-to-user-login"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to User Login
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          This area is restricted to authorized administrators only.
          Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
};
