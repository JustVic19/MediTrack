import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import HealthTimeline from "@/pages/health-timeline";
import Appointments from "@/pages/appointments";
import PatientHistory from "@/pages/patient-history";
import Settings from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/main-layout";

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />

      {/* Protected routes - wrapped in MainLayout */}
      <ProtectedRoute 
        path="/" 
        component={() => (
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )} 
      />
      
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
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
