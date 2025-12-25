import { Shield, History, Settings, HelpCircle, Map } from 'lucide-react';
import { useApp, AppScreen } from '@/lib/appContext';

interface BottomNavProps {
  activeTab?: 'home' | 'map' | 'history' | 'settings' | 'help';
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const { setScreen } = useApp();

  const navItems: { icon: typeof Shield; label: string; tab: typeof activeTab; screen: AppScreen }[] = [
    { icon: Shield, label: 'Home', tab: 'home', screen: 'dashboard' },
    { icon: Map, label: 'Safe Map', tab: 'map', screen: 'safe-map' },
    { icon: History, label: 'History', tab: 'history', screen: 'history' },
    { icon: Settings, label: 'Settings', tab: 'settings', screen: 'settings' },
    { icon: HelpCircle, label: 'Help', tab: 'help', screen: 'help' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around z-50" data-testid="nav-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setScreen(item.screen)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`nav-${item.tab}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
