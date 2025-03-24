import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import Appointments from "@/pages/appointments";
import PatientHistory from "@/pages/patient-history";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/main-layout";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [location, setLocation] = useLocation();

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
        const data = await response.json();
        setIsLoggedIn(data.isLoggedIn);
        
        // Redirect to login if not logged in and not already on login/register pages
        if (!data.isLoggedIn && 
            !location.includes("/login") && 
            !location.includes("/register")) {
          setLocation("/login");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsLoggedIn(false);
      }
    };
    
    checkAuthStatus();
  }, [location, setLocation]);

  // Handle auth-only routes vs public routes
  const renderRoutes = () => {
    // Public routes (accessible without login)
    if (!isLoggedIn && (location === "/login" || location === "/register")) {
      return (
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={Login} /> {/* Fallback to login for any other route */}
        </Switch>
      );
    }
    
    // Protected routes (require login)
    return (
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/patients/:id" component={PatientDetail} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/patient-history" component={PatientHistory} />
          <Route path="/settings" component={Settings} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    );
  };

  return (
    <>
      {renderRoutes()}
      <Toaster />
    </>
  );
}

export default App;
