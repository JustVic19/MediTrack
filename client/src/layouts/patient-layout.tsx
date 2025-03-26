import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { PatientSidebar } from "@/components/patient-portal/patient-sidebar";
import { PatientMobileHeader, PatientMobileBottomNav } from "@/components/patient-portal/patient-mobile-nav";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import { Loader2 } from "lucide-react";

interface PatientLayoutProps {
  children: ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const [, navigate] = useLocation();
  const { patient, isLoading } = usePatientAuth();

  useEffect(() => {
    // If not loading and no patient is found, redirect to login
    if (!isLoading && !patient) {
      navigate("/patient-login");
    }
  }, [patient, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated yet (loading state not finished), show nothing
  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Desktop */}
      <PatientSidebar />
      
      {/* Mobile Header */}
      <PatientMobileHeader />
      
      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pb-16 md:pb-0">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <PatientMobileBottomNav />
    </div>
  );
}