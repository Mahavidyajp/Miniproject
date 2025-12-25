import { useState } from 'react';
import { Zap, Calculator, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/lib/appContext';

export function QuickExitMenu() {
  const { logout, triggerSOS, disguiseMode } = useApp();
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);

  const disguiseLabels: Record<string, string> = {
    calculator: 'Calculator',
    notes: 'Notes',
    weather: 'Weather',
  };

  const handlePanicExit = () => {
    triggerSOS(true);
    logout();
    setShowPanicConfirm(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-quick-exit">
            <Zap className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={logout} className="gap-3 cursor-pointer" data-testid="menu-exit-disguise">
            <Calculator className="w-4 h-4" />
            <div>
              <p className="font-medium">Exit to {disguiseLabels[disguiseMode]}</p>
              <p className="text-xs text-muted-foreground">Return to disguised app</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={logout} className="gap-3 cursor-pointer" data-testid="menu-lock-app">
            <Lock className="w-4 h-4" />
            <div>
              <p className="font-medium">Lock App</p>
              <p className="text-xs text-muted-foreground">Lock and require password</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowPanicConfirm(true)} 
            className="gap-3 cursor-pointer text-destructive focus:text-destructive"
            data-testid="menu-panic-exit"
          >
            <AlertTriangle className="w-4 h-4" />
            <div>
              <p className="font-medium">Panic Exit</p>
              <p className="text-xs opacity-70">Exit AND trigger silent SOS</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showPanicConfirm} onOpenChange={setShowPanicConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Panic Exit?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will exit to the disguised app AND send a silent emergency alert to your contacts. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePanicExit} className="bg-destructive hover:bg-destructive/90">
              Confirm Panic Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
