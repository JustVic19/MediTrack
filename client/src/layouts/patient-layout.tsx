import { ReactNode } from "react";
import { PatientSidebar } from "@/components/patient-portal/patient-sidebar";
import { PatientMobileHeader, PatientMobileBottomNav } from "@/components/patient-portal/patient-mobile-nav";
import { usePatientAuth } from "@/hooks/use-patient-auth";

interface PatientLayoutProps {
  children: ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  // We don't need to handle auth redirects here anymore
  // since PatientProtectedRoute handles that logic
  const { patient } = usePatientAuth();

  // For debugging - this helps identify if the patient data is available in the layout
  console.log("PatientLayout rendering with patient:", patient?.firstName || "no patient data");

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