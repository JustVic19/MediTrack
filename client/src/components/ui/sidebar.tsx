import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UserRound, 
  Calendar, 
  History, 
  Bell, 
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: UserRound },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Patient History', href: '/patient-history', icon: History },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-background border-r border-border">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center justify-between flex-shrink-0 px-4 mb-5">
          <div className="flex items-center">
            <Logo size={32} className="mr-2" />
            <h1 className="text-2xl font-bold text-primary">MediTrack</h1>
          </div>
          <div className="bg-card p-1 rounded-md shadow-sm border border-border">
            <ThemeToggle />
          </div>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
              
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon 
                  className={cn(
                    "mr-3 flex-shrink-0 h-6 w-6",
                    isActive 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <img 
                  className="inline-block h-9 w-9 rounded-full" 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                  alt="Profile" 
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {user?.fullName || 'Doctor'}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {user?.role || 'Doctor'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
