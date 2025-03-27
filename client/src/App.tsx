import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { PatientProtectedRoute } from "@/lib/patient-protected-route";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { PatientAuthProvider } from "@/hooks/use-patient-auth";
import { ThemeProvider } from "@/components/theme-provider";

import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import HealthTimeline from "@/pages/health-timeline";
import HealthTimelines from "@/pages/health-timelines";
import Appointments from "@/pages/appointments";
import PatientHistory from "@/pages/patient-history";
import Settings from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import SymptomChecker from "@/pages/symptom-checker";
import Notifications from "@/pages/notifications";
import AuthPage from "@/pages/auth-page";
import PatientPortal from "@/pages/patient-portal";
import PatientLogin from "@/pages/patient-login";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/main-layout";

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/patient-login" component={PatientLogin} />

      {/* Protected routes - wrapped in MainLayout */}
      <ProtectedRoute 
        path="/" 
        component={() => (
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )} 
      />
      
      <PatientProtectedRoute path="/patient-portal" component={PatientPortal} />
      
      <ProtectedRoute 
        path="/patients" 
        component={() => (
          <MainLayout>
            <Patients />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/patients/:id" 
        component={() => (
          <MainLayout>
            <PatientDetail />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/appointments" 
        component={() => (
          <MainLayout>
            <Appointments />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/patient-history" 
        component={() => (
          <MainLayout>
            <PatientHistory />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/settings" 
        component={() => (
          <MainLayout>
            <Settings />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/profile" 
        component={() => (
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/health-timeline/:id" 
        component={() => (
          <MainLayout>
            <HealthTimeline />
          </MainLayout>
        )} 
      />

      <ProtectedRoute 
        path="/health-timelines" 
        component={() => (
          <MainLayout>
            <HealthTimelines />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/symptom-checker" 
        component={() => (
          <MainLayout>
            <SymptomChecker />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/symptom-checker/:id" 
        component={() => (
          <MainLayout>
            <SymptomChecker />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/patients/:patientId/symptom-checker" 
        component={() => (
          <MainLayout>
            <SymptomChecker />
          </MainLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/notifications" 
        component={() => (
          <MainLayout>
            <Notifications />
          </MainLayout>
        )} 
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="meditrack-theme">
        <AuthProvider>
          <PatientAuthProvider>
            <AppRoutes />
            <Toaster />
          </PatientAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
