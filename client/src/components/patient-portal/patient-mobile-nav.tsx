import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Menu, 
  X, 
  Home, 
  UserRound, 
  Calendar, 
  FileText, 
  Mail,
  LogOut
} from "lucide-react";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PatientMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { patient } = usePatientAuth();
  
  return (
    <>
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Logo size={32} className="mr-2" />
          <h1 className="text-xl font-bold text-primary">Patient Portal</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-card p-1 rounded-md shadow-sm border border-border">
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {isOpen && <PatientMobileMenu patient={patient} setIsOpen={setIsOpen} />}
    </>
  );
}

function PatientMobileMenu({ patient, setIsOpen }: { 
  patient: any, 
  setIsOpen: (open: boolean) => void 
}) {
  const [location, navigate] = useLocation();
  const { logoutMutation } = usePatientAuth();
  
  // Parse the current URL to extract the active tab
  const getCurrentTab = () => {
    try {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get('tab') || '';
      console.log("PatientMobileMenu getCurrentTab:", tab);
      return tab;
    } catch (error) {
      console.error("Error getting current tab:", error);
      return '';
    }
  };
  
  // Manual navigation function to handle query parameters correctly
  const navigateToTab = (tab: string) => {
    console.log("PatientMobileMenu navigateToTab called with tab:", tab);
    setIsOpen(false);
    
    // Use window.location directly since wouter navigation might be causing issues
    if (tab === 'overview') {
      console.log("PatientMobileMenu: Redirecting to /patient-portal");
      window.location.href = '/patient-portal';
    } else {
      console.log(`PatientMobileMenu: Redirecting to /patient-portal?tab=${tab}`);
      window.location.href = `/patient-portal?tab=${tab}`;
    }
  };
  
  const navigation = [
    { name: 'Overview', tab: 'overview', icon: Home },
    { name: 'Appointments', tab: 'appointments', icon: Calendar },
    { name: 'Medical Records', tab: 'records', icon: FileText },
    { name: 'Messages', tab: 'messages', icon: Mail },
    { name: 'My Profile', tab: 'profile', icon: UserRound },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/patient-login');
      }
    });
    setIsOpen(false);
  };

  return (
    <div className="md:hidden absolute inset-x-0 top-14 z-40 bg-background border-b border-border shadow-lg">
      <div className="pt-2 pb-3 space-y-1">
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
                "w-full justify-start pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-none",
                isActive
                  ? "border-primary text-primary bg-primary/10"
                  : "border-transparent text-foreground hover:bg-secondary/50 hover:border-border hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              {item.name}
            </Button>
          );
        })}
      </div>
      <div className="pt-4 pb-3 border-t border-border">
        <div className="flex items-center px-4">
          <div className="flex-shrink-0">
            <img 
              className="h-10 w-10 rounded-full" 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.firstName || 'Patient')}+${encodeURIComponent(patient?.lastName || '')}&background=random`}
              alt="Profile" 
            />
          </div>
          <div className="ml-3 flex-1">
            <div className="text-base font-medium text-foreground">
              {patient?.firstName} {patient?.lastName}
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Patient ID: {patient?.patientId}
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
  );
}

export function PatientMobileBottomNav() {
  const [, navigate] = useLocation();
  
  // Parse the current URL to extract the active tab
  const getCurrentTab = () => {
    try {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get('tab') || '';
      console.log("PatientMobileNav getCurrentTab:", tab);
      return tab;
    } catch (error) {
      console.error("Error getting current tab:", error);
      return '';
    }
  };
  
  // Manual navigation function to handle query parameters correctly
  const navigateToTab = (tab: string) => {
    console.log("PatientMobileNav navigateToTab called with tab:", tab);
    
    // Use window.location directly since wouter navigation might be causing issues
    if (tab === 'overview') {
      console.log("PatientMobileNav: Redirecting to /patient-portal");
      window.location.href = '/patient-portal';
    } else {
      console.log(`PatientMobileNav: Redirecting to /patient-portal?tab=${tab}`);
      window.location.href = `/patient-portal?tab=${tab}`;
    }
  };
  
  const navigation = [
    { name: 'Home', tab: 'overview', icon: Home },
    { name: 'Visits', tab: 'appointments', icon: Calendar },
    { name: 'Records', tab: 'records', icon: FileText },
    { name: 'Messages', tab: 'messages', icon: Mail },
    { name: 'Profile', tab: 'profile', icon: UserRound },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-border z-10">
      <div className="grid grid-cols-5 h-16">
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
                "flex flex-col items-center justify-center h-full rounded-none",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}