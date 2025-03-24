import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{success: boolean; user: User}, Error, LoginCredentials>;
  registerMutation: UseMutationResult<{success: boolean; user: User}, Error, RegisterCredentials>;
  logoutMutation: UseMutationResult<{success: boolean}, Error, void>;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterCredentials = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: authData,
    error,
    isLoading,
  } = useQuery<{isLoggedIn: boolean; user?: User}>({
    queryKey: ["/api/auth/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1, // Limit retry attempts in case of auth issues
  });

  const user = authData?.isLoggedIn && authData?.user ? authData.user : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Login attempt with:", credentials.username);
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const result = await res.json();
      console.log("Login response:", result);
      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.fullName}!`,
          variant: "default",
        });
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterCredentials) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Could not register account",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({
        title: "Logout successful",
        description: "You have been logged out",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}