import { ReactNode, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import { Loader2 } from "lucide-react";

interface PatientProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function PatientProtectedRoute({
  path,
  component: Component,
}: PatientProtectedRouteProps) {
  const [, navigate] = useLocation();
  const { patient, isLoading } = usePatientAuth();

  // Handle the redirection outside of render phase
  useEffect(() => {
    if (!isLoading && !patient) {
      console.log("No patient auth, redirecting to login");
      // Use direct window.location for consistent navigation behavior
      window.location.href = "/patient-login";
    }
  }, [patient, isLoading]);

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth status
        if (isLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Don't render anything while redirect is happening
        if (!patient) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Render the protected component if authenticated
        return <Component />;
      }}
    </Route>
  );
}