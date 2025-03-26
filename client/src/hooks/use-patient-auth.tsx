import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation, UseMutationResult } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Basic patient info type
export type PatientInfo = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: Date;
  portalLastLogin: Date | null;
};

type PatientAuthContextType = {
  patient: PatientInfo | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ success: boolean; patient: PatientInfo }, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<{ success: boolean }, Error, void>;
  activateMutation: UseMutationResult<{ success: boolean }, Error, ActivateCredentials>;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type ActivateCredentials = {
  patientId: string;
  token: string;
  password: string;
};

export const PatientAuthContext = createContext<PatientAuthContextType | null>(null);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Get current authenticated patient
  const {
    data,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['/api/patient/auth-status'],
    queryFn: async () => {
      const res = await fetch('/api/patient/auth-status');
      if (!res.ok) throw new Error('Failed to check authentication status');
      return res.json();
    },
  });

  // Patient login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest('POST', '/api/patient/login', credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/patient/auth-status'], { 
        isLoggedIn: true, 
        patient: data.patient 
      });
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.patient.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Patient logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/patient/logout');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/patient/auth-status'], { isLoggedIn: false });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Patient account activation
  const activateMutation = useMutation({
    mutationFn: async (data: ActivateCredentials) => {
      const res = await apiRequest('POST', '/api/patient/set-password', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account activated',
        description: 'Your account has been activated successfully. You can now login.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Activation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <PatientAuthContext.Provider
      value={{
        patient: data?.isLoggedIn ? data.patient : null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        activateMutation,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
}