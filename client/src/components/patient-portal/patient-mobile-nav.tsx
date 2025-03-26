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
        <button
          type="button"
          className="p-2 rounded-md text-muted-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {isOpen && <PatientMobileMenu patient={patient} setIsOpen={setIsOpen} />}
    </>
  );
}

function PatientMobileMenu({ patient, setIsOpen }: { 
  patient: any, 
  setIsOpen: (open: boolean) => void 
}) {
  const [location] = useLocation();
  const { logoutMutation } = usePatientAuth();
  
  const navigation = [
    { name: 'Overview', href: '/patient-portal', icon: Home },
    { name: 'Appointments', href: '/patient-portal?tab=appointments', icon: Calendar },
    { name: 'Medical Records', href: '/patient-portal?tab=records', icon: FileText },
    { name: 'Messages', href: '/patient-portal?tab=messages', icon: Mail },
    { name: 'My Profile', href: '/patient-portal?tab=profile', icon: UserRound },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden absolute inset-x-0 top-14 z-40 bg-background border-b border-border shadow-lg">
      <div className="pt-2 pb-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || 
            (item.href.includes('?tab=') && location.includes(item.href.split('?tab=')[1]));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium",
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
            </Link>
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
  const [location] = useLocation();
  
  const navigation = [
    { name: 'Home', href: '/patient-portal', icon: Home },
    { name: 'Visits', href: '/patient-portal?tab=appointments', icon: Calendar },
    { name: 'Records', href: '/patient-portal?tab=records', icon: FileText },
    { name: 'Messages', href: '/patient-portal?tab=messages', icon: Mail },
    { name: 'Profile', href: '/patient-portal?tab=profile', icon: UserRound },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-border z-10">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = location === item.href || 
            (item.href.includes('?tab=') && location.includes(item.href.split('?tab=')[1]));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}