import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  UserRound, 
  Calendar, 
  FileText, 
  Mail,
  Pill,
  ClipboardList,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";

export function PatientSidebar() {
  const [location, navigate] = useLocation();
  const { patient, logoutMutation } = usePatientAuth();
  
  // Parse the current URL to extract the active tab
  const getCurrentTab = () => {
    const url = new URL(window.location.href);
    return url.searchParams.get('tab') || '';
  };
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Redirect to login page after successful logout
        navigate('/patient-login');
      }
    });
  };

  // Manual navigation function to handle query parameters correctly
  const navigateToTab = (tab: string) => {
    if (tab === 'overview') {
      navigate('/patient-portal');
    } else {
      navigate(`/patient-portal?tab=${tab}`);
    }
  };

  const navigation = [
    { name: 'Overview', tab: 'overview', icon: Home },
    { name: 'Appointments', tab: 'appointments', icon: Calendar },
    { name: 'Medical Records', tab: 'records', icon: FileText },
    { name: 'Messages', tab: 'messages', icon: Mail },
    { name: 'Prescriptions', tab: 'prescriptions', icon: Pill },
    { name: 'Questionnaires', tab: 'questionnaires', icon: ClipboardList },
    { name: 'My Profile', tab: 'profile', icon: UserRound },
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
            // Get the current tab from the URL
            const currentTab = getCurrentTab();
            // Check if this item is active
            const isActive = (item.tab === 'overview' && !currentTab) || currentTab === item.tab;
              
            return (
              <Button 
                key={item.name}
                variant="ghost"
                onClick={() => navigateToTab(item.tab)}
                className={cn(
                  "w-full justify-start text-sm font-medium rounded-md",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" 
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
              </Button>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="p-0 h-auto flex items-center hover:opacity-80 transition-opacity"
              onClick={() => navigateToTab('profile')}
            >
              <div>
                <img 
                  className="inline-block h-9 w-9 rounded-full border-2 border-primary/20" 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.firstName || 'Patient')}+${encodeURIComponent(patient?.lastName || '')}&background=random`}
                  alt="Profile" 
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {patient?.firstName} {patient?.lastName}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Patient ID: {patient?.patientId}
                </p>
              </div>
            </Button>
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