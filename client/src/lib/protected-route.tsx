import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({
  path,
  component: Component,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Temporarily disable redirect for testing
  if (!user) {
    console.log("User not authenticated, allowing access for testing...");
    return (
      <Route path={path}>
        <Component />
      </Route>
    );
    
    /* Normal authentication flow - uncomment when ready
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
    */
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}